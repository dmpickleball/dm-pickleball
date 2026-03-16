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
  // Parse time directly from the ISO string (e.g. "2026-03-17T16:00:00-07:00")
  const timePart = dateTimeStr.substring(11, 16); // "16:00"
  const [h, m] = timePart.split(':').map(Number);
  return h * 60 + m;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

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

    const busy = (response.data.items || []).map(event => {
      const start = event.start.dateTime || (event.start.date + 'T00:00:00-07:00');
      const end = event.end.dateTime || (event.end.date + 'T23:59:59-07:00');
      const startMins = toMins(start);
      const endMins = toMins(end);
      return { start, end, startMins, endMins, summary: event.summary };
    });

    res.status(200).json({ busy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
