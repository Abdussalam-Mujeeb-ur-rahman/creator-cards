const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const trackExport = require('@app/services/studio-cards/export');

module.exports = createHandler({
  path: '/studio/cards/:slug/exports',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'track-studio-export-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await trackExport({
      ...rc.body,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Export Tracked Successfully.',
      data: response,
    };
  },
});
