import { supabase } from './supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { lessonId, updates } = req.body;
  const { error } = await supabase.from('lessons').update(updates).eq('id', lessonId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ success: true });
}
