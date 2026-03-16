import { supabase } from './supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, name, phone, homeCourt } = req.body;
  if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' });

  // Check if already a student
  const { data: existing } = await supabase
    .from('students')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();
  if (existing) return res.status(400).json({ error: 'already_exists' });

  // Check if already requested
  const { data: existingRequest } = await supabase
    .from('access_requests')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();
  if (existingRequest) return res.status(400).json({ error: 'already_requested' });

  const { error } = await supabase
    .from('access_requests')
    .insert({ email: email.toLowerCase(), name, phone, home_court: homeCourt || '' });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
