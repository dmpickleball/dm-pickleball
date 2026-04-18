import { supabase } from './_supabase.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDeviceType(ua = '') {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

function startOf(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ── POST: track a page visit OR a click event ─────────────────────────────────
async function trackVisit(req, res) {
  const { page, referrer, sessionId, type, eventName, eventData } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const ua = req.headers['user-agent'] || '';
  const row = {
    session_id: sessionId,
    page: page || '/',
    referrer: referrer || null,
    device_type: getDeviceType(ua),
    country: req.headers['x-vercel-ip-country'] || null,
  };

  // Click events: store event_name + optional event_data
  if (type === 'event' && eventName) {
    row.event_name = eventName;
    if (eventData) row.event_data = eventData;
  }

  const { error } = await supabase.from('page_views').insert(row);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

// ── GET: return traffic + events summary ──────────────────────────────────────
async function getTraffic(req, res) {
  const { data, error } = await supabase
    .from('page_views')
    .select('page, referrer, session_id, device_type, country, created_at, event_name, event_data')
    .gte('created_at', startOf(90))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = data || [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = startOf(7), monthAgo = startOf(30);
  const inRange = (row, from) => row.created_at >= from;
  const uniqueSessions = subset => new Set(subset.map(r => r.session_id)).size;

  // Separate page views from events
  const pageViewRows = rows.filter(r => !r.event_name);
  const eventRows    = rows.filter(r => !!r.event_name);

  const todayRows = pageViewRows.filter(r => r.created_at.slice(0, 10) === todayStr);
  const weekRows  = pageViewRows.filter(r => inRange(r, weekAgo));
  const monthRows = pageViewRows.filter(r => inRange(r, monthAgo));

  // Daily page view counts (last 30 days)
  const dailyCounts = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  monthRows.forEach(r => { const day = r.created_at.slice(0, 10); if (day in dailyCounts) dailyCounts[day]++; });

  // Top pages
  const pageCounts = {};
  monthRows.forEach(r => { pageCounts[r.page] = (pageCounts[r.page] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([page,views])=>({page,views}));

  // Devices
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  monthRows.forEach(r => { if (r.device_type in deviceCounts) deviceCounts[r.device_type]++; });

  // Countries
  const countryCounts = {};
  monthRows.forEach(r => { if (r.country) countryCounts[r.country] = (countryCounts[r.country] || 0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,views])=>({country,views}));

  // Referrers
  const refCounts = {};
  pageViewRows.filter(r => r.referrer && inRange(r, monthAgo)).forEach(r => {
    try { const host = new URL(r.referrer).hostname.replace(/^www\./, ''); refCounts[host] = (refCounts[host] || 0) + 1; } catch {}
  });
  const topReferrers = Object.entries(refCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([referrer,views])=>({referrer,views}));

  // ── Events: top click events in last 30 days ──────────────────────────────
  const monthEventRows = eventRows.filter(r => inRange(r, monthAgo));
  const eventCounts = {};
  monthEventRows.forEach(r => {
    eventCounts[r.event_name] = (eventCounts[r.event_name] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .sort((a,b)=>b[1]-a[1])
    .map(([event, count]) => ({ event, count }));

  // Daily event counts (last 30 days, all events combined)
  const dailyEventCounts = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyEventCounts[d.toISOString().slice(0, 10)] = 0;
  }
  monthEventRows.forEach(r => {
    const day = r.created_at.slice(0, 10);
    if (day in dailyEventCounts) dailyEventCounts[day]++;
  });

  return res.status(200).json({
    summary: {
      today:   { views: todayRows.length,  sessions: uniqueSessions(todayRows) },
      week:    { views: weekRows.length,   sessions: uniqueSessions(weekRows) },
      month:   { views: monthRows.length,  sessions: uniqueSessions(monthRows) },
      allTime: { views: pageViewRows.length, sessions: uniqueSessions(pageViewRows) },
    },
    daily: Object.entries(dailyCounts).map(([date, views]) => ({ date, views })),
    topPages, devices: deviceCounts, topCountries, topReferrers,
    // Events
    topEvents,
    totalEvents30d: monthEventRows.length,
    dailyEvents: Object.entries(dailyEventCounts).map(([date, count]) => ({ date, count })),
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST') return trackVisit(req, res);
  if (req.method === 'GET')  return getTraffic(req, res);
  return res.status(405).end();
}
