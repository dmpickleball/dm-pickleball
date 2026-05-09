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

// ── Busy-times helpers (merged from get-busy-times.js) ─────────────────────
function toMins(dateTimeStr) {
  const timePart = dateTimeStr.substring(11, 16);
  const [h, m] = timePart.split(':').map(Number);
  return h * 60 + m;
}

function roundUpTo30(mins) {
  return Math.ceil(mins / 30) * 30;
}

function isSameLocation(eventLocation, lessonLocation) {
  if (!eventLocation) return false;
  const el = eventLocation.toLowerCase();
  const ll = lessonLocation.toLowerCase();
  if (ll.includes('andrew spinas') || ll.includes('3003 bay')) {
    return el.includes('andrew spinas') || el.includes('3003 bay') || el.includes('spinas');
  }
  if (ll.includes('menlo circus')) {
    return el.includes('menlo circus') || el.includes('atherton');
  }
  if (ll.includes('stanford redwood')) {
    return el.includes('stanford redwood') || el.includes('stanford');
  }
  return false;
}

async function getTravelMins(origin, destination, apiKey) {
  if (!origin || !destination) return 30;
  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();
    const durationSecs = data.rows?.[0]?.elements?.[0]?.duration?.value;
    if (!durationSecs) return 30;
    const durationMins = Math.ceil(durationSecs / 60);
    return Math.max(30, roundUpTo30(durationMins));
  } catch (e) {
    return 30;
  }
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

  // ── action=busytimes: compute busy windows with travel buffers ────────────
  if (req.query.action === 'busytimes') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { date, endDate, memberType } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });

    const lessonLocation = memberType === 'menlo'
      ? 'Menlo Circus Club, Atherton, CA'
      : 'Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063';

    try {
      const calendar = google.calendar({ version: 'v3', auth: getAuth() });
      const timeMin = new Date(date + 'T00:00:00-07:00').toISOString();
      const timeMax = new Date((endDate || date) + 'T23:59:59-07:00').toISOString();

      const response = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const busy = await Promise.all((response.data.items || []).map(async event => {
        const start = event.start.dateTime || (event.start.date + 'T00:00:00-07:00');
        const end = event.end.dateTime || (event.end.date + 'T23:59:59-07:00');
        const startMins = toMins(start);
        const endMins = toMins(end);
        const eventLocation = event.location || '';

        let bufferBefore = 0;
        let bufferAfter = 0;

        if (!eventLocation) {
          bufferBefore = 30;
          bufferAfter = 30;
        } else if (isSameLocation(eventLocation, lessonLocation)) {
          bufferBefore = 0;
          bufferAfter = 0;
        } else {
          bufferBefore = await getTravelMins(lessonLocation, eventLocation, apiKey);
          bufferAfter = await getTravelMins(eventLocation, lessonLocation, apiKey);
        }

        return { start, end, startMins, endMins, bufferBefore, bufferAfter, summary: event.summary, location: eventLocation };
      }));

      return res.status(200).json({ busy });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
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

      // Build attendee list with RSVP status (filter out the organizer/service account)
      const attendees = (event.attendees || [])
        .filter(a => !a.organizer && !a.self)
        .map(a => ({
          email: a.email || '',
          status: a.responseStatus || 'needsAction', // accepted | declined | needsAction | tentative
          displayName: a.displayName || '',
        }));

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
        attendees,
        attendeeEmails: attendees.map(a => a.email),
      });
    }

    res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
