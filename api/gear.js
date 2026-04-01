import { supabase } from './supabase.js';

const ROW_ID = 'main';

export default async function handler(req, res) {
  // GET — return current gear settings
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('gear_settings')
      .select('*')
      .eq('id', ROW_ID)
      .single();
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ gear: data || null });
  }

  // POST — update gear settings
  if (req.method === 'POST') {
    const { paddle_name, paddle_link, paddle_start, bag_name, bag_detail, bag_link, paddle_history } = req.body;

    const updated_at = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const { error } = await supabase
      .from('gear_settings')
      .upsert({
        id: ROW_ID,
        paddle_name,
        paddle_link,
        paddle_start,
        bag_name,
        bag_detail,
        bag_link,
        paddle_history,
        updated_at,
      }, { onConflict: 'id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, updated_at });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
