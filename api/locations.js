import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const action = req.query.action;

  // GET all locations
  if (req.method === 'GET' && action === 'list') {
    const { data, error } = await supabase.from('locations').select('*').order('name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ locations: data });
  }

  // POST add location
  if (req.method === 'POST' && action === 'add') {
    const { name, address } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'name and address required' });
    const { data, error } = await supabase.from('locations').insert({ name, address }).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, location: data[0] });
  }

  // POST update location
  if (req.method === 'POST' && action === 'update') {
    const { id, name, address } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase.from('locations').update({ name, address }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST delete location
  if (req.method === 'POST' && action === 'delete') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(400).json({ error: 'Invalid action' });
}
