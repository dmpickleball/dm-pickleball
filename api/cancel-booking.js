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

  const { eventId, mode } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });

    if (mode === 'delete') {
      // Permanently delete the event
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId,
      });
      return res.status(200).json({ success: true, mode: 'delete' });
    } else {
      // Cancel mode - mark organizer as declined by updating attendee status
      // First get the event to preserve existing data
      const existing = await calendar.events.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId,
      });

      const event = existing.data;
      const attendees = event.attendees || [];

      // Mark the organizer/service account as declined
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      const updatedAttendees = attendees.map(a =>
        a.email === calendarId || a.organizer
          ? { ...a, responseStatus: 'declined' }
          : a
      );

      // If no attendees yet, add the calendar owner as declined
      if (updatedAttendees.length === 0 || !updatedAttendees.some(a => a.email === calendarId)) {
        updatedAttendees.push({ email: calendarId, responseStatus: 'declined', organizer: true });
      }

      await calendar.events.patch({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId,
        requestBody: {
          attendees: updatedAttendees,
        },
      });

      return res.status(200).json({ success: true, mode: 'cancel' });
    }
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: err.message });
  }
}
