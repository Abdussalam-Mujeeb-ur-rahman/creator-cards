const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const { BUSINESS_ERROR_CODES, serializeCreatorCard, throwBusinessError } = require('./helpers');

async function getCreatorCard(serviceData) {
  const card = await CreatorCardRepository.findOne({
    query: { slug: serviceData.slug, deleted: null },
  });

  if (!card) {
    throwBusinessError(CreatorCardMessages.CARD_NOT_FOUND, BUSINESS_ERROR_CODES.CARD_NOT_FOUND);
  }

  if (card.status === 'draft') {
    throwBusinessError(
      CreatorCardMessages.DRAFT_CARD_NOT_PUBLIC,
      BUSINESS_ERROR_CODES.DRAFT_CARD_NOT_PUBLIC
    );
  }

  if (card.access_type === 'private' && !serviceData.access_code) {
    throwBusinessError(
      CreatorCardMessages.PRIVATE_CARD_ACCESS_CODE_REQUIRED,
      BUSINESS_ERROR_CODES.PRIVATE_ACCESS_CODE_REQUIRED
    );
  }

  if (card.access_type === 'private' && serviceData.access_code !== card.access_code) {
    throwBusinessError(
      CreatorCardMessages.INVALID_ACCESS_CODE,
      BUSINESS_ERROR_CODES.INVALID_ACCESS_CODE
    );
  }

  const response = serializeCreatorCard(card, { includeAccessCode: false });

  return response;
}

module.exports = getCreatorCard;
