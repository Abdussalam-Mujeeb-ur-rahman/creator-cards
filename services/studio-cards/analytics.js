const CardEventRepository = require('@app/repository/card-event');
const { assertEditorCode, createEmptyAnalytics, findStudioCard } = require('./helpers');

function getDayKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function buildAnalytics(events) {
  const analytics = createEmptyAnalytics();
  const linkCounts = {};
  const dailyCounts = {};

  events.forEach((event) => {
    if (event.event_type === 'view') analytics.total_views += 1;
    if (event.event_type === 'link_click') analytics.total_clicks += 1;
    if (event.event_type === 'export') analytics.total_exports += 1;
    if (event.event_type === 'share') analytics.total_shares += 1;
    if (event.event_type === 'order_intent') analytics.total_orders += 1;

    if (event.event_type === 'link_click') {
      const linkKey = event.link_title || event.link_url || 'Untitled link';
      linkCounts[linkKey] = (linkCounts[linkKey] || 0) + 1;
    }

    const dayKey = getDayKey(event.created);
    dailyCounts[dayKey] = dailyCounts[dayKey] || {
      date: dayKey,
      views: 0,
      clicks: 0,
      exports: 0,
      shares: 0,
      orders: 0,
    };

    if (event.event_type === 'view') dailyCounts[dayKey].views += 1;
    if (event.event_type === 'link_click') dailyCounts[dayKey].clicks += 1;
    if (event.event_type === 'export') dailyCounts[dayKey].exports += 1;
    if (event.event_type === 'share') dailyCounts[dayKey].shares += 1;
    if (event.event_type === 'order_intent') dailyCounts[dayKey].orders += 1;
  });

  analytics.top_links = Object.entries(linkCounts)
    .map(([label, clicks]) => ({ label, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
  analytics.daily_totals = Object.values(dailyCounts).sort((a, b) => a.date.localeCompare(b.date));

  return analytics;
}

async function getAnalytics(serviceData) {
  const studioCard = await findStudioCard(serviceData.slug);
  assertEditorCode(studioCard, serviceData.editor_code);

  const events = await CardEventRepository.findMany({
    query: { slug: serviceData.slug },
    options: { sort: { created: 1 }, limit: 1000 },
  });

  return {
    slug: serviceData.slug,
    ...buildAnalytics(events),
  };
}

module.exports = getAnalytics;
