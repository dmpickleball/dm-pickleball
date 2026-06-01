import { supabase } from './_supabase.js';
import { google } from 'googleapis';
import { createHmac, timingSafeEqual } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// ── Cloudflare R2 setup ───────────────────────────────────────────────────────
const R2_ACCOUNT_ID  = process.env.R2_ACCOUNT_ID;
const R2_BUCKET      = 'italy2026';
const R2_PUBLIC_URL  = process.env.R2_PUBLIC_URL; // https://pub-xxx.r2.dev

const r2 = R2_ACCOUNT_ID ? new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
}) : null;

// In-memory manifest cache (survives warm instances)
let _r2Manifest = null;
let _r2ManifestTs = 0;

async function getR2Manifest() {
  if (!r2) return {};
  if (_r2Manifest && Date.now() - _r2ManifestTs < 60_000) return _r2Manifest;
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: 'manifest.json' }));
    _r2Manifest = JSON.parse(await res.Body.transformToString());
  } catch {
    _r2Manifest = {};
  }
  _r2ManifestTs = Date.now();
  return _r2Manifest;
}

async function saveR2Manifest(manifest) {
  if (!r2) return;
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: 'manifest.json',
    Body: JSON.stringify(manifest), ContentType: 'application/json',
  }));
  _r2Manifest = manifest;
  _r2ManifestTs = Date.now();
}

async function uploadToR2(key, sourceUrl, contentType = 'image/jpeg') {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key,
      Body: Buffer.from(buf), ContentType: contentType,
    }));
    return true;
  } catch { return false; }
}

