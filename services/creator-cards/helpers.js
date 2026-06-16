const crypto = require('crypto');
const { throwAppError } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');

const BUSINESS_ERROR_CODES = {
  SLUG_TAKEN: 'SL02',
  ACCESS_CODE_REQUIRED: 'AC01',
  ACCESS_CODE_FORBIDDEN: 'AC05',
  CARD_NOT_FOUND: 'NF01',
  DRAFT_CARD_NOT_PUBLIC: 'NF02',
  PRIVATE_ACCESS_CODE_REQUIRED: 'AC03',
  INVALID_ACCESS_CODE: 'AC04',
};

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SLUG_MAX_LENGTH = 50;
const SLUG_SUFFIX_LENGTH = 6;

function throwValidationError(message) {
  throwAppError(message, 'SPCL_VALIDATION');
}

function throwBusinessError(message, code) {
  throwAppError(message, code);
}

function createRandomSuffix(length = 6) {
  let suffix = '';

  while (suffix.length < length) {
    const index = crypto.randomInt(0, ALPHANUMERIC.length);
    suffix += ALPHANUMERIC[index].toLowerCase();
  }

  return suffix;
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

function limitSlugLength(slug, maxLength = SLUG_MAX_LENGTH) {
  return slug.slice(0, maxLength).replace(/-+$/g, '');
}

function appendSlugSuffix(baseSlug, suffix = createRandomSuffix(SLUG_SUFFIX_LENGTH)) {
  const usableBaseSlug = baseSlug || 'card';
  const maxBaseLength = SLUG_MAX_LENGTH - suffix.length - 1;
  const limitedBaseSlug = limitSlugLength(usableBaseSlug, maxBaseLength) || 'card';

  return `${limitedBaseSlug}-${suffix}`;
}

function serializeCreatorCard(card, options = {}) {
  const { includeAccessCode = true } = options;
  const response = {
    id: card._id,
    title: card.title,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links || [],
    status: card.status,
    access_type: card.access_type || 'public',
    created: card.created,
    updated: card.updated,
    deleted: card.deleted === undefined ? null : card.deleted,
  };

  if (card.description !== undefined) {
    response.description = card.description;
  }

  if (card.service_rates !== undefined) {
    response.service_rates = card.service_rates;
  }

  if (includeAccessCode) {
    response.access_code = card.access_code || null;
  }

  return response;
}

function validateSlugFormat(slug) {
  if (!/^[A-Za-z0-9_-]+$/.test(slug)) {
    throwValidationError(CreatorCardMessages.INVALID_SLUG);
  }
}

function validateAccessCodeFormat(accessCode) {
  if (!/^[A-Za-z0-9]{6}$/.test(accessCode)) {
    throwValidationError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT);
  }
}

function validateLinks(links = []) {
  links.forEach((link) => {
    if (!/^https?:\/\//.test(link.url)) {
      throwValidationError(CreatorCardMessages.INVALID_LINK_URL);
    }
  });
}

function validateRateAmounts(serviceRates) {
  if (!serviceRates) return;

  serviceRates.rates.forEach((rate) => {
    if (!Number.isInteger(rate.amount) || rate.amount < 1) {
      throwValidationError(CreatorCardMessages.INVALID_RATE_AMOUNT);
    }
  });
}

function normalizeServiceRates(serviceRates) {
  if (!serviceRates) return undefined;

  return {
    currency: serviceRates.currency,
    rates: serviceRates.rates.map((rate) => ({
      name: rate.name,
      description: rate.description,
      amount: rate.amount,
    })),
  };
}

module.exports = {
  BUSINESS_ERROR_CODES,
  appendSlugSuffix,
  createRandomSuffix,
  limitSlugLength,
  slugifyTitle,
  serializeCreatorCard,
  throwBusinessError,
  validateAccessCodeFormat,
  validateLinks,
  validateRateAmounts,
  validateSlugFormat,
  normalizeServiceRates,
};
