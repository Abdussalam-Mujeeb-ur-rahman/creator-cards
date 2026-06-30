const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const listOwnerCards = require('@app/services/studio-cards/list-owner-cards');

module.exports = createHandler({
  path: '/studio/cards/owner-list',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'list-studio-owner-cards-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await listOwnerCards(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio owner cards retrieved successfully.',
      data: response,
    };
  },
});
