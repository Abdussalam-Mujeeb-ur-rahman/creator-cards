const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const CreatorCardMessages = require('@app/messages/creator-card');
const { BUSINESS_ERROR_CODES, serializeCreatorCard, throwBusinessError } = require('./helpers');

const deleteCreatorCardSpec = `root {
  slug string<trim|lengthbetween:5,50>
  creator_reference string<trim|length:20>
}`;

const parsedDeleteCreatorCardSpec = validator.parse(deleteCreatorCardSpec);

async function deleteCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedDeleteCreatorCardSpec);

  const card = await CreatorCardRepository.findOne({
    query: { slug: data.slug, deleted: null },
  });

  if (!card) {
    throwBusinessError(CreatorCardMessages.CARD_NOT_FOUND, BUSINESS_ERROR_CODES.CARD_NOT_FOUND);
  }

  if (card.creator_reference !== data.creator_reference) {
    throwBusinessError(CreatorCardMessages.CARD_NOT_FOUND, BUSINESS_ERROR_CODES.CARD_NOT_FOUND);
  }

  const deletedTimestamp = Date.now();

  await CreatorCardRepository.updateOne({
    query: { slug: data.slug, creator_reference: data.creator_reference, deleted: null },
    updateValues: { deleted: deletedTimestamp },
  });

  const response = serializeCreatorCard({
    ...card,
    updated: deletedTimestamp,
    deleted: deletedTimestamp,
  });

  return response;
}

module.exports = deleteCreatorCard;
