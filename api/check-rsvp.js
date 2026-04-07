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
  const { gcalEventId } = req.body;
  if (!gcalEventId) return res.status(400).json({ error: 'gcalEventId required' });

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const event = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: gcalEventId,
    });
    const attendees = (event.data.attendees || []).map(a => ({
      email: a.email,
      status: a.responseStatus, // needsAction | accepted | declined | tentative
    }));
    const anyAccepted = attendees.some(a => a.status === 'accepted');
    return res.status(200).json({ attendees, anyAccepted });
  } catch (err) {
    console.error('check-rsvp error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
