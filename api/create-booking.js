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
    ].filter((e, i, arr) => e && arr.indexOf(e) === i); // dedupe + remove empty
    const attendees = allAttendeeEmails.map(email => ({ email }));

    console.log('create-booking: studentEmail=', studentEmail, 'attendees=', JSON.stringify(attendees));

    const baseBody = {
      summary: summary || `Pickleball Lesson — ${studentName}`,
      description: description || '',
      location: location || '',
      start: { dateTime: `${date}T${startTime}:00`, timeZone: 'America/Los_Angeles' },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: 'America/Los_Angeles' },
    };

    // Try creating WITH attendees. sendUpdates:'none' prevents 403s from service accounts
    // trying to email external users — guests are still added to the event for RSVP tracking.
    let event;
    let attendeesAdded = false;
    let attendeeError = null;
    try {
      event = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        sendUpdates: 'none',
        requestBody: {
          ...baseBody,
          attendees,
          guestsCanModifyEvent: false,
          guestsCanInviteOthers: false,
        },
      });
      attendeesAdded = true;
      console.log('create-booking: event created WITH attendees, id=', event.data.id);
    } catch (attendeeErr) {
      attendeeError = attendeeErr.message;
      console.warn('create-booking: attendees failed (', attendeeErr.code, attendeeErr.message, '), retrying without attendees');
      event = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        sendUpdates: 'none',
        requestBody: baseBody,
      });
      console.log('create-booking: event created WITHOUT attendees (fallback), id=', event.data.id);
    }

    res.status(200).json({
      success: true,
      eventId: event.data.id,
      attendeesAdded,
      attendeeCount: attendees.length,
      ...(attendeeError ? { attendeeError } : {}),
    });
  } catch (err) {
    console.error('create-booking error:', err.message, 'code:', err.code);
    res.status(500).json({ error: err.message });
  }
}
