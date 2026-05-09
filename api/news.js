import { supabase } from './_supabase.js';
import { createHmac, timingSafeEqual } from 'crypto';

// ── Admin token verification (mirrors students.js) ────────────────────────────
function verifyAdminToken(token) {
  try {
    if (!token) return null;
    const { email, ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    const expected = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return email;
  } catch { return null; }
}

// ── Ingest secret (for scheduled task) ───────────────────────────────────────
function verifyIngestSecret(req) {
  const secret = process.env.NEWS_INGEST_SECRET;
  if (!secret) return false;
  const header = req.headers['x-ingest-secret'] || '';
  return header === secret;
}

export default async function handler(req, res) {
  // ── GET: public — return published items from last 90 days ─────────────────
  if (req.method === 'GET') {
    const { limit = '50', admin } = req.query;

    // Admin view: include hidden items (requires admin token)
    const adminEmail = admin === 'true'
      ? verifyAdminToken(req.headers['x-admin-token'] || '')
      : null;
    if (admin === 'true' && !adminEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    let query = supabase
      .from('news_items')
      .select('*')
      .gte('created_at', cutoff.toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (!adminEmail) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ items: data || [] });
  }

  // ── POST: add / like / dislike / hide ─────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const { action } = body;

    // ── add: scheduled task ingest ──────────────────────────────────────────
    if (action === 'add') {
      if (!verifyIngestSecret(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { title, summary, url, source, category, image_url } = body;
      if (!title || !url) return res.status(400).json({ error: 'title and url required' });

      // Deduplicate by URL
      const { data: existing } = await supabase
        .from('news_items')
        .select('id')
        .eq('url', url)
        .limit(1);
      if (existing && existing.length > 0) {
        return res.status(200).json({ ok: true, skipped: true, reason: 'duplicate url' });
      }

      const { error } = await supabase.from('news_items').insert({
        title: (title || '').slice(0, 200),
        summary: (summary || '').slice(0, 2000),
        url,
        source: source || '',
        category: category || 'general',
        image_url: image_url || null,
        status: 'published',
        likes: 0,
        dislikes: 0,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // All other actions require admin token
    const adminEmail = verifyAdminToken(req.headers['x-admin-token'] || '');
    if (!adminEmail) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id required' });

    // ── delete (permanent) ─────────────────────────────────────────────────
    if (action === 'delete') {
      const { error } = await supabase.from('news_items').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── hide / unhide ───────────────────────────────────────────────────────
    if (action === 'hide' || action === 'unhide') {
      const { error } = await supabase
        .from('news_items')
        .update({ status: action === 'hide' ? 'hidden' : 'published' })
        .eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── like ────────────────────────────────────────────────────────────────
    if (action === 'like') {
      const { error } = await supabase.rpc('increment_news_likes', { row_id: id });
      if (error) {
        // Fallback if RPC not set up: manual increment
        const { data: row } = await supabase.from('news_items').select('likes').eq('id', id).single();
        const { error: e2 } = await supabase.from('news_items').update({ likes: (row?.likes || 0) + 1 }).eq('id', id);
        if (e2) return res.status(500).json({ error: e2.message });
      }
      return res.status(200).json({ ok: true });
    }

    // ── dislike ─────────────────────────────────────────────────────────────
    if (action === 'dislike') {
      const { error } = await supabase.rpc('increment_news_dislikes', { row_id: id });
      if (error) {
        const { data: row } = await supabase.from('news_items').select('dislikes').eq('id', id).single();
        const { error: e2 } = await supabase.from('news_items').update({ dislikes: (row?.dislikes || 0) + 1 }).eq('id', id);
        if (e2) return res.status(500).json({ error: e2.message });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
