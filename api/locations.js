import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const action = req.query.action;

  // GET places search (Google Maps autocomplete)
  if (req.method === 'GET' && action === 'search') {
    const { query } = req.query;
    if (!query || query.length < 2) return res.status(200).json({ suggestions: [] });
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://places.googleapis.com/v1/places:searchText`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
          textQuery: query,
          locationBias: {
            circle: {
              center: { latitude: 37.4775, longitude: -122.1697 },
              radius: 50000,
            },
          },
          maxResultCount: 5,
        }),
      });
      const data = await response.json();
      const suggestions = (data.places || []).map(p => ({
        name: p.displayName?.text || '',
        address: p.formattedAddress || '',
        full: p.displayName?.text + ', ' + p.formattedAddress,
      }));
      return res.status(200).json({ suggestions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

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
