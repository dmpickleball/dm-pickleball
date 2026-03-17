import { supabase } from './supabase.js';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('approved', true)
    .order('last_name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ students: data });
}
