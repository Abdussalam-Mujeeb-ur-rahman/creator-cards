const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const getEditableStudioCard = require('@app/services/studio-cards/get-editable');

module.exports = createHandler({
  path: '/studio/cards/:slug',
  method: 'get',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURLWithoutQueryStrings,
        statusCode: rs.statusCode,
      },
      'get-editable-studio-card-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await getEditableStudioCard({
      slug: rc.params.slug,
      editor_code: rc.query.editor_code,
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Retrieved Successfully.',
      data: response,
    };
  },
});
