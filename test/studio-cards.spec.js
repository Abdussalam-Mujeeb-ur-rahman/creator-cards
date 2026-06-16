const { expect } = require('chai');
const createMockServer = require('@app-core/mock-server');
const CreatorCardRepository = require('@app/repository/creator-card');
const StudioCardRepository = require('@app/repository/studio-card');
const CardEventRepository = require('@app/repository/card-event');
const CardExportRepository = require('@app/repository/card-export');
const createStudioCard = require('@app/services/studio-cards/create');
const getEditableStudioCard = require('@app/services/studio-cards/get-editable');
const getPublicStudioCard = require('@app/services/studio-cards/get-public');
const updateStudioCard = require('@app/services/studio-cards/update');
const getTemplates = require('@app/services/studio-cards/templates');
const trackEvent = require('@app/services/studio-cards/track-event');
const getAnalytics = require('@app/services/studio-cards/analytics');
const trackExport = require('@app/services/studio-cards/export');

function matchesQuery(entry, query) {
  return Object.entries(query).every(([key, value]) => entry[key] === value);
}

describe('studio cards', () => {
  const creatorCards = new Map();
  const studioCards = new Map();
  const cardEvents = [];
  const cardExports = [];
  let counter = 0;
  let server;

  beforeEach(() => {
    creatorCards.clear();
    studioCards.clear();
    cardEvents.length = 0;
    cardExports.length = 0;
    counter = 0;

    CreatorCardRepository.findOne = async ({ query }) =>
      Array.from(creatorCards.values()).find((card) => matchesQuery(card, query)) || null;

    CreatorCardRepository.create = async (data) => {
      const now = 1767052800000 + counter;
      const card = {
        _id: `01CREATORCARD${counter}`,
        ...data,
        created: now,
        updated: now,
      };

      counter += 1;
      creatorCards.set(card.slug, card);

      return card;
    };

    CreatorCardRepository.updateOne = async ({ query, updateValues }) => {
      const card = await CreatorCardRepository.findOne({ query });

      Object.assign(card, updateValues, { updated: updateValues.updated || Date.now() });

      return { acknowledged: true, modifiedCount: 1 };
    };

    StudioCardRepository.findOne = async ({ query }) =>
      Array.from(studioCards.values()).find((card) => matchesQuery(card, query)) || null;

    StudioCardRepository.create = async (data) => {
      const now = 1767052800000 + counter;
      const card = {
        _id: `01STUDIOCARD${counter}`,
        ...data,
        created: now,
        updated: now,
      };

      counter += 1;
      studioCards.set(card.slug, card);

      return card;
    };

    StudioCardRepository.updateOne = async ({ query, updateValues }) => {
      const card = await StudioCardRepository.findOne({ query });

      Object.assign(card, updateValues, { updated: updateValues.updated || Date.now() });

      return { acknowledged: true, modifiedCount: 1 };
    };

    CardEventRepository.create = async (data) => {
      const event = {
        _id: `01EVENT${counter}`,
        ...data,
        created: 1767052800000 + counter,
      };

      counter += 1;
      cardEvents.push(event);

      return event;
    };

    CardEventRepository.findMany = async ({ query }) =>
      cardEvents.filter((event) => matchesQuery(event, query));

    CardExportRepository.create = async (data) => {
      const cardExport = {
        _id: `01EXPORT${counter}`,
        ...data,
        created: 1767052800000 + counter,
      };

      counter += 1;
      cardExports.push(cardExport);

      return cardExport;
    };

    server = createMockServer(['endpoints/studio-cards'], { pathPrefix: '/v1' });
  });

  it('creates a base Creator Card and Studio Card with an editor_code', async () => {
    const created = await createStudioCard({
      title: 'George Cooks Studio',
      slug: 'george-cooks-studio',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      status: 'published',
      template_key: 'creator-pro',
      theme: { primary_color: '#123456' },
      layout: { links_style: 'grid' },
    });

    expect(created).to.include({
      slug: 'george-cooks-studio',
      template_key: 'creator-pro',
    });
    expect(created).to.have.property('editor_code').with.length(10);
    expect(created.creator_card).to.include({
      slug: 'george-cooks-studio',
      status: 'published',
    });
    expect(created.theme.primary_color).to.equal('#123456');
    expect(created.layout.links_style).to.equal('grid');
  });

  it('protects editable routes and omits editor_code from public routes', async () => {
    const created = await createStudioCard({
      title: 'VIP Studio Card',
      creator_reference: 'crt_x9y8z7w6v5u4t3s2',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    try {
      await getEditableStudioCard({ slug: created.slug });
      throw new Error('missing editor_code should fail');
    } catch (error) {
      expect(error.errorCode).to.equal('ED01');
    }

    try {
      await getEditableStudioCard({ slug: created.slug, editor_code: 'BADCODE' });
      throw new Error('wrong editor_code should fail');
    } catch (error) {
      expect(error.errorCode).to.equal('ED02');
    }

    const editable = await getEditableStudioCard({
      slug: created.slug,
      editor_code: created.editor_code,
    });

    expect(editable.editor_code).to.equal(created.editor_code);

    const publicCard = await getPublicStudioCard({
      slug: created.slug,
      access_code: 'A1B2C3',
    });

    expect(publicCard).not.to.have.property('editor_code');
    expect(publicCard.creator_card).not.to.have.property('access_code');
  });

  it('returns templates and persists theme/layout updates', async () => {
    const templates = await getTemplates();
    const keys = templates.map((template) => template.key);

    expect(keys).to.include.members(['minimal', 'creator-pro', 'tech-creator']);

    const created = await createStudioCard({
      title: 'Theme Update Card',
      creator_reference: 'crt_t1h2e3m4e5u6p7d8',
      status: 'published',
    });

    const updated = await updateStudioCard({
      slug: created.slug,
      editor_code: created.editor_code,
      title: 'Updated Theme Card',
      template_key: 'dark-studio',
      theme: { primary_color: '#000000', button_style: 'outline' },
      layout: { rates_style: 'table' },
      media: { avatar_url: 'https://example.com/avatar.png' },
      contact: { website: 'https://example.com' },
    });

    expect(updated.template_key).to.equal('dark-studio');
    expect(updated.theme.primary_color).to.equal('#000000');
    expect(updated.layout.rates_style).to.equal('table');
    expect(updated.media.avatar_url).to.equal('https://example.com/avatar.png');
    expect(updated.contact.website).to.equal('https://example.com');
    expect(updated.creator_card.title).to.equal('Updated Theme Card');
  });

  it('tracks views, clicks, exports, order intents, and analytics', async () => {
    const created = await createStudioCard({
      title: 'Analytics Card',
      creator_reference: 'crt_a1n2a3l4y5t6i7c8',
      status: 'published',
    });

    await trackEvent({ slug: created.slug, event_type: 'view' });
    await trackEvent({
      slug: created.slug,
      event_type: 'link_click',
      link_title: 'YouTube',
      link_url: 'https://youtube.com/@creator',
    });
    await trackEvent({
      slug: created.slug,
      event_type: 'order_intent',
      meta: {
        selected_rate: {
          name: 'Sponsored Reel',
          amount: 150000,
          currency: 'NGN',
        },
        customer_name: 'Ada',
        whatsapp_url: 'https://wa.me/2348012345678',
      },
    });
    await trackExport({
      slug: created.slug,
      editor_code: created.editor_code,
      type: 'png',
    });

    const analytics = await getAnalytics({
      slug: created.slug,
      editor_code: created.editor_code,
    });

    expect(analytics).to.include({
      slug: created.slug,
      total_views: 1,
      total_clicks: 1,
      total_exports: 1,
      total_orders: 1,
    });
    expect(analytics.top_links[0]).to.deep.equal({ label: 'YouTube', clicks: 1 });
    expect(analytics.daily_totals[0]).to.include({ orders: 1 });
  });

  it('exposes the studio API through /v1 endpoint envelopes', async () => {
    const createResponse = await server.post('/v1/studio/cards', {
      body: {
        title: 'Endpoint Studio Card',
        slug: 'endpoint-studio-card',
        creator_reference: 'crt_e1n2d3p4o5i6n7t8',
        status: 'published',
        template_key: 'tech-creator',
      },
    });

    expect(createResponse.statusCode).to.equal(200);
    expect(createResponse.data.data).to.have.property('editor_code');

    const editorCode = createResponse.data.data.editor_code;
    const templatesResponse = await server.get('/v1/studio/templates');
    expect(templatesResponse.statusCode).to.equal(200);
    expect(templatesResponse.data.data).to.have.length(12);

    const publicResponse = await server.get('/v1/studio/cards/endpoint-studio-card/public');
    expect(publicResponse.statusCode).to.equal(200);
    expect(publicResponse.data.data).not.to.have.property('editor_code');

    await server.post('/v1/studio/cards/endpoint-studio-card/events/view', {
      body: {},
    });
    await server.post('/v1/studio/cards/endpoint-studio-card/events/click', {
      body: { link_title: 'Website', link_url: 'https://example.com' },
    });
    const orderResponse = await server.post('/v1/studio/cards/endpoint-studio-card/events/order', {
      body: {
        meta: {
          selected_rate: {
            name: 'Brand Strategy Call',
            amount: 50000,
            currency: 'NGN',
          },
          whatsapp_url: 'https://wa.me/2348012345678',
        },
      },
    });
    expect(orderResponse.statusCode).to.equal(200);
    expect(orderResponse.data.data.event_type).to.equal('order_intent');

    const exportResponse = await server.post('/v1/studio/cards/endpoint-studio-card/exports', {
      body: { editor_code: editorCode, type: 'pdf' },
    });
    expect(exportResponse.statusCode).to.equal(200);

    const analyticsResponse = await server.get(
      `/v1/studio/cards/endpoint-studio-card/analytics?editor_code=${editorCode}`
    );
    expect(analyticsResponse.statusCode).to.equal(200);
    expect(analyticsResponse.data.data).to.include({
      total_views: 1,
      total_clicks: 1,
      total_exports: 1,
      total_orders: 1,
    });
  });

  it('returns expected errors for invalid studio templates and owner access', async () => {
    const invalidTemplateResponse = await server.post('/v1/studio/cards', {
      body: {
        title: 'Invalid Template Card',
        creator_reference: 'crt_i1n2v3a4l5t6p7l8',
        status: 'published',
        template_key: 'not-a-template',
      },
    });

    expect(invalidTemplateResponse.statusCode).to.equal(400);
    expect(invalidTemplateResponse.data).to.include({ status: 'error', code: 'TP01' });

    const createResponse = await server.post('/v1/studio/cards', {
      body: {
        title: 'Protected Studio Card',
        creator_reference: 'crt_p1r2o3t4e5c6t7d8',
        status: 'published',
      },
    });

    const { slug } = createResponse.data.data;
    const missingEditorResponse = await server.get(`/v1/studio/cards/${slug}`);
    expect(missingEditorResponse.statusCode).to.equal(400);
    expect(missingEditorResponse.data).to.include({ status: 'error', code: 'ED01' });

    const wrongEditorResponse = await server.get(`/v1/studio/cards/${slug}?editor_code=WRONG`);
    expect(wrongEditorResponse.statusCode).to.equal(403);
    expect(wrongEditorResponse.data).to.include({ status: 'error', code: 'ED02' });
  });

  it('validates event actions and export types', async () => {
    const createResponse = await server.post('/v1/studio/cards', {
      body: {
        title: 'Event Validation Card',
        creator_reference: 'crt_e1v2e3n4t5v6a7l8',
        status: 'published',
      },
    });
    const { slug, editor_code: editorCode } = createResponse.data.data;

    const shareResponse = await server.post(`/v1/studio/cards/${slug}/events/share`, {
      body: {},
    });
    expect(shareResponse.statusCode).to.equal(200);
    expect(shareResponse.data.data.event_type).to.equal('share');

    const invalidEventResponse = await server.post(`/v1/studio/cards/${slug}/events/download`, {
      body: {},
    });
    expect(invalidEventResponse.statusCode).to.equal(400);
    expect(invalidEventResponse.data).to.include({ status: 'error', code: 'EV01' });

    const invalidExportResponse = await server.post(`/v1/studio/cards/${slug}/exports`, {
      body: { editor_code: editorCode, type: 'jpg' },
    });
    expect(invalidExportResponse.statusCode).to.equal(400);
    expect(invalidExportResponse.data).to.include({ status: 'error', code: 'EX01' });
  });
});
