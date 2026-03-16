import { supabase } from './supabase.js';

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  if (error) return res.status(404).json({ error: 'Student not found' });
  res.status(200).json({ student: data });
}
