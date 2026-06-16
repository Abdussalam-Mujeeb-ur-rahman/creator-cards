const validator = require('@app-core/validator');
const CardExportRepository = require('@app/repository/card-export');
const CardEventRepository = require('@app/repository/card-event');
const StudioCardMessages = require('@app/messages/studio-card');
const {
  STUDIO_ERROR_CODES,
  assertEditorCode,
  findStudioCard,
  throwStudioError,
} = require('./helpers');

const exportSpec = `root {
  slug string<trim|lengthbetween:5,50>
  editor_code string<trim>
  type string<trim>
}`;

const parsedExportSpec = validator.parse(exportSpec);

async function trackExport(serviceData) {
  const data = validator.validate(serviceData, parsedExportSpec);
  const studioCard = await findStudioCard(data.slug);
  assertEditorCode(studioCard, data.editor_code);

  if (!['png', 'pdf'].includes(data.type)) {
    throwStudioError(
      StudioCardMessages.INVALID_EXPORT_TYPE,
      STUDIO_ERROR_CODES.INVALID_EXPORT_TYPE
    );
  }

  const cardExport = await CardExportRepository.create({
    slug: data.slug,
    type: data.type,
  });

  await CardEventRepository.create({
    slug: data.slug,
    event_type: 'export',
    link_title: null,
    link_url: null,
    meta: { type: data.type },
  });

  return {
    id: cardExport._id,
    slug: cardExport.slug,
    type: cardExport.type,
    created: cardExport.created,
  };
}

module.exports = trackExport;
