import { supabase } from './_supabase.js';
import { createHmac, timingSafeEqual } from 'crypto';

// ── Auth ─────────────────────────────────────────────────────────────────────
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

// ── PickleballStudio lookup ───────────────────────────────────────────────────
// Fetches the PS paddle list and finds the best match for brand+model.
async function lookupPickleballStudio(brand, model) {
  try {
    // PS has a public JSON-backed search via their site. We fetch the paddles page
    // and look for the paddle by name. This is best-effort.
    const query = encodeURIComponent(`${brand} ${model}`);
    const url = `https://pickleballstudio.com/paddles?q=${query}`;
    // We request their page as text and extract JSON from the __NEXT_DATA__ script tag
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Extract __NEXT_DATA__
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    const nextData = JSON.parse(m[1]);
    // Navigate to paddles list — path varies by PS version
    const paddles =
      nextData?.props?.pageProps?.paddles ||
      nextData?.props?.pageProps?.initialData?.paddles ||
      [];
    if (!paddles.length) return null;

    // Simple fuzzy match: find paddle whose name contains both brand and model keywords
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

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // All endpoints require admin
  if (!requireAdmin(req, res)) return;

  const { action, id } = req.query;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {

    // Check for duplicates before inserting
    if (action === 'check') {
      const { brand, model, colorway = '', phase, mod_type = '' } = req.query;
      const { data, error } = await supabase
        .from('paddle_measurements')
        .select('id, brand, model, colorway, phase, mod_type, static_weight, swing_weight, twist_weight, measured_date')
        .ilike('brand', brand)
        .ilike('model', model)
        .order('measured_date', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      // Exact duplicate: same brand+model+colorway+phase+mod_type
      const exact = data.filter(r =>
        r.colorway?.toLowerCase() === (colorway || '').toLowerCase() &&
        r.phase === phase &&
        (r.mod_type || '').toLowerCase() === (mod_type || '').toLowerCase()
      );
      // Partial match: same paddle different phase/mod
      return res.status(200).json({ existing: data, exactDuplicate: exact.length > 0, exactMatch: exact[0] || null });
    }

    // PickleballStudio lookup
    if (action === 'lookup-ps') {
      const { brand, model } = req.query;
      if (!brand || !model) return res.status(400).json({ error: 'brand and model required' });
      const result = await lookupPickleballStudio(brand, model);
      return res.status(200).json({ result });
    }

    // List all measurements (with optional filters)
    const {
      brand, model, phase, date_from, date_after,
      limit: lim = '200', offset: off = '0',
    } = req.query;

    let q = supabase
      .from('paddle_measurements')
      .select('*')
      .order('measured_date', { ascending: false })
      .order('brand')
      .order('model')
      .range(parseInt(off), parseInt(off) + parseInt(lim) - 1);

    if (brand)     q = q.ilike('brand', `%${brand}%`);
    if (model)     q = q.ilike('model', `%${model}%`);
    if (phase)     q = q.eq('phase', phase);
    if (date_from) q = q.gte('measured_date', date_from);
    if (date_after)q = q.lte('measured_date', date_after);

    const { data, error, count } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ measurements: data || [], count });
  }

  // ── POST — create new measurement ────────────────────────────────────────
  if (req.method === 'POST') {
    const {
      brand, model, colorway = '',
      phase = 'before', mod_type = '', mod_notes = '',
      static_weight, swing_weight, twist_weight, balance_point,
      grip_size = '', handle_length,
      notes = '', measured_date,
    } = req.body;

    if (!brand || !model) return res.status(400).json({ error: 'brand and model are required' });

    const row = {
      brand: brand.trim(),
      model: model.trim(),
      colorway: colorway.trim(),
      phase,
      mod_type: mod_type.trim(),
      mod_notes: mod_notes.trim(),
      static_weight:  static_weight  != null ? parseFloat(static_weight)  : null,
      swing_weight:   swing_weight   != null ? parseFloat(swing_weight)   : null,
      twist_weight:   twist_weight   != null ? parseFloat(twist_weight)   : null,
      balance_point:  balance_point  != null ? parseFloat(balance_point)  : null,
      grip_size: grip_size.trim(),
      handle_length:  handle_length  != null ? parseFloat(handle_length)  : null,
      notes: notes.trim(),
      measured_date: measured_date || new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from('paddle_measurements')
      .insert(row)
      .select()
      .single();

    if (error) {
      // Unique violation → duplicate
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A measurement with this brand, model, colorway, phase, and mod type already exists.' });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ measurement: data });
  }

  // ── PATCH — update existing measurement ──────────────────────────────────
  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ error: 'id required' });

    const allowed = [
      'brand','model','colorway','phase','mod_type','mod_notes',
      'static_weight','swing_weight','twist_weight','balance_point',
      'grip_size','handle_length','notes','measured_date',
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        const numFields = ['static_weight','swing_weight','twist_weight','balance_point','handle_length'];
        updates[k] = numFields.includes(k) && req.body[k] !== ''
          ? parseFloat(req.body[k])
          : req.body[k];
      }
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' });

    const { data, error } = await supabase
      .from('paddle_measurements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ measurement: data });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase
      .from('paddle_measurements')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
