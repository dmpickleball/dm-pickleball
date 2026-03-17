import { supabase } from './supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, updates } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { error } = await supabase
    .from('students')
    .update(updates)
    .eq('email', email.toLowerCase());
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
