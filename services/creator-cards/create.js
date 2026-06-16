const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const {
  BUSINESS_ERROR_CODES,
  appendSlugSuffix,
  limitSlugLength,
  normalizeServiceRates,
  serializeCreatorCard,
  slugifyTitle,
  throwBusinessError,
  validateAccessCodeFormat,
  validateLinks,
  validateRateAmounts,
  validateSlugFormat,
} = require('./helpers');

const createCreatorCardSpec = `root {
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
}`;

const parsedCreateCreatorCardSpec = validator.parse(createCreatorCardSpec);
const MAX_CREATE_RETRIES = 5;

async function slugExists(slug) {
  const existingCard = await CreatorCardRepository.findOne({
    query: { slug },
    projections: { _id: 1 },
  });

  return !!existingCard;
}

async function resolveSlug(data) {
  const { slug: providedSlug } = data;
  let slug = providedSlug;

  if (slug) {
    validateSlugFormat(slug);

    if (await slugExists(slug)) {
      throwBusinessError(CreatorCardMessages.SLUG_TAKEN, BUSINESS_ERROR_CODES.SLUG_TAKEN);
    }
  } else {
    const baseSlug = limitSlugLength(slugifyTitle(data.title));
    slug = baseSlug;

    if (slug.length < 5 || (await slugExists(slug))) {
      do {
        slug = appendSlugSuffix(baseSlug);
        // Slug uniqueness has to be checked per generated candidate.
        // eslint-disable-next-line no-await-in-loop
      } while (await slugExists(slug));
    }
  }

  return slug;
}

function isDuplicateSlugError(error) {
  return error.errorCode === 'DUPLICATE_RECORD' && /slug/.test(error.message || '');
}

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedCreateCreatorCardSpec);

  const accessType = data.access_type || 'public';

  if (accessType === 'private' && !data.access_code) {
    throwBusinessError(
      CreatorCardMessages.PRIVATE_ACCESS_CODE_REQUIRED,
      BUSINESS_ERROR_CODES.ACCESS_CODE_REQUIRED
    );
  }

  if (accessType === 'public' && data.access_code) {
    throwBusinessError(
      CreatorCardMessages.PUBLIC_ACCESS_CODE_FORBIDDEN,
      BUSINESS_ERROR_CODES.ACCESS_CODE_FORBIDDEN
    );
  }

  if (data.access_code) {
    validateAccessCodeFormat(data.access_code);
  }

  validateLinks(data.links);
  validateRateAmounts(data.service_rates);

  const clientProvidedSlug = !!data.slug;
  const slug = await resolveSlug(data);
  const cardToCreate = {
    title: data.title,
    description: data.description,
    slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: normalizeServiceRates(data.service_rates),
    status: data.status,
    access_type: accessType,
    access_code: accessType === 'private' ? data.access_code : null,
    deleted: null,
  };

  let createdCard;

  for (let attempts = 0; attempts < MAX_CREATE_RETRIES && !createdCard; attempts += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      createdCard = await CreatorCardRepository.create(cardToCreate);
    } catch (error) {
      if (!isDuplicateSlugError(error)) {
        throw error;
      }

      if (clientProvidedSlug) {
        throwBusinessError(CreatorCardMessages.SLUG_TAKEN, BUSINESS_ERROR_CODES.SLUG_TAKEN);
      }

      cardToCreate.slug = appendSlugSuffix(slug);
    }
  }

  if (!createdCard) {
    throwBusinessError(CreatorCardMessages.SLUG_TAKEN, BUSINESS_ERROR_CODES.SLUG_TAKEN);
  }

  const response = serializeCreatorCard(createdCard);

  return response;
}

module.exports = createCreatorCard;
