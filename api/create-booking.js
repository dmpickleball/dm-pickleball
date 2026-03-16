import { google } from 'googleapis';

function getAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { summary, description, date, startTime, endTime, studentEmail, studentName } = req.body;
  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: summary || `Pickleball Lesson — ${studentName}`,
        description: description || '',
        start: { dateTime: `${date}T${startTime}:00`, timeZone: 'America/Los_Angeles' },
        end: { dateTime: `${date}T${endTime}:00`, timeZone: 'America/Los_Angeles' },
        attendees: studentEmail ? [{ email: studentEmail }] : [],
      },
    });
    res.status(200).json({ success: true, eventId: event.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
