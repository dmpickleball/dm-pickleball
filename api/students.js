import { supabase } from './_supabase.js';
import { google } from 'googleapis';
import { createHmac, timingSafeEqual } from 'crypto';

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
  const action = req.query.action;

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
      const allowed = [adminEmail, ...partnerEmails];
      if (!info.email || !allowed.includes(info.email)) return res.status(403).json({error:'Not authorized'});
      return res.status(200).json({token: signAdminToken(info.email), email: info.email});
    } catch (err) {
      console.error('get-admin-token error:', err);
      return res.status(500).json({error:'Token verification failed'});
    }
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

  // GET calendar-history — fetch all calendar events for a specific student email
  if (req.method === 'GET' && action === 'calendar-history') {
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
