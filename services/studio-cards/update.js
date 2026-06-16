const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const StudioCardRepository = require('@app/repository/studio-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const {
  BUSINESS_ERROR_CODES,
  normalizeServiceRates,
  serializeCreatorCard,
  throwBusinessError,
  validateAccessCodeFormat,
  validateLinks,
  validateRateAmounts,
} = require('@app/services/creator-cards/helpers');
const {
  assertEditorCode,
  findStudioCard,
  mergeLayout,
  mergeTheme,
  normalizeContact,
  normalizeMedia,
  resolveTemplate,
  serializeStudioCard,
} = require('./helpers');

const updateStudioCardSpec = `root {
  slug string<trim|lengthbetween:5,50>
  editor_code string<trim>
  title? string<trim|lengthbetween:3,100>
  description? string<trim|maxLength:500>
  links[]? {
    title string<trim|lengthbetween:1,100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|lengthbetween:3,100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status? string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
  template_key? string<trim>
  theme? object
  layout? object
  media? object
  contact? object
}`;

const parsedUpdateStudioCardSpec = validator.parse(updateStudioCardSpec);

function buildCreatorCardUpdates(data, creatorCard) {
  const updates = {};

  ['title', 'description', 'links', 'status'].forEach((field) => {
    if (typeof data[field] !== 'undefined') updates[field] = data[field];
  });

  if (typeof data.service_rates !== 'undefined') {
    updates.service_rates = normalizeServiceRates(data.service_rates);
  }

  if (typeof data.access_type !== 'undefined') {
    updates.access_type = data.access_type;
  }

  const nextAccessType = updates.access_type || creatorCard.access_type || 'public';

  if (data.access_code) {
    validateAccessCodeFormat(data.access_code);
  }

  if (nextAccessType === 'public' && data.access_code) {
    throwBusinessError(
      CreatorCardMessages.PUBLIC_ACCESS_CODE_FORBIDDEN,
      BUSINESS_ERROR_CODES.ACCESS_CODE_FORBIDDEN
    );
  }

  if (nextAccessType === 'private' && !data.access_code && !creatorCard.access_code) {
    throwBusinessError(
      CreatorCardMessages.PRIVATE_ACCESS_CODE_REQUIRED,
      BUSINESS_ERROR_CODES.ACCESS_CODE_REQUIRED
    );
  }

  if (nextAccessType === 'public') {
    updates.access_code = null;
  } else if (data.access_code) {
    updates.access_code = data.access_code;
  }

  return updates;
}

async function updateStudioCard(serviceData) {
  const data = validator.validate(serviceData, parsedUpdateStudioCardSpec);
  const studioCard = await findStudioCard(data.slug);
  assertEditorCode(studioCard, data.editor_code);

  if (data.template_key) {
    resolveTemplate(data.template_key);
  }

  validateLinks(data.links);
  validateRateAmounts(data.service_rates);

  const creatorCard = await CreatorCardRepository.findOne({
    query: { _id: studioCard.creator_card_id, deleted: null },
  });
  const creatorCardUpdates = buildCreatorCardUpdates(data, creatorCard);

  if (Object.keys(creatorCardUpdates).length) {
    await CreatorCardRepository.updateOne({
      query: { _id: studioCard.creator_card_id, deleted: null },
      updateValues: creatorCardUpdates,
    });
  }

  const nextTemplateKey = data.template_key || studioCard.template_key;
  const studioUpdates = {};

  if (data.template_key) studioUpdates.template_key = data.template_key;
  if (data.theme) studioUpdates.theme = mergeTheme(data.theme, nextTemplateKey);
  if (data.layout) studioUpdates.layout = mergeLayout(data.layout, nextTemplateKey);
  if (data.media) studioUpdates.media = normalizeMedia(data.media);
  if (data.contact) studioUpdates.contact = normalizeContact(data.contact);

  if (Object.keys(studioUpdates).length) {
    await StudioCardRepository.updateOne({
      query: { slug: data.slug, deleted: null },
      updateValues: studioUpdates,
    });
  }

  const updatedStudioCard = await findStudioCard(data.slug);
  const updatedCreatorCard = await CreatorCardRepository.findOne({
    query: { _id: studioCard.creator_card_id, deleted: null },
  });

  return serializeStudioCard(updatedStudioCard, serializeCreatorCard(updatedCreatorCard), {
    includeEditorCode: true,
  });
}

module.exports = updateStudioCard;
