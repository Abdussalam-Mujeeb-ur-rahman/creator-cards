const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getPublicStudioCard = require('@app/services/studio-cards/get-public');

module.exports = createHandler({
  path: '/studio/cards/:slug/public',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURLWithoutQueryStrings,
        statusCode: rs.statusCode,
      },
      'get-public-studio-card-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await getPublicStudioCard({
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Public Studio Card Retrieved Successfully.',
      data: response,
    };
  },
});
