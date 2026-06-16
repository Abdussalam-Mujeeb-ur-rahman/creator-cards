const { createHandler } = require('@app-core/server');
const { appLogger } = require('@app-core/logger');
const trackEvent = require('@app/services/studio-cards/track-event');
const StudioCardMessages = require('@app/messages/studio-card');
const { throwStudioError, STUDIO_ERROR_CODES } = require('@app/services/studio-cards/helpers');

function resolveEventType(eventAction) {
  const eventTypeMap = {
    view: 'view',
    click: 'link_click',
    share: 'share',
    order: 'order_intent',
  };

  const eventType = eventTypeMap[eventAction];

  if (!eventType) {
    throwStudioError(StudioCardMessages.INVALID_EVENT_TYPE, STUDIO_ERROR_CODES.INVALID_EVENT_TYPE);
  }

  return eventType;
}

module.exports = createHandler({
  path: '/studio/cards/:slug/events/:event_action',
  method: 'post',
  middlewares: [],
  async onResponseEnd(rc, rs) {
    appLogger.info(
      {
        method: rc.properties.method,
        requestURL: rc.properties.requestURL,
        statusCode: rs.statusCode,
      },
      'track-studio-event-request-completed'
    );
  },
  async handler(rc, helpers) {
    const response = await trackEvent({
      ...rc.body,
      slug: rc.params.slug,
      event_type: resolveEventType(rc.params.event_action),
    });

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: 'Studio Card Event Tracked Successfully.',
      data: response,
    };
  },
});
