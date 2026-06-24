const StudioOwnerRepository = require('@app/repository/studio-owner');
const {
  OWNER_ERROR_CODES,
  findOwner,
  serializeOwnerSession,
  throwOwnerError,
  validateOwnerCredentials,
} = require('./owner-helpers');

async function registerOwner(serviceData) {
  const data = validateOwnerCredentials(serviceData);
  const existingOwner = await findOwner(data.creator_reference);

  if (existingOwner) {
    throwOwnerError('Creator reference already exists', OWNER_ERROR_CODES.ALREADY_EXISTS);
  }

  const owner = await StudioOwnerRepository.create({
    creator_reference: data.creator_reference,
    editor_code: data.editor_code,
    deleted: null,
  });

  return serializeOwnerSession(owner, []);
}

module.exports = registerOwner;
