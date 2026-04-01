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
  const { summary, description, date, startTime, endTime, studentEmail, studentName, location, additionalEmails } = req.body;
  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });

    // Build attendees list: primary student + any additional (partner/group members)
    const allAttendeeEmails = [
      studentEmail,
      ...(Array.isArray(additionalEmails) ? additionalEmails : [])
    ].filter((e, i, arr) => e && arr.indexOf(e) === i); // dedupe
    const attendees = allAttendeeEmails.map(email => ({ email }));

    const baseBody = {
      summary: summary || `Pickleball Lesson — ${studentName}`,
      description: description || '',
      location: location || '',
      start: { dateTime: `${date}T${startTime}:00`, timeZone: 'America/Los_Angeles' },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: 'America/Los_Angeles' },
    };

    // Try creating WITH attendees first (enables RSVP dot tracking).
    // Service accounts can add attendees but cannot use sendUpdates:'all' without
    // domain-wide delegation — so we omit sendUpdates entirely (uses calendar default).
    // If that still fails for any reason, fall back to creating without attendees.
    let event;
    try {
      event = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: {
          ...baseBody,
          attendees,
          guestsCanModifyEvent: false,
          guestsCanInviteOthers: false,
        },
      });
    } catch (attendeeErr) {
      console.warn('create-booking: attendees failed, retrying without. Reason:', attendeeErr.message);
      event = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: baseBody,
      });
    }

    res.status(200).json({ success: true, eventId: event.data.id });
  } catch (err) {
    console.error('create-booking error:', err.message, 'code:', err.code);
    res.status(500).json({ error: err.message });
  }
}
