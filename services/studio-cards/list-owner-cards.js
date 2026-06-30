const {
  findOwner,
  listOwnerCards,
  throwOwnerError,
  OWNER_ERROR_CODES,
  validateOwnerCardListRequest,
} = require('./owner-helpers');

async function listPublishedOwnerCards(serviceData) {
  const data = validateOwnerCardListRequest(serviceData);
  const owner = await findOwner(data.creator_reference);

  if (!owner) {
    throwOwnerError('Creator reference does not exist', OWNER_ERROR_CODES.NOT_FOUND);
  }

  if (owner.editor_code !== data.editor_code) {
    throwOwnerError('Invalid editor_code', OWNER_ERROR_CODES.INVALID_EDITOR_CODE);
  }

  const cards = await listOwnerCards(data.creator_reference);

  if (!data.status) return cards;

  return cards.filter((card) => card?.creator_card?.status === data.status);
}

module.exports = listPublishedOwnerCards;
