const CreatorCardRepository = require('@app/repository/creator-card');
const { serializeCreatorCard } = require('@app/services/creator-cards/helpers');
const { assertEditorCode, findStudioCard, serializeStudioCard } = require('./helpers');

async function getEditableStudioCard(serviceData) {
  const studioCard = await findStudioCard(serviceData.slug);
  assertEditorCode(studioCard, serviceData.editor_code);

  const creatorCard = await CreatorCardRepository.findOne({
    query: { _id: studioCard.creator_card_id, deleted: null },
  });

  return serializeStudioCard(studioCard, serializeCreatorCard(creatorCard), {
    includeEditorCode: true,
  });
}

module.exports = getEditableStudioCard;
