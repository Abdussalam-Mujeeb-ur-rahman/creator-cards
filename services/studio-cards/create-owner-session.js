const {
  OWNER_ERROR_CODES,
  findOwner,
  listOwnerCards,
  serializeOwnerSession,
  throwOwnerError,
  validateOwnerCredentials,
} = require('./owner-helpers');

async function createOwnerSession(serviceData) {
  const data = validateOwnerCredentials(serviceData);
  const owner = await findOwner(data.creator_reference);

  if (!owner) {
    throwOwnerError('Creator reference does not exist', OWNER_ERROR_CODES.NOT_FOUND);
  }

  if (owner.editor_code !== data.editor_code) {
    throwOwnerError('Invalid editor_code', OWNER_ERROR_CODES.INVALID_EDITOR_CODE);
  }

  const cards = await listOwnerCards(data.creator_reference);

  return serializeOwnerSession(owner, cards);
}

module.exports = createOwnerSession;
