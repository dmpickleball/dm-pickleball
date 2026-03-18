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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date, memberType } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  const lessonLocation = memberType === 'menlo'
    ? 'Menlo Circus Club, Atherton, CA'
    : 'Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063';

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const timeMin = new Date(date + 'T00:00:00-07:00').toISOString();
    const timeMax = new Date(date + 'T23:59:59-07:00').toISOString();

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
        // No location — apply 30 min buffer both ways
        bufferBefore = 30;
        bufferAfter = 30;
      } else if (isSameLocation(eventLocation, lessonLocation)) {
        // Same location — no buffer needed
        bufferBefore = 0;
        bufferAfter = 0;
      } else {
        // Different location — calculate real travel time
        bufferBefore = await getTravelMins(lessonLocation, eventLocation, apiKey);
        bufferAfter = await getTravelMins(eventLocation, lessonLocation, apiKey);
      }

      return { start, end, startMins, endMins, bufferBefore, bufferAfter, summary: event.summary, location: eventLocation };
    }));

    res.status(200).json({ busy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
