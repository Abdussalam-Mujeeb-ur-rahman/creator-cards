const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getAnalytics = require('@app/services/studio-cards/analytics');

module.exports = createHandler({
  path: '/studio/cards/:slug/analytics',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURLWithoutQueryStrings,
        statusCode: rs.statusCode,
      },
      'get-studio-analytics-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await getAnalytics({
      slug: rc.params.slug,
      editor_code: rc.query.editor_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Analytics Retrieved Successfully.',
      data: response,
    };
  },
});
