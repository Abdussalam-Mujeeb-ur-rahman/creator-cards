const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-card');
const StudioCardRepository = require('@app/repository/studio-card');
const { serializeCreatorCard } = require('@app/services/creator-cards/helpers');
const { findStudioCard, serializeStudioCard, throwStudioError, STUDIO_ERROR_CODES } = require('./helpers');

const deleteStudioCardSpec = `root {
  slug string<trim|lengthbetween:5,50>
  creator_reference string<trim|length:20>
}`;

const parsedDeleteStudioCardSpec = validator.parse(deleteStudioCardSpec);

async function deleteStudioCard(serviceData) {
  const data = validator.validate(serviceData, parsedDeleteStudioCardSpec);
  const studioCard = await findStudioCard(data.slug);

  if (studioCard.creator_reference !== data.creator_reference) {
    throwStudioError('Studio card not found', STUDIO_ERROR_CODES.NOT_FOUND);
  }

  const creatorCard = await CreatorCardRepository.findOne({
    query: { _id: studioCard.creator_card_id, deleted: null },
  });

  if (!creatorCard) {
    throwStudioError('Studio card not found', STUDIO_ERROR_CODES.NOT_FOUND);
  }

  const deletedTimestamp = Date.now();

  await StudioCardRepository.updateOne({
    query: { slug: data.slug, creator_reference: data.creator_reference, deleted: null },
    updateValues: { deleted: deletedTimestamp, updated: deletedTimestamp },
  });

  await CreatorCardRepository.updateOne({
    query: { _id: studioCard.creator_card_id, deleted: null },
    updateValues: { deleted: deletedTimestamp, updated: deletedTimestamp },
  });

  return serializeStudioCard(
    { ...studioCard, deleted: deletedTimestamp, updated: deletedTimestamp },
    serializeCreatorCard({ ...creatorCard, deleted: deletedTimestamp, updated: deletedTimestamp }),
    { includeEditorCode: true }
  );
}

module.exports = deleteStudioCard;
