import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getDeviceType(ua = '') {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

export default async function handler(req, res) {
  // Allow from same origin only
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { page, referrer, sessionId } = req.body || {};
  if (!page || !sessionId) return res.status(400).json({ error: 'page and sessionId required' });

  const ua = req.headers['user-agent'] || '';
  const deviceType = getDeviceType(ua);
  // Vercel provides country via x-vercel-ip-country header
  const country = req.headers['x-vercel-ip-country'] || null;

  const { error } = await supabase.from('page_views').insert({
    page,
    referrer: referrer || null,
    session_id: sessionId,
    device_type: deviceType,
    country,
  });

  if (error) {
    console.error('track-visit error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
