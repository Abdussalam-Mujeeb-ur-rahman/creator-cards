const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getTemplates = require('@app/services/studio-cards/templates');

module.exports = createHandler({
  path: '/studio/templates',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'get-studio-templates-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await getTemplates();

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Templates Retrieved Successfully.',
      data: response,
    };
  },
});
