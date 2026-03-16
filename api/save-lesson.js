import { supabase } from './supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { lesson } = req.body;
  const { error } = await supabase.from('lessons').insert({
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
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
