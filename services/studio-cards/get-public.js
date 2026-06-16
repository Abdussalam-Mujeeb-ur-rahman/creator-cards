const getCreatorCard = require('@app/services/creator-cards/get');
const { findStudioCard, serializeStudioCard } = require('./helpers');

async function getPublicStudioCard(serviceData) {
  const studioCard = await findStudioCard(serviceData.slug);
  const creatorCard = await getCreatorCard({
    slug: serviceData.slug,
    access_code: serviceData.access_code,
  });

  return serializeStudioCard(studioCard, creatorCard, { includeEditorCode: false });
}

module.exports = getPublicStudioCard;
