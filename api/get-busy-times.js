import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const timeMin = new Date(date + 'T00:00:00-08:00').toISOString();
    const timeMax = new Date(date + 'T23:59:59-08:00').toISOString();

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busy = (response.data.items || []).map(event => {
      const start = event.start.dateTime || (event.start.date + 'T00:00:00-08:00');
      const end = event.end.dateTime || (event.end.date + 'T23:59:59-08:00');
      const startPST = new Date(start);
      const endPST = new Date(end);
      const startMins = startPST.getHours() * 60 + startPST.getMinutes();
      const endMins = endPST.getHours() * 60 + endPST.getMinutes();
      return { start, end, startMins, endMins, summary: event.summary };
    });

    res.status(200).json({ busy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
