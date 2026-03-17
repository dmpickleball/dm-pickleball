import { supabase } from './supabase.js';

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
      student_email: lesson.studentEmail,
      date: lesson.date,
      time: lesson.time,
      type: lesson.type,
      duration: lesson.duration,
      status: lesson.status || 'confirmed',
      focus: lesson.focus || '',
      notes: lesson.notes || '',
      gcal_event_id: lesson.gcalEventId || '',
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

  res.status(400).json({ error: 'Invalid action' });
}
