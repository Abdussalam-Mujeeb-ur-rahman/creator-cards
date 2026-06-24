const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const createOwnerSession = require('@app/services/studio-cards/create-owner-session');

module.exports = createHandler({
  path: '/studio/auth/session',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'create-studio-owner-session-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await createOwnerSession(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio owner session created successfully.',
      data: response,
    };
  },
});
