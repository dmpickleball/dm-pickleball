import { google } from 'googleapis';

function getAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

function fmtTime(dt) {
  if (!dt || !dt.includes('T')) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
}

function fmtDate(dt) {
  const d = new Date(dt.includes('T') ? dt : dt + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // ── Verify which event IDs still exist in Google Calendar ──────────────────
  // GET /api/calendar-events?action=verify&ids=id1,id2,id3
  // Returns { found: ['id1', 'id2'] } — IDs that exist and are not deleted/cancelled
  if (req.query.action === 'verify') {
    const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.status(200).json({ found: [] });
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const results = await Promise.all(ids.map(async id => {
      try {
        const r = await calendar.events.get({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId: id });
        return r.data.status !== 'cancelled' ? id : null;
      } catch (e) {
        return null; // 404 or any error = event gone
      }
    }));
    return res.status(200).json({ found: results.filter(Boolean) });
  }

  const { start, end, keywords } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });

  const kwList = keywords
    ? keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean)
    : [];

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start + 'T00:00:00-07:00').toISOString(),
      timeMax: new Date(end + 'T23:59:59-07:00').toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    });

    const allCalEvents = response.data.items || [];
    const events = [];

    for (const event of allCalEvents) {
      const s = (event.summary || '').toLowerCase();
      // If keywords provided, filter to only matching events
      if (kwList.length > 0 && !kwList.some(kw => s.includes(kw))) continue;

      const startDT = event.start.dateTime || event.start.date;
      const endDT = event.end.dateTime || event.end.date;

      events.push({
        date: startDT.substring(0, 10),
        dateLabel: fmtDate(startDT),
        summary: event.summary || '',
        location: event.location || '',
        description: event.description || '',
        gcalEventId: event.id,
        startTime: fmtTime(startDT),
        endTime: fmtTime(endDT),
        startDT,
        endDT,
      });
    }

    res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
