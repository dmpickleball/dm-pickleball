import { createHmac, timingSafeEqual } from 'crypto';

const ALLOWED_EMAILS = ['davidmokblock@gmail.com', 'amandale91@gmail.com'];
const SECRET_KEY = 'ITALY_SESSION_SECRET'; // env var name
const TOKEN_TTL  = 30 * 24 * 60 * 60 * 1000; // 30 days

function signToken(email) {
  const ts     = Date.now();
  const secret = process.env[SECRET_KEY] || process.env.ADMIN_SESSION_SECRET || 'fallback';
  const sig    = createHmac('sha256', secret).update(`italy:${email}:${ts}`).digest('hex');
  return Buffer.from(JSON.stringify({ email, ts, sig })).toString('base64url');
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const { email, ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > TOKEN_TTL) return null;
    const secret   = process.env[SECRET_KEY] || process.env.ADMIN_SESSION_SECRET || 'fallback';
    const expected = createHmac('sha256', secret).update(`italy:${email}:${ts}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return email;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://dmpickleball.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-italy-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: verify an existing session token ─────────────────────────────────
  if (req.method === 'GET') {
    const token = req.headers['x-italy-token'] || req.query.token || '';
    const email = verifyToken(token);
    if (!email) return res.status(401).json({ ok: false, error: 'Invalid or expired session' });
    return res.status(200).json({ ok: true, email });
  }

  // ── POST: exchange a Google access token for a session ────────────────────
  if (req.method === 'POST') {
    const { googleToken } = req.body || {};
    if (!googleToken) return res.status(400).json({ ok: false, error: 'Missing googleToken' });

    // Validate with Google — supports both ID tokens (GSI) and access tokens
    let userInfo;
    try {
      // Try tokeninfo first (handles ID tokens from Google Sign-In popup)
      const idRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleToken)}`);
      if (idRes.ok) {
        userInfo = await idRes.json();
      } else {
        // Fallback: access token via userinfo
        const r = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${googleToken}` },
        });
        if (!r.ok) throw new Error('Google rejected token');
        userInfo = await r.json();
      }
    } catch (e) {
      return res.status(401).json({ ok: false, error: 'Could not verify Google token' });
    }

    const email = (userInfo.email || '').toLowerCase().trim();
    if (!ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({ ok: false, error: `${email} is not authorised to view this page.` });
    }

    const token = signToken(email);
    return res.status(200).json({ ok: true, token, email, name: userInfo.given_name || '' });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
