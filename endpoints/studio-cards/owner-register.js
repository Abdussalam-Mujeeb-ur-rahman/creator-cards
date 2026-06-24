const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const registerOwner = require('@app/services/studio-cards/register-owner');

module.exports = createHandler({
  path: '/studio/auth/register',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'register-studio-owner-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await registerOwner(rc.body);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio owner account created successfully.',
      data: response,
    };
  },
});
