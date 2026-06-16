const validator = require('@app-core/validator');
const CardEventRepository = require('@app/repository/card-event');
const { findStudioCard } = require('./helpers');

const eventSpec = `root {
  slug string<trim|lengthbetween:5,50>
  event_type string(view|link_click|export|share|order_intent)
  link_title? string<trim|maxLength:100>
  link_url? string<trim|maxLength:200>
  meta? object
}`;

const parsedEventSpec = validator.parse(eventSpec);

async function trackEvent(serviceData) {
  const data = validator.validate(serviceData, parsedEventSpec);
  await findStudioCard(data.slug);

  const event = await CardEventRepository.create({
    slug: data.slug,
    event_type: data.event_type,
    link_title: data.link_title || null,
    link_url: data.link_url || null,
    meta: data.meta || {},
  });

  return {
    id: event._id,
    slug: event.slug,
    event_type: event.event_type,
    link_title: event.link_title || null,
    link_url: event.link_url || null,
    meta: event.meta || {},
    created: event.created,
  };
}

module.exports = trackEvent;
