import { supabase } from './supabase.js';

export default async function handler(req, res) {
  const { email } = req.query;
  let query = supabase.from('lessons').select('*').order('date', { ascending: false });
  if (email) query = query.eq('student_email', email.toLowerCase());
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ lessons: data });
}
