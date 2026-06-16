const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const updateStudioCard = require('@app/services/studio-cards/update');

module.exports = createHandler({
  path: '/studio/cards/:slug',
  method: 'patch',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'update-studio-card-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await updateStudioCard({
      ...rc.body,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Updated Successfully.',
      data: response,
    };
  },
});
