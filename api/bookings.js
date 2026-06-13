import { google } from 'googleapis';

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
const rateLimitMap = new Map();
function isRateLimited(ip, maxRequests = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  // Prune old entries periodically
  if (rateLimitMap.size > 500) {
    for (const [k, v] of rateLimitMap) { if (now > v.resetAt) rateLimitMap.delete(k); }
  }
  return entry.count > maxRequests;
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

function getAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

async function handleCreate(body, res) {
  const { summary, description, date, startTime, endTime, studentEmail, studentName, location, additionalEmails } = body;
  const calendar = google.calendar({ version: 'v3', auth: getAuth() });

  const allAttendeeEmails = [
    studentEmail,
    ...(Array.isArray(additionalEmails) ? additionalEmails : [])
  ].filter((e, i, arr) => e && arr.indexOf(e) === i);
  const attendees = allAttendeeEmails.map(email => ({ email }));

  const baseBody = {
    summary: summary || `Pickleball Lesson — ${studentName}`,
    description: description || '',
    location: location || '',
    start: { dateTime: `${date}T${startTime}:00`, timeZone: 'America/Los_Angeles' },
    end: { dateTime: `${date}T${endTime}:00`, timeZone: 'America/Los_Angeles' },
  };

  let event, attendeesAdded = false, attendeeError = null;
  try {
    event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      sendUpdates: 'none',
      requestBody: { ...baseBody, attendees, guestsCanModifyEvent: false, guestsCanInviteOthers: false },
    });
    attendeesAdded = true;
  } catch (err) {
    attendeeError = err.message;
    event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      sendUpdates: 'none',
      requestBody: baseBody,
    });
  }

  return res.status(200).json({
    success: true,
    eventId: event.data.id,
    attendeesAdded,
    attendeeCount: attendees.length,
    ...(attendeeError ? { attendeeError } : {}),
  });
}

async function handleCancel(body, res) {
  const { eventId, mode } = body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });
  const calendar = google.calendar({ version: 'v3', auth: getAuth() });

  if (mode === 'delete') {
    await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId });
    return res.status(200).json({ success: true, mode: 'delete' });
  }

  const existing = await calendar.events.get({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId });
  const event = existing.data;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const attendees = event.attendees || [];
  const updatedAttendees = attendees.map(a =>
    a.email === calendarId || a.organizer ? { ...a, responseStatus: 'declined' } : a
  );
  if (!updatedAttendees.some(a => a.email === calendarId)) {
    updatedAttendees.push({ email: calendarId, responseStatus: 'declined', organizer: true });
  }
  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    eventId,
    requestBody: { attendees: updatedAttendees },
  });
  return res.status(200).json({ success: true, mode: 'cancel' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ip = getClientIp(req);
  // Rate limit: 10 booking/cancel requests per minute per IP
  if (isRateLimited(ip, 10, 60_000)) {
    return res.status(429).json({ error: 'Too many requests — please wait a moment and try again.' });
  }
  const { action } = req.body || {};
  try {
    if (action === 'cancel') return await handleCancel(req.body, res);
    return await handleCreate(req.body, res);
  } catch (err) {
    console.error('bookings error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
