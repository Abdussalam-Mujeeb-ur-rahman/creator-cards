const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const deleteStudioCard = require('@app/services/studio-cards/delete');

module.exports = createHandler({
  path: '/studio/cards/:slug',
  method: 'delete',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        handlerPath: rc.properties.handlerPath,
        body: rc.body,
        query: rc.query,
        params: rc.params,
        headers: rc.headers,
        statusCode: rs.statusCode,
        responseBody: rs.body,
      },
      'delete-studio-card-request-completed-full'
    );
  },
  async handler(rc, helpers) {
    const response = await deleteStudioCard({
      ...rc.body,
      slug: rc.params.slug,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Deleted Successfully.',
      data: response,
    };
  },
});
