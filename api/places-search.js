export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

    res.status(200).json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
