const validator = require('@app-core/validator');
const { throwAppError } = require('@app-core/errors');
const CreatorCardRepository = require('@app/repository/creator-card');
const StudioCardRepository = require('@app/repository/studio-card');
const StudioOwnerRepository = require('@app/repository/studio-owner');
const { serializeCreatorCard } = require('@app/services/creator-cards/helpers');
const { serializeStudioCard } = require('./helpers');

const OWNER_ERROR_CODES = {
  NOT_FOUND: 'OW01',
  INVALID_EDITOR_CODE: 'OW02',
  ALREADY_EXISTS: 'OW03',
};

const ownerCredentialsSpec = `root {
  creator_reference string<trim|length:20>
  editor_code string<trim|lengthbetween:6,32>
}`;

const parsedOwnerCredentialsSpec = validator.parse(ownerCredentialsSpec);

function throwOwnerError(message, code) {
  throwAppError(message, code);
}

function validateOwnerCredentials(serviceData) {
  const data = validator.validate(serviceData, parsedOwnerCredentialsSpec);

  if (!/^[A-Za-z0-9_-]+$/.test(data.editor_code)) {
    throwOwnerError('editor_code must be 6-32 characters using letters, numbers, underscores, or hyphens', 'SPCL_VALIDATION');
  }

  return data;
}

async function findOwner(creatorReference) {
  return StudioOwnerRepository.findOne({
    query: { creator_reference: creatorReference, deleted: null },
  });
}

async function listOwnerCards(creatorReference) {
  const studioCards = await StudioCardRepository.findMany({
    query: { creator_reference: creatorReference, deleted: null },
    options: { sort: { updated: -1, created: -1 } },
  });

  const cards = await Promise.all(
    studioCards.map(async (studioCard) => {
      const creatorCard = await CreatorCardRepository.findOne({
        query: { _id: studioCard.creator_card_id, deleted: null },
      });

      if (!creatorCard) return null;

      return serializeStudioCard(studioCard, serializeCreatorCard(creatorCard), {
        includeEditorCode: true,
      });
    })
  );

  return cards.filter(Boolean);
}

function serializeOwnerSession(owner, cards = []) {
  return {
    creator_reference: owner.creator_reference,
    editor_code: owner.editor_code,
    cards,
    created: owner.created,
    updated: owner.updated,
  };
}

module.exports = {
  OWNER_ERROR_CODES,
  findOwner,
  listOwnerCards,
  serializeOwnerSession,
  throwOwnerError,
  validateOwnerCredentials,
};