// Simple in-memory rate limiter
const _rateMap = new Map();
function rateLimit(ip, max, windowMs) {
  const now = Date.now();
  const entry = _rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    _rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ── Italy 2026 Live Tracker ───────────────────────────────────────────────────
const ITALY_LIVE_PASSWORD = 'pickleball';
const ITALY_LIVE_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

function signLiveToken() {
  const ts = Date.now();
  const secret = process.env.ITALY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'fallback';
  const sig = createHmac('sha256', secret).update(`live:${ts}`).digest('hex');
  return Buffer.from(JSON.stringify({ ts, sig })).toString('base64url');
}

function verifyLiveToken(token) {
  try {
    if (!token) return false;
    const { ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > ITALY_LIVE_TTL) return false;
    const secret = process.env.ITALY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'fallback';
    const expected = createHmac('sha256', secret).update(`live:${ts}`).digest('hex');
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

let _photoCache = null;
let _photoCacheTs = 0;
const PHOTO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getICloudPhotos() {
  if (_photoCache && Date.now() - _photoCacheTs < PHOTO_CACHE_TTL) return _photoCache;
  const token = process.env.ICLOUD_ALBUM_TOKEN;
  if (!token) return [];
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://www.icloud.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    };
    // Step 1: Apple returns 330 with the real partition host in the body
    const redirect = await fetch(`https://p01-sharedstreams.icloud.com/${token}/sharedstreams/webstream`, {
      method: 'POST', headers, body: JSON.stringify({ streamCtag: null }),
    });
    const redirectData = await redirect.json();
    const host = redirectData['X-Apple-MMe-Host'] || 'p01-sharedstreams.icloud.com';
    const base = `https://${host}/${token}/sharedstreams`;

    // Step 2: real webstream call on the correct partition
    const streamRes = await fetch(`${base}/webstream`, {
      method: 'POST', headers, body: JSON.stringify({ streamCtag: null }),
    });
    if (!streamRes.ok) return [];
    const stream = await streamRes.json();
    // Sort newest first (iCloud dateCreated is an ISO string or epoch)
    const allPhotos = (stream.photos || []);
    allPhotos.sort((a, b) => {
      const da = a.dateCreated || a.batchDateCreated || '';
      const db = b.dateCreated || b.batchDateCreated || '';
      return db.localeCompare(da);
    });
    const photos = allPhotos.slice(0, 60);
    if (!photos.length) return [];

    // Step 3: get expiring CDN URLs for each photo
    const guids = photos.map(p => p.photoGuid);
    const urlRes = await fetch(`${base}/webasseturls`, {
      method: 'POST', headers, body: JSON.stringify({ photoGuids: guids }),
    });
    if (!urlRes.ok) return [];
    const urlData = await urlRes.json();

    const result = photos.map(photo => {
      const derivatives = photo.derivatives || {};
      const isVideo = (photo.mediaAssetType || '').toLowerCase().includes('video');
      const caption = photo.caption || '';

      if (isVideo) {
        // All numeric-key derivatives are JPEG thumbnails; non-numeric are the video file
        const allValues = Object.entries(derivatives);
        const numericKeys = allValues
          .filter(([k]) => !isNaN(Number(k)))
          .sort(([a],[b]) => Number(b) - Number(a));
        const nonNumericKeys = allValues.filter(([k]) => isNaN(Number(k)));

        // Poster = largest numeric-key derivative (JPEG thumbnail)
        let poster = '';
        for (const [, d] of numericKeys) {
          const loc = urlData.items?.[d.checksum];
          if (loc?.url_location && loc?.url_path) {
            poster = `https://${loc.url_location}${loc.url_path}`;
            break;
          }
        }

        // Video URL = non-numeric key derivative, or any derivative whose URL looks like a video
        let videoUrl = '';
        // Try non-numeric keys first (these are usually the actual video)
        for (const [, d] of nonNumericKeys) {
          const loc = urlData.items?.[d.checksum];
          if (loc?.url_location && loc?.url_path) {
            videoUrl = `https://${loc.url_location}${loc.url_path}`;
            break;
          }
        }
        // Fallback: smallest numeric derivative (lower res = more likely to be a small video)
        if (!videoUrl) {
          const smallest = numericKeys[numericKeys.length - 1];
          if (smallest) {
            const loc = urlData.items?.[smallest[1].checksum];
            if (loc?.url_location) videoUrl = `https://${loc.url_location}${loc.url_path}`;
          }
        }
        if (!videoUrl) return null;
        return { guid: photo.photoGuid, type: 'video', url: videoUrl, thumb: poster, poster, caption };
      }

      // Photo: pick largest (full res) and smallest (thumbnail) derivative
      const keys = Object.keys(derivatives).map(Number).filter(k => !isNaN(k)).sort((a, b) => b - a);
      if (!keys.length) return null;
      const bestKey = keys[0].toString();
      const thumbKey = keys[keys.length - 1].toString();
      const dFull = derivatives[bestKey];
      const dThumb = derivatives[thumbKey];
      const locFull = urlData.items?.[dFull.checksum];
      const locThumb = urlData.items?.[dThumb.checksum];
      if (!locFull) return null;
      const fullUrl = `https://${locFull.url_location}${locFull.url_path}`;
      const thumbUrl = locThumb ? `https://${locThumb.url_location}${locThumb.url_path}` : fullUrl;
      return {
        guid: photo.photoGuid,
        type: 'photo',
        url: fullUrl,
        thumb: thumbUrl,
        caption,
        width: dFull.width || 0,
        height: dFull.height || 0,
      };
    }).filter(Boolean);
    _photoCache = result;
    _photoCacheTs = Date.now();
    return result;
  } catch (e) {
    console.error('iCloud photos error:', e.message);
    return [];
  }
}

// ── Italy 2026 auth ───────────────────────────────────────────────────────────
const ITALY_ALLOWED_EMAILS = ['davidmokblock@gmail.com', 'amandale91@gmail.com'];
const ITALY_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000;

function signItalyToken(email) {
  const ts     = Date.now();
  const secret = process.env.ITALY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'fallback';
  const sig    = createHmac('sha256', secret).update(`italy:${email}:${ts}`).digest('hex');
  return Buffer.from(JSON.stringify({ email, ts, sig })).toString('base64url');
}

function verifyItalyToken(token) {
  try {
    if (!token) return null;
    const { email, ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > ITALY_TOKEN_TTL) return null;
    const secret   = process.env.ITALY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'fallback';
    const expected = createHmac('sha256', secret).update(`italy:${email}:${ts}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return email;
  } catch { return null; }
}

// ── HMAC-based admin token signing and verification ──────────────────────────
function signAdminToken(email) {
  const ts = Date.now();
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  const sig = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
  return Buffer.from(JSON.stringify({email, ts, sig})).toString('base64url');
}

function verifyAdminToken(token) {
  try {
    if (!token) return null;
    const {email, ts, sig} = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null; // 30d expiry
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    const expected = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(sig,'hex'), Buffer.from(expected,'hex'))) return null;
    return email;
  } catch { return null; }
}

function requireAdmin(req, res) {
  const token = req.headers['x-admin-token'] || '';
  const email = verifyAdminToken(token);
  if (!email) { res.status(401).json({error:'Unauthorized'}); return null; }
  return email;
}

// ── Google Calendar auth (same pattern as earnings-calendar.js) ───────────────
function getCalAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

// Looks like a lesson event (same heuristics as earnings-calendar)
function isLessonEvent(summary = '') {
  const s = summary.toLowerCase();
  return s.includes('pb lesson') || s.includes('clinic') || s.includes('stanford') || s.includes('pickup');
}

// Extract real attendees (filter out calendar resources and the organiser)
function getRealAttendees(event) {
  return (event.attendees || []).filter(a => {
    const em = (a.email || '').toLowerCase();
    return em && !em.includes('resource.calendar.google') && !em.includes('serviceaccount') && !a.organizer;
  }).map(a => ({
    email: a.email.toLowerCase().trim(),
    displayName: (a.displayName || '').trim(),
  }));
}

// Parse first/last name from a display name string
function parseName(displayName = '') {
  const parts = displayName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  return { firstName, lastName, name: displayName.trim() };
}

// Format calendar event into a lesson-like object for display
function calEventToLesson(event) {
  const startDT = event.start?.dateTime || event.start?.date || '';
  const endDT   = event.end?.dateTime   || event.end?.date   || '';
  const date = startDT.substring(0, 10);

  // Format time like "9:00 AM"
  let time = '';
  if (startDT.includes('T')) {
    const d = new Date(startDT);
    time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
  }

  // Duration in minutes
  let duration = '';
  if (startDT && endDT) {
    const mins = Math.round((new Date(endDT) - new Date(startDT)) / 60000);
    duration = mins >= 60 ? (mins % 60 === 0 ? `${mins/60} hr` : `${mins} min`) : `${mins} min`;
  }

  // Derive lesson type from title
  const s = (event.summary || '').toLowerCase();
  let type = event.summary || 'Lesson';
  if (s.includes('private') || (s.includes('pb lesson') && !s.includes('/') && !s.includes('group'))) type = 'Private Lesson';
  else if (s.includes('semi') || (s.includes('pb lesson') && s.includes('/'))) type = 'Semi-Private Lesson';
  else if (s.includes('group')) type = 'Group Lesson';
  else if (s.includes('clinic')) type = 'Clinic';
  else if (s.includes('stanford')) type = 'Stanford';

  const isMenlo = (event.location||'').toLowerCase().includes('menlo') || (event.location||'').toLowerCase().includes('190 park');

  return {
    id: 'gcal_' + event.id,
    gcalEventId: event.id,
    date,
    time,
    duration,
    type,
    status: new Date(startDT) < new Date() ? 'completed' : 'confirmed',
    isMenlo,
    location: event.location || '',
    notes: event.description || '',
    fromCalendar: true, // flag so we know it's not from Supabase
  };
}

// Core sync logic: scan a calendar for lesson attendees and upsert provisional accounts
async function syncCalendarToStudents(calendarId, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth: getCalAuth() });
  let pageToken = null;
  const uniqueAttendees = new Map(); // email → { email, displayName }

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
      ...(pageToken ? { pageToken } : {}),
    });
    const items = response.data.items || [];
    for (const event of items) {
      // Skip cancelled events
      if (event.status === 'cancelled') continue;
      // Skip events with no attendees at all (no point processing)
      if (!event.attendees || event.attendees.length === 0) continue;
      const attendees = getRealAttendees(event);
      for (const a of attendees) {
        if (!a.email) continue;
        if (!uniqueAttendees.has(a.email)) {
          uniqueAttendees.set(a.email, a);
        } else if (!uniqueAttendees.get(a.email).displayName && a.displayName) {
          // Prefer whichever entry actually has a name
          uniqueAttendees.set(a.email, a);
        }
      }
    }
    pageToken = response.data.nextPageToken || null;
  } while (pageToken);

  if (uniqueAttendees.size === 0) return { created: 0, skipped: 0, emails: [] };

  // Check which emails already exist in students table
  const emails = [...uniqueAttendees.keys()];
  const { data: existing } = await supabase
    .from('students')
    .select('email')
    .in('email', emails);
  const existingSet = new Set((existing || []).map(s => s.email.toLowerCase()));

  const newAttendees = emails.filter(e => !existingSet.has(e));
  if (newAttendees.length === 0) return { created: 0, skipped: emails.length, emails: [] };

  // Upsert provisional accounts for new attendees
  const rows = newAttendees.map(email => {
    const { displayName } = uniqueAttendees.get(email);
    const { firstName, lastName, name } = parseName(displayName);
    return {
      email,
      name: name || email.split('@')[0],
      first_name: firstName,
      last_name: lastName,
      calendar_name: name || '',
      provisional: true,
      source: 'calendar',
      approved: true,
      blocked: false,
      member_type: 'public',
      phone: '',
      comm_email: '',
      home_court: '',
      skill_level: '',
      dupr_rating: '',
      dupr_id: '',
    };
  });

  const { error } = await supabase.from('students').upsert(rows, { onConflict: 'email', ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  return { created: newAttendees.length, skipped: existingSet.size, emails: newAttendees };
}

export default async function handler(req, res) {
  const action = req.query.action || (req.body && req.body.action);

  // POST get-admin-token — exchange Google token for server-side admin token
  if (req.method === 'POST' && action === 'get-admin-token') {
    const { googleToken } = req.body || {};
    if (!googleToken) return res.status(400).json({error:'googleToken required'});
    try {
      // Verify with Google
      const r = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(googleToken)}`);
      const info = await r.json();
      const adminEmail = process.env.ADMIN_EMAIL || '';
      const partnerEmails = (process.env.PARTNER_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
      const allowed = [adminEmail, ...partnerEmails].filter(Boolean).map(e => e.toLowerCase());
      const receivedEmail = (info.email || '').toLowerCase();
      if (!receivedEmail || !allowed.includes(receivedEmail)) {
        console.error('get-admin-token: rejected email:', receivedEmail, 'allowed:', allowed);
        return res.status(403).json({error:'Not authorized — received: '+receivedEmail});
      }
      return res.status(200).json({token: signAdminToken(info.email), email: info.email});
    } catch (err) {
      console.error('get-admin-token error:', err);
      return res.status(500).json({error:'Token verification failed'});
    }
  }

  // ── Italy 2026 Live Tracker ──────────────────────────────────────────────────
  if (action === 'live-login') {
    const { password } = req.body || {};
    if (password !== ITALY_LIVE_PASSWORD) return res.status(403).json({ ok: false, error: 'Wrong password' });
    return res.status(200).json({ ok: true, token: signLiveToken() });
  }

  if (action === 'live-verify') {
    const token = req.headers['x-live-token'] || '';
    return res.status(200).json({ ok: verifyLiveToken(token) });
  }

  if (action === 'live-update-location') {
    // Called from italy2026.html on login — requires valid italy session token
    const italyToken = req.headers['x-italy-token'] || '';
    if (!verifyItalyToken(italyToken)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { lat, lng, city } = req.body || {};
    if (!lat || !lng) return res.status(400).json({ ok: false, error: 'lat/lng required' });
    const { error } = await supabase.from('italy_location').upsert({ id: 1, lat, lng, city: city || null, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (action === 'live-get-location') {
    const token = req.headers['x-live-token'] || '';
    if (!verifyLiveToken(token)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { data, error } = await supabase.from('italy_location').select('*').eq('id', 1).single();
    if (error || !data) return res.status(200).json({ ok: true, lat: null, lng: null });
    return res.status(200).json({ ok: true, ...data });
  }

  if (action === 'live-get-photos') {
    const token = req.headers['x-live-token'] || '';
    if (!verifyLiveToken(token)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    let photos = await getICloudPhotos();

    // ── R2 sync: upload any new thumbnails, swap in permanent CDN URLs ──
    if (r2 && photos.length) {
      try {
        const manifest = await getR2Manifest();
        const toSync = photos.filter(p => p.guid && p.thumb && !manifest[p.guid]);

        if (toSync.length) {
          // Upload all new thumbnails in parallel (small files, fast)
          const results = await Promise.allSettled(
            toSync.map(async p => {
              const key = `thumbs/${p.guid}.jpg`;
              const ok = await uploadToR2(key, p.thumb);
              return ok ? { guid: p.guid, key } : null;
            })
          );
          let updated = false;
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
              manifest[r.value.guid] = r.value.key;
              updated = true;
            }
          });
          if (updated) await saveR2Manifest(manifest);
        }

        // Swap in permanent R2 URLs for thumbnails
        photos = photos.map(p => ({
          ...p,
          thumb: (p.guid && manifest[p.guid])
            ? `${R2_PUBLIC_URL}/${manifest[p.guid]}`
            : p.thumb,
        }));
      } catch (e) {
        console.error('R2 sync error:', e.message);
        // Fall through — return iCloud URLs as-is
      }
    }

    return res.status(200).json({ ok: true, photos });
  }

  // ── Italy 2026 auth ─────────────────────────────────────────────────────────
  if (action === 'italy-auth') {
    res.setHeader('Access-Control-Allow-Origin', 'https://dmpickleball.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-italy-token');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET: verify existing session token
    if (req.method === 'GET') {
      const token = req.headers['x-italy-token'] || req.query.token || '';
      const email = verifyItalyToken(token);
      if (!email) return res.status(401).json({ ok: false, error: 'Invalid or expired session' });
      return res.status(200).json({ ok: true, email });
    }

    // POST: exchange Google ID token for HMAC session
    if (req.method === 'POST') {
      const { googleToken } = req.body || {};
      if (!googleToken) return res.status(400).json({ ok: false, error: 'Missing googleToken' });
      let userInfo;
      try {
        const idRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleToken)}`);
        if (idRes.ok) {
          userInfo = await idRes.json();
        } else {
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
      if (!ITALY_ALLOWED_EMAILS.includes(email)) {
        return res.status(403).json({ ok: false, error: `${email} is not authorised to view this page.` });
      }
      const token = signItalyToken(email);
      return res.status(200).json({ ok: true, token, email, name: userInfo.given_name || '' });
    }
  }


  // ── Italy 2026 Comments ─────────────────────────────────────────────────────
  if (action === 'live-get-comments') {
    const { data, error } = await supabase
      .from('italy_comments')
      .select('id, name, message, created_at, reply, reply_at, reply_by')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, comments: data || [] });
  }

  if (action === 'live-submit-comment') {
    if (req.method !== 'POST') return res.status(405).end();
    const { name, message } = req.body || {};
    if (!name?.trim() || !message?.trim())
      return res.status(400).json({ ok: false, error: 'Name and message are required' });
    if (message.length > 800) return res.status(400).json({ ok: false, error: 'Message too long' });
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    if (!rateLimit(ip + ':comment', 5, 10 * 60 * 1000))
      return res.status(429).json({ ok: false, error: 'Too many comments — please wait a few minutes' });
    const { data, error } = await supabase
      .from('italy_comments')
      .insert({ name: name.trim().slice(0, 60), message: message.trim().slice(0, 800) })
      .select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, comment: data });
  }

  if (action === 'live-reply-comment') {
    if (req.method !== 'POST') return res.status(405).end();
    const token = req.headers['x-italy-token'] || '';
    const email = verifyItalyToken(token);
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { comment_id, reply } = req.body || {};
    if (!comment_id || !reply?.trim())
      return res.status(400).json({ ok: false, error: 'comment_id and reply required' });
  const ITALY_NAMES = { 'davidmokblock@gmail.com': 'David', 'amandale91@gmail.com': 'Amanda' };
    const replyBy = ITALY_NAMES[email] || 'David & Amanda';
    const { data, error } = await supabase
      .from('italy_comments')
      .update({ reply: reply.trim().slice(0, 800), reply_at: new Date().toISOString(), reply_by: replyBy })
      .eq('id', comment_id)
      .select().single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, comment: data });
  }


  if (action === 'live-delete-comment') {
    if (req.method !== 'POST') return res.status(405).end();
    const token = req.headers['x-italy-token'] || '';
    const email = verifyItalyToken(token);
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { comment_id } = req.body || {};
    if (!comment_id) return res.status(400).json({ ok: false, error: 'comment_id required' });
    const { error } = await supabase.from('italy_comments').delete().eq('id', comment_id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (action === 'live-delete-reply') {
    if (req.method !== 'POST') return res.status(405).end();
    const token = req.headers['x-italy-token'] || '';
    const email = verifyItalyToken(token);
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { comment_id } = req.body || {};
    if (!comment_id) return res.status(400).json({ ok: false, error: 'comment_id required' });
    const { error } = await supabase.from('italy_comments')
      .update({ reply: null, reply_at: null, reply_by: null })
      .eq('id', comment_id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  // GET all approved active students
  if (req.method === 'GET' && action === 'list') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { data, error } = await supabase.from('students').select('*').eq('approved', true).neq('blocked', true).order('last_name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ students: data });
  }

  // GET removed students (archived — email freed for re-registration)
  // Cross-references deleted_students with students table to get blocked status
  if (req.method === 'GET' && action === 'list-deleted') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { data, error } = await supabase.from('deleted_students').select('*').order('deleted_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    // Find which removed students have a blocked sentinel in the students table
    const { data: blockedSentinels } = await supabase.from('students').select('email').eq('approved', false).eq('blocked', true);
    const blockedSet = new Set((blockedSentinels || []).map(b => b.email));
    const result = (data || []).map(s => ({ ...s, blocked: blockedSet.has(s.email) }));
    return res.status(200).json({ students: result });
  }

  // GET single student
  if (req.method === 'GET' && action === 'get') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { data, error } = await supabase.from('students').select('*').eq('email', email.toLowerCase()).single();
    if (error) return res.status(404).json({ error: 'Student not found' });
    return res.status(200).json({ student: data });
  }

  // POST update student
  if (req.method === 'POST' && action === 'update') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email, updates } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { error } = await supabase.from('students').update(updates).eq('email', email.toLowerCase());
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST request access
  if (req.method === 'POST' && action === 'request') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!rateLimit(ip, 3, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
    }
    const { email, name, firstName, lastName, commEmail, phone, homeCourt, skillLevel, goals, referralSource, duprRating, duprId, authProvider } = req.body;
    if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' });
    const lowerEmail = email.toLowerCase();

    // Check students table for existing or blocked record
    const { data: existing } = await supabase.from('students').select('email,blocked,approved').eq('email', lowerEmail).single();
    if (existing) {
      if (existing.blocked) return res.status(400).json({ error: 'blocked' });
      return res.status(400).json({ error: 'already_exists' });
    }

    const { data: existingRequest } = await supabase.from('access_requests').select('id').eq('email', lowerEmail).eq('status', 'pending').single();
    if (existingRequest) return res.status(400).json({ error: 'already_requested' });
    const { error } = await supabase.from('access_requests').insert({
      email: lowerEmail,
      name,
      first_name: firstName || '',
      last_name: lastName || '',
      comm_email: commEmail || '',
      phone,
      home_court: homeCourt || '',
      skill_level: skillLevel || '',
      goals: goals || '',
      referral_source: referralSource || '',
      dupr_rating: duprRating || '',
      auth_provider: authProvider || 'google',
    });
    if (error) return res.status(500).json({ error: error.message });
    // Save DUPR ID separately — requires dupr_id column in access_requests table
    // Run this SQL in Supabase if not yet added:
    //   ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS dupr_id TEXT DEFAULT '';
    if (duprId) {
      await supabase.from('access_requests').update({ dupr_id: duprId.toUpperCase() }).eq('email', lowerEmail);
      // Ignore error if column doesn't exist yet
    }
    return res.status(200).json({ success: true });
  }

  // POST approve/deny
  if (req.method === 'POST' && action === 'approve') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { requestId, email, name, firstName, lastName, commEmail, phone, homeCourt, skillLevel, duprRating, duprId, memberType, grandfathered, action: approveAction } = req.body;
    if (approveAction === 'deny') {
      await supabase.from('access_requests').update({ status: 'denied' }).eq('id', requestId);
      return res.status(200).json({ success: true });
    }
    const { error } = await supabase.from('students').upsert({
      email: email.toLowerCase(),
      name,
      first_name: firstName || '',
      last_name: lastName || '',
      comm_email: commEmail || '',
      phone: phone || '',
      home_court: homeCourt || '',
      skill_level: skillLevel || '',
      dupr_rating: duprRating || '',
      dupr_id: duprId || '',
      member_type: memberType || 'public',
      grandfathered: !!grandfathered,
      approved: true,
      blocked: false,
    });
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId);
    return res.status(200).json({ success: true });
  }

  // POST remove student — archives profile to deleted_students, removes from students
  // This frees the email for re-registration while preserving lesson history
  if (req.method === 'POST' && action === 'delete') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    // Fetch current student record to archive
    const { data: student } = await supabase.from('students').select('*').eq('email', lowerEmail).single();
    if (student) {
      await supabase.from('deleted_students').upsert({
        email: lowerEmail,
        name: student.name || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        comm_email: student.comm_email || '',
        phone: student.phone || '',
        city: student.city || '',
        home_court: student.home_court || '',
        skill_level: student.skill_level || '',
        dupr_rating: student.dupr_rating || '',
        dupr_id: student.dupr_id || '',
        member_type: student.member_type || 'public',
        picture: student.picture || '',
        deleted_at: new Date().toISOString(),
      });
    }

    // Remove from students table — frees the email
    const { error } = await supabase.from('students').delete().eq('email', lowerEmail);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST restore student — moves from deleted_students back to students (active)
  if (req.method === 'POST' && action === 'restore') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    const { data: archived } = await supabase.from('deleted_students').select('*').eq('email', lowerEmail).single();
    if (!archived) return res.status(404).json({ error: 'Not found in removed students' });

    // Remove any blocked sentinel from students table
    await supabase.from('students').delete().eq('email', lowerEmail).eq('approved', false);

    // Restore to students as active
    const { error } = await supabase.from('students').upsert({
      email: lowerEmail,
      name: archived.name || '',
      first_name: archived.first_name || '',
      last_name: archived.last_name || '',
      comm_email: archived.comm_email || '',
      phone: archived.phone || '',
      city: archived.city || '',
      home_court: archived.home_court || '',
      skill_level: archived.skill_level || '',
      dupr_rating: archived.dupr_rating || '',
      dupr_id: archived.dupr_id || '',
      member_type: archived.member_type || 'public',
      picture: archived.picture || '',
      approved: true,
      blocked: false,
    });
    if (error) return res.status(500).json({ error: error.message });

    // Remove from deleted_students
    await supabase.from('deleted_students').delete().eq('email', lowerEmail);
    return res.status(200).json({ success: true });
  }

  // POST block/unblock a removed student
  // Uses a sentinel record in students table (approved:false, blocked:true) to gate re-registration
  if (req.method === 'POST' && action === 'block-removed') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email, block } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    if (block) {
      // Upsert blocked sentinel — prevents re-registration
      await supabase.from('students').upsert({ email: lowerEmail, name: lowerEmail, approved: false, blocked: true });
    } else {
      // Remove the sentinel so they can re-register
      await supabase.from('students').delete().eq('email', lowerEmail).eq('approved', false);
    }
    return res.status(200).json({ success: true });
  }

  // POST dupr-lookup — fetch live DUPR rating for a player by ID
  if (req.method === 'POST' && action === 'dupr-lookup') {
    const { duprId, email } = req.body;
    if (!duprId) return res.status(400).json({ error: 'duprId required' });

    const DUPR_EMAIL = process.env.DUPR_EMAIL;
    const DUPR_PASSWORD = process.env.DUPR_PASSWORD;

    if (!DUPR_EMAIL || !DUPR_PASSWORD) {
      return res.status(200).json({ error: 'DUPR_NOT_CONFIGURED', rating: null });
    }

    try {
      // Step 1: Login — endpoint changed from /user/login to /login (confirmed Apr 2026)
      const loginRes = await fetch('https://api.dupr.gg/auth/v1.0/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: DUPR_EMAIL, password: DUPR_PASSWORD }),
      });
      if (!loginRes.ok) {
        const errText = await loginRes.text().catch(() => '');
        const hint = `(using ${DUPR_EMAIL.slice(0,3)}***@${DUPR_EMAIL.split('@')[1]||'?'})`;
        throw new Error(`DUPR login failed ${hint} (${loginRes.status}): ${errText.slice(0,120)}`);
      }
      const loginData = await loginRes.json();
      // Token may be at result.token, result.accessToken, or top-level accessToken
      const token = loginData?.result?.token || loginData?.result?.accessToken
        || loginData?.token || loginData?.accessToken;
      if (!token) throw new Error('DUPR login ok but no token found. Response keys: ' + Object.keys(loginData?.result || loginData).join(', '));

      // Step 2: Resolve alphanumeric DUPR ID → numeric userId
      const byDuprIdRes = await fetch('https://api.dupr.gg/player/search/byDuprId', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ duprId: duprId.toUpperCase() }),
      });
      if (!byDuprIdRes.ok) throw new Error(`DUPR ID lookup failed (${byDuprIdRes.status})`);
      const byDuprIdData = await byDuprIdRes.json();
      const numericUserId = byDuprIdData?.results?.[0]?.userId || byDuprIdData?.result?.userId;
      if (!numericUserId) throw new Error(`DUPR ID "${duprId}" not found. Response: ` + JSON.stringify(byDuprIdData).slice(0,200));

      // Step 3: Fetch player profile with ratings using numeric ID
      const playerRes = await fetch(`https://api.dupr.gg/player/v1.0/${numericUserId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (!playerRes.ok) throw new Error(`Player profile fetch failed (${playerRes.status})`);
      const playerData = await playerRes.json();

      const profile = playerData?.result || playerData;
      const ratings = profile?.ratings || {};
      // Ratings come as strings like "4.380" or "NR"
      const parseRating = (v) => {
        if (!v || v === 'NR' || v === 'null') return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };
      const singlesRating = parseRating(ratings.singles);
      const doublesRating = parseRating(ratings.doubles);
      const fullName = profile?.fullName || profile?.displayName || null;

      // Auto-save to Supabase if email provided
      if (email) {
        const updates = { dupr_id: String(duprId) };
        if (singlesRating != null) updates.dupr_rating = String(parseFloat(singlesRating).toFixed(2));
        if (doublesRating != null) updates.dupr_doubles_rating = String(parseFloat(doublesRating).toFixed(2));
        if (fullName) updates.dupr_player_name = fullName;
        await supabase.from('students').update(updates).eq('email', email.toLowerCase());
      }

      return res.status(200).json({
        rating: singlesRating,
        doublesRating,
        fullName,
        raw: profile,
      });
    } catch (err) {
      return res.status(200).json({ error: err.message, rating: null });
    }
  }

  // GET pending requests
  if (req.method === 'GET' && action === 'pending') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { data, error } = await supabase.from('access_requests').select('*').eq('status', 'pending').order('requested_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ requests: data });
  }

  // POST backfill — scan personal calendar from 1/1/25 to today, create provisional accounts
  // Uses GOOGLE_PERSONAL_CALENDAR_ID env var (set to dmpickleball@gmail.com once shared)
  if (req.method === 'POST' && action === 'backfill') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const calendarId = process.env.GOOGLE_PERSONAL_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) return res.status(500).json({ error: 'GOOGLE_PERSONAL_CALENDAR_ID not set' });
    try {
      const timeMin = new Date('2025-01-01T00:00:00-08:00').toISOString();
      const timeMax = new Date().toISOString();
      const result = await syncCalendarToStudents(calendarId, timeMin, timeMax);
      return res.status(200).json({ ok: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST sync — scan personal calendar from 1/1/25 to +30 days (full history + upcoming)
  if (req.method === 'POST' && action === 'sync') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const calendarId = process.env.GOOGLE_PERSONAL_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) return res.status(500).json({ error: 'GOOGLE_CALENDAR_ID not set' });
    try {
      const timeMin = new Date('2025-01-01T00:00:00-08:00').toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = await syncCalendarToStudents(calendarId, timeMin, timeMax);
      return res.status(200).json({ ok: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET calendar-history — fetch all calendar events for a specific student email (admin only)
  if (req.method === 'GET' && action === 'calendar-history') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const calendarId = process.env.GOOGLE_PERSONAL_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) return res.status(500).json({ error: 'Calendar not configured' });
    try {
      const calendar = google.calendar({ version: 'v3', auth: getCalAuth() });
      const timeMin = new Date('2025-01-01T00:00:00-08:00').toISOString();
      const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      let pageToken = null;
      const lessons = [];
      do {
        const response = await calendar.events.list({
          calendarId,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
          ...(pageToken ? { pageToken } : {}),
        });
        const items = response.data.items || [];
        for (const event of items) {
          if (event.status === 'cancelled') continue;
          if (!event.attendees || event.attendees.length === 0) continue;
          const match = event.attendees.find(a => (a.email||'').toLowerCase() === email.toLowerCase());
          if (!match) continue;
          lessons.push(calEventToLesson(event));
        }
        pageToken = response.data.nextPageToken || null;
      } while (pageToken);
      // Sort newest first
      lessons.sort((a, b) => b.date.localeCompare(a.date));
      return res.status(200).json({ lessons });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST promote — mark a provisional account as fully set up (remove provisional flag)
  if (req.method === 'POST' && action === 'promote') {
    const adminEmail = requireAdmin(req, res); if (!adminEmail) return;
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { error } = await supabase.from('students').update({ provisional: false, source: 'self_registered' }).eq('email', email.toLowerCase());
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(400).json({ error: 'Invalid action' });
}
