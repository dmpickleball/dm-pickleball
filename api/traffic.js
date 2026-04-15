import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── POST: track a page visit ──────────────────────────────────────────────────
function getDeviceType(ua = '') {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

async function trackVisit(req, res) {
  const { page, referrer, sessionId } = req.body || {};
  if (!page || !sessionId) return res.status(400).json({ error: 'page and sessionId required' });
  const ua = req.headers['user-agent'] || '';
  const { error } = await supabase.from('page_views').insert({
    page,
    referrer: referrer || null,
    session_id: sessionId,
    device_type: getDeviceType(ua),
    country: req.headers['x-vercel-ip-country'] || null,
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

// ── GET: return traffic summary ───────────────────────────────────────────────
function startOf(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getTraffic(req, res) {
  const { data, error } = await supabase
    .from('page_views')
    .select('page, referrer, session_id, device_type, country, created_at')
    .gte('created_at', startOf(90))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = data || [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = startOf(7), monthAgo = startOf(30);
  const inRange = (row, from) => row.created_at >= from;
  const uniqueSessions = subset => new Set(subset.map(r => r.session_id)).size;

  const todayRows  = rows.filter(r => r.created_at.slice(0, 10) === todayStr);
  const weekRows   = rows.filter(r => inRange(r, weekAgo));
  const monthRows  = rows.filter(r => inRange(r, monthAgo));

  const dailyCounts = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  monthRows.forEach(r => { const day = r.created_at.slice(0, 10); if (day in dailyCounts) dailyCounts[day]++; });

  const pageCounts = {};
  monthRows.forEach(r => { pageCounts[r.page] = (pageCounts[r.page] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([page,views])=>({page,views}));

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  monthRows.forEach(r => { if (r.device_type in deviceCounts) deviceCounts[r.device_type]++; });

  const countryCounts = {};
  monthRows.forEach(r => { if (r.country) countryCounts[r.country] = (countryCounts[r.country] || 0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,views])=>({country,views}));

  const refCounts = {};
  monthRows.filter(r => r.referrer).forEach(r => {
    try { const host = new URL(r.referrer).hostname.replace(/^www\./, ''); refCounts[host] = (refCounts[host] || 0) + 1; } catch {}
  });
  const topReferrers = Object.entries(refCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([referrer,views])=>({referrer,views}));

  return res.status(200).json({
    summary: {
      today:   { views: todayRows.length,  sessions: uniqueSessions(todayRows) },
      week:    { views: weekRows.length,   sessions: uniqueSessions(weekRows) },
      month:   { views: monthRows.length,  sessions: uniqueSessions(monthRows) },
      allTime: { views: rows.length,       sessions: uniqueSessions(rows) },
    },
    daily: Object.entries(dailyCounts).map(([date, views]) => ({ date, views })),
    topPages, devices: deviceCounts, topCountries, topReferrers,
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST') return trackVisit(req, res);
  if (req.method === 'GET')  return getTraffic(req, res);
  return res.status(405).end();
}
