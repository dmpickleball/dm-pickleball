import { supabase } from './_supabase.js';
import { google } from 'googleapis';

function getCalAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

export default async function handler(req, res) {
  const action = req.query.action;

  // GET lessons
  if (req.method === 'GET' && action === 'list') {
    const { email } = req.query;
    let query = supabase.from('lessons').select('*').order('date', { ascending: false });
    if (email) query = query.eq('student_email', email.toLowerCase());
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ lessons: data });
  }

  // POST save lesson
  if (req.method === 'POST' && action === 'save') {
    const { lesson } = req.body;
    const { data, error } = await supabase.from('lessons').insert({
      student_email: (lesson.studentEmail||'').toLowerCase(),
      date: lesson.date,
      time: lesson.time,
      type: lesson.type,
      duration: lesson.duration,
      status: lesson.status || 'confirmed',
      focus: lesson.focus || '',
      notes: lesson.notes || '',
      gcal_event_id: lesson.gcalEventId || '',
      ticket_id: lesson.ticketId || '',
      partner_email: lesson.partnerEmail || '',
      group_emails: lesson.groupEmails || [],
      members: lesson.members || [],
    }).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, id: data[0]?.id });
  }

  // POST update lesson
  if (req.method === 'POST' && action === 'update') {
    const { lessonId, updates } = req.body;
    const { error } = await supabase.from('lessons').update(updates).eq('id', lessonId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST delete lesson
  if (req.method === 'POST' && action === 'delete') {
    const { lessonId } = req.body;
    console.log('delete lesson: lessonId=', lessonId, 'type=', typeof lessonId);
    const { error, data } = await supabase.from('lessons').delete().eq('id', lessonId).select();
    console.log('delete result: error=', error?.message, 'data=', JSON.stringify(data));
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Lesson not found in database (id: ' + lessonId + ')' });
    return res.status(200).json({ success: true });
  }

  // POST check-rsvp — fetch Google Calendar RSVP status for a lesson
  if (req.method === 'POST' && action === 'check-rsvp') {
    const { gcalEventId } = req.body;
    if (!gcalEventId) return res.status(400).json({ error: 'gcalEventId required' });
    try {
      const calendar = google.calendar({ version: 'v3', auth: getCalAuth() });
      const event = await calendar.events.get({ calendarId: process.env.GOOGLE_CALENDAR_ID, eventId: gcalEventId });
      const attendees = (event.data.attendees || []).map(a => ({ email: a.email, status: a.responseStatus }));
      return res.status(200).json({ attendees, anyAccepted: attendees.some(a => a.status === 'accepted') });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({ error: 'Invalid action' });
}
