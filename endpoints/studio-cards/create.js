const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const createStudioCard = require('@app/services/studio-cards/create');

module.exports = createHandler({
  path: '/studio/cards',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'create-studio-card-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await createStudioCard(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Created Successfully.',
      data: response,
    };
  },
});
