const validator = require('@app-core/validator');
const StudioCardRepository = require('@app/repository/studio-card');
const StudioOwnerRepository = require('@app/repository/studio-owner');
const createCreatorCard = require('@app/services/creator-cards/create');
const {
  createEditorCode,
  mergeLayout,
  mergeTheme,
  normalizeContact,
  normalizeMedia,
  resolveTemplate,
  serializeStudioCard,
} = require('./helpers');

const createStudioCardSpec = `root {
  title string<trim|lengthbetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lengthbetween:5,50>
  creator_reference string<trim|length:20>
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
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
  template_key? string<trim>
  theme? object
  layout? object
  media? object
  contact? object
}`;

const parsedCreateStudioCardSpec = validator.parse(createStudioCardSpec);

async function createStudioCard(serviceData) {
  const data = validator.validate(serviceData, parsedCreateStudioCardSpec);
  const templateKey = data.template_key || 'minimal';

  resolveTemplate(templateKey);

  const creatorCard = await createCreatorCard({
    title: data.title,
    description: data.description,
    slug: data.slug,
    creator_reference: data.creator_reference,
    links: data.links,
    service_rates: data.service_rates,
    status: data.status,
    access_type: data.access_type,
    access_code: data.access_code,
  });

  const owner = await StudioOwnerRepository.findOne({
    query: { creator_reference: creatorCard.creator_reference, deleted: null },
  });

  const studioCard = await StudioCardRepository.create({
    creator_card_id: creatorCard.id,
    slug: creatorCard.slug,
    creator_reference: creatorCard.creator_reference,
    editor_code: owner?.editor_code || createEditorCode(),
    template_key: templateKey,
    theme: mergeTheme(data.theme, templateKey),
    layout: mergeLayout(data.layout, templateKey),
    media: normalizeMedia(data.media),
    contact: normalizeContact(data.contact),
    deleted: null,
  });

  return serializeStudioCard(studioCard, creatorCard, { includeEditorCode: true });
}

module.exports = createStudioCard;
