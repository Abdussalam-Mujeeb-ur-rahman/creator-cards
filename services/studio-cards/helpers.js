const crypto = require('crypto');
const { throwAppError } = require('@app-core/errors');
const StudioCardRepository = require('@app/repository/studio-card');
const StudioCardMessages = require('@app/messages/studio-card');
const { DEFAULT_LAYOUT, DEFAULT_THEME, findTemplate } = require('./templates');

const STUDIO_ERROR_CODES = {
  NOT_FOUND: 'ST01',
  EDITOR_CODE_REQUIRED: 'ED01',
  INVALID_EDITOR_CODE: 'ED02',
  INVALID_TEMPLATE: 'TP01',
  INVALID_EXPORT_TYPE: 'EX01',
  INVALID_EVENT_TYPE: 'EV01',
};

const EDITOR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function throwStudioError(message, code) {
  throwAppError(message, code);
}

function createEditorCode(length = 10) {
  let code = '';

  while (code.length < length) {
    code += EDITOR_ALPHABET[crypto.randomInt(0, EDITOR_ALPHABET.length)];
  }

  return code;
}

function resolveTemplate(templateKey = 'minimal') {
  const template = findTemplate(templateKey);

  if (!template) {
    throwStudioError(StudioCardMessages.INVALID_TEMPLATE, STUDIO_ERROR_CODES.INVALID_TEMPLATE);
  }

  return template;
}

function mergeTheme(theme = {}, templateKey = 'minimal') {
  const template = resolveTemplate(templateKey);

  return {
    ...DEFAULT_THEME,
    ...template.default_theme,
    ...theme,
  };
}

function mergeLayout(layout = {}, templateKey = 'minimal') {
  const template = resolveTemplate(templateKey);

  return {
    ...DEFAULT_LAYOUT,
    ...template.default_layout,
    ...layout,
  };
}

function normalizeMedia(media = {}) {
  return {
    avatar_url: media.avatar_url || null,
    cover_url: media.cover_url || null,
    logo_url: media.logo_url || null,
  };
}

function normalizeContact(contact = {}) {
  return {
    email: contact.email || null,
    phone: contact.phone || null,
    whatsapp: contact.whatsapp || null,
    website: contact.website || null,
  };
}

function serializeStudioCard(studioCard, creatorCard, options = {}) {
  const { includeEditorCode = false } = options;
  const response = {
    id: studioCard._id,
    creator_card_id: studioCard.creator_card_id,
    slug: studioCard.slug,
    creator_reference: studioCard.creator_reference,
    template_key: studioCard.template_key,
    theme: studioCard.theme,
    layout: studioCard.layout,
    media: studioCard.media,
    contact: studioCard.contact,
    creator_card: creatorCard,
    share: {
      path: `/v1/studio/cards/${studioCard.slug}/public`,
      slug: studioCard.slug,
    },
    created: studioCard.created,
    updated: studioCard.updated,
    deleted: studioCard.deleted === undefined ? null : studioCard.deleted,
  };

  if (includeEditorCode) {
    response.editor_code = studioCard.editor_code;
  }

  return response;
}

async function findStudioCard(slug) {
  const studioCard = await StudioCardRepository.findOne({
    query: { slug, deleted: null },
  });

  if (!studioCard) {
    throwStudioError(StudioCardMessages.STUDIO_CARD_NOT_FOUND, STUDIO_ERROR_CODES.NOT_FOUND);
  }

  return studioCard;
}

function assertEditorCode(studioCard, editorCode) {
  if (!editorCode) {
    throwStudioError(
      StudioCardMessages.EDITOR_CODE_REQUIRED,
      STUDIO_ERROR_CODES.EDITOR_CODE_REQUIRED
    );
  }

  if (studioCard.editor_code !== editorCode) {
    throwStudioError(
      StudioCardMessages.INVALID_EDITOR_CODE,
      STUDIO_ERROR_CODES.INVALID_EDITOR_CODE
    );
  }
}

function createEmptyAnalytics() {
  return {
    total_views: 0,
    total_clicks: 0,
    total_exports: 0,
    total_shares: 0,
    total_orders: 0,
    top_links: [],
    daily_totals: [],
  };
}

module.exports = {
  STUDIO_ERROR_CODES,
  assertEditorCode,
  createEditorCode,
  createEmptyAnalytics,
  findStudioCard,
  mergeLayout,
  mergeTheme,
  normalizeContact,
  normalizeMedia,
  resolveTemplate,
  serializeStudioCard,
  throwStudioError,
};
