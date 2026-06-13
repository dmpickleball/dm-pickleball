import { supabase } from './_supabase.js';
import { createHmac, timingSafeEqual } from 'crypto';

const ROW_ID = 'main';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36';

// ── Parse USAPA HTML for brand/model pairs via entry-ID grouping ─────────────
function parseUSAPAHtml(html) {
  const entries = {};
  const re = /href="https?:\/\/equipment\.usapickleball\.org\/paddle-list\/entry\/(\d+)[^"]*">([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, id, text] = m;
    const clean = text.trim();
    if (/^\d+$/.test(clean)) continue; // skip pagination numbers
    if (!entries[id]) entries[id] = { brand: clean };
    else if (!entries[id].model) entries[id].model = clean;
  }
  return Object.values(entries).filter(e => e.brand && e.model);
}

// ── Full USAPA catalog (fetched in parallel, cached 4h in process memory) ────
let _catalog = null;
let _catalogAt = 0;
const CATALOG_TTL = 4 * 60 * 60 * 1000;

async function fetchFullCatalog() {
  if (_catalog && Date.now() - _catalogAt < CATALOG_TTL) return _catalog;

  // USAPA lists ~25 paddles per page. Estimated 5200 total → ~208 pages.
  // Fetch ~40 pages evenly spread across the full list to sample all brands.
  // All requests fire in parallel; a shared AbortController kills stragglers at 7.5s.
  const PAGE_COUNT = 208;
  const SAMPLE_STEP = 5; // every 5th page → 42 pages → ~1050 paddles
  const pages = Array.from({ length: Math.ceil(PAGE_COUNT / SAMPLE_STEP) }, (_, i) => 1 + i * SAMPLE_STEP);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 7500);

  const settled = await Promise.allSettled(
    pages.map(pn => {
      const url = pn === 1
        ? 'https://equipment.usapickleball.org/paddle-list/'
        : `https://equipment.usapickleball.org/paddle-list/?pagenum=${pn}`;
      return fetch(url, { headers: { 'User-Agent': UA }, signal: ac.signal })
        .then(r => r.ok ? r.text() : null)
        .catch(() => null);
    })
  );
  clearTimeout(timer);

  const seen = {};
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) {
      for (const e of parseUSAPAHtml(r.value)) {
        const key = `${e.brand.toLowerCase()}|||${e.model.toLowerCase()}`;
        if (!seen[key]) seen[key] = e;
      }
    }
  }

  const catalog = Object.values(seen).sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
  );

  if (catalog.length > 0) { _catalog = catalog; _catalogAt = Date.now(); }
  return _catalog || [];
}

// ── Admin auth (same pattern as students.js) ──────────────────────────────────
function verifyAdminToken(token) {
  try {
    if (!token) return null;
    const { email, ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    const expected = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return email;
  } catch { return null; }
}

function requireAdmin(req, res) {
  const token = req.headers['x-admin-token'] || '';
  const email = verifyAdminToken(token);
  if (!email) { res.status(401).json({ error: 'Unauthorized' }); return null; }
  return email;
}

// ── PickleballStudio lookup (best-effort) ─────────────────────────────────────
async function lookupPickleballStudio(brand, model) {
  try {
    const query = encodeURIComponent(`${brand} ${model}`);
    const url = `https://pickleballstudio.com/paddles?q=${query}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    const nextData = JSON.parse(m[1]);
    const paddles =
      nextData?.props?.pageProps?.paddles ||
      nextData?.props?.pageProps?.initialData?.paddles ||
      [];
    if (!paddles.length) return null;
    const brandLow = brand.toLowerCase();
    const modelLow = model.toLowerCase();
    const match = paddles.find(p => {
      const n = (p.name || p.paddle_name || '').toLowerCase();
      return n.includes(brandLow) || n.includes(modelLow);
    });
    if (!match) return null;
    return {
      name:          match.name || match.paddle_name || null,
      swing_weight:  match.swing_weight ?? match.swingWeight ?? null,
      twist_weight:  match.twist_weight ?? match.twistWeight ?? null,
      static_weight: match.static_weight ?? match.staticWeight ?? match.weight ?? null,
      balance_point: match.balance_point ?? match.balancePoint ?? null,
      url:           match.url ? `https://pickleballstudio.com${match.url}` : 'https://pickleballstudio.com/paddles',
      source:        'PickleballStudio',
    };
  } catch (e) {
    console.error('PS lookup failed:', e.message);
    return null;
  }
}

