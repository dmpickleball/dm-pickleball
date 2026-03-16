import { supabase } from './supabase.js';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('access_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ requests: data });
}