// ── Paddle Lab handlers ───────────────────────────────────────────────────────
async function handlePaddleLab(req, res) {
  if (!requireAdmin(req, res)) return;

  const { action, id } = req.query;

  if (req.method === 'GET') {
    // Full catalog for localStorage caching on the frontend
    if (action === 'paddle-catalog') {
      const catalog = await fetchFullCatalog();
      return res.status(200).json({ catalog });
    }

    // Live filter on the cached catalog (fallback when localStorage is cold)
    if (action === 'paddle-search') {
      const { q = '' } = req.query;
      const catalog = await fetchFullCatalog();
      if (!q.trim()) return res.status(200).json({ results: [] });
      const qLow = q.toLowerCase();
      const results = catalog
        .filter(e => e.brand.toLowerCase().includes(qLow) || e.model.toLowerCase().includes(qLow))
        .slice(0, 20);
      return res.status(200).json({ results });
    }

    // Duplicate / existing check
    if (action === 'check') {
      const { brand, model, colorway = '', phase, mod_type = '' } = req.query;
      const { data, error } = await supabase
        .from('paddle_measurements')
        .select('id, brand, model, colorway, phase, mod_type, static_weight, swing_weight, twist_weight, measured_date')
        .ilike('brand', brand)
        .ilike('model', model)
        .order('measured_date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      const exact = data.filter(r =>
        r.colorway?.toLowerCase() === (colorway || '').toLowerCase() &&
        r.phase === phase &&
        (r.mod_type || '').toLowerCase() === (mod_type || '').toLowerCase()
      );
      return res.status(200).json({ existing: data, exactDuplicate: exact.length > 0, exactMatch: exact[0] || null });
    }

    // PickleballStudio lookup
    if (action === 'lookup-ps') {
      const { brand, model } = req.query;
      if (!brand || !model) return res.status(400).json({ error: 'brand and model required' });
      const result = await lookupPickleballStudio(brand, model);
      return res.status(200).json({ result });
    }

    // List measurements
    const { brand, model, phase, date_from, date_after, limit: lim = '200', offset: off = '0' } = req.query;
    let q = supabase
      .from('paddle_measurements')
      .select('*')
      .order('measured_date', { ascending: false })
      .order('brand').order('model')
      .range(parseInt(off), parseInt(off) + parseInt(lim) - 1);
    if (brand)      q = q.ilike('brand', `%${brand}%`);
    if (model)      q = q.ilike('model', `%${model}%`);
    if (phase)      q = q.eq('phase', phase);
    if (date_from)  q = q.gte('measured_date', date_from);
    if (date_after) q = q.lte('measured_date', date_after);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ measurements: data || [] });
  }

  if (req.method === 'POST') {
    const {
      brand, model, colorway = '', phase = 'before', mod_type = '', mod_notes = '',
      static_weight, swing_weight, twist_weight, balance_point,
      length_mm, width_mm, thickness_mm, grip_size = '', handle_length,
      notes = '', measured_date,
    } = req.body;
    if (!brand || !model) return res.status(400).json({ error: 'brand and model are required' });
    const toNum = v => (v != null && v !== '') ? parseFloat(v) : null;
    const row = {
      brand: brand.trim(), model: model.trim(), colorway: colorway.trim(),
      phase, mod_type: mod_type.trim(), mod_notes: mod_notes.trim(),
      static_weight: toNum(static_weight), swing_weight: toNum(swing_weight),
      twist_weight: toNum(twist_weight), balance_point: toNum(balance_point),
      length_mm: toNum(length_mm), width_mm: toNum(width_mm), thickness_mm: toNum(thickness_mm),
      grip_size: grip_size.trim(), handle_length: toNum(handle_length),
      notes: notes.trim(), measured_date: measured_date || new Date().toISOString().slice(0, 10),
    };
    const { data, error } = await supabase.from('paddle_measurements').insert(row).select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'A measurement with this brand, model, colorway, phase, and mod type already exists.' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ measurement: data });
  }

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ error: 'id required' });
    const allowed = ['brand','model','colorway','phase','mod_type','mod_notes',
      'static_weight','swing_weight','twist_weight','balance_point',
      'length_mm','width_mm','thickness_mm','grip_size','handle_length','notes','measured_date'];
    const numFields = ['static_weight','swing_weight','twist_weight','balance_point','length_mm','width_mm','thickness_mm','handle_length'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined)
        updates[k] = numFields.includes(k) && req.body[k] !== '' ? parseFloat(req.body[k]) : req.body[k];
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' });
    const { data, error } = await supabase.from('paddle_measurements').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ measurement: data });
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase.from('paddle_measurements').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Main handler — routes by ?resource param ──────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Route paddle-lab requests
  if (req.query.resource === 'paddle-lab') return handlePaddleLab(req, res);

  // ── Original gear settings routes ────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('gear_settings').select('*').eq('id', ROW_ID).single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    return res.status(200).json({ gear: data || null });
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const { paddle_name, paddle_link, paddle_detail, paddle_start, bag_name, bag_detail, bag_link, paddle_history, accent_color } = req.body;
    const updated_at = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const { error } = await supabase.from('gear_settings').upsert({
      id: ROW_ID, paddle_name, paddle_link, paddle_detail, paddle_start,
      bag_name, bag_detail, bag_link, paddle_history,
      accent_color: accent_color || '#f97316', updated_at,
    }, { onConflict: 'id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, updated_at });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
