// api/standings.js
// Fetches the MiLP national leaderboard from DUPR (static HTML, no JS needed).
// Caches 1 hour in process memory — cold starts will re-fetch.

const MILP_DIVS = ['12','12 (Age 50+)','14','14 (Age 50+)','16','16 (Age 50+)','18','18 (Age 50+)','20','Combined'];
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
let miLPCache = null;

/**
 * Strip HTML and decode entities, return clean lines.
 */
function htmlToLines(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)))
    .replace(/&nbsp;/g, ' ');
  return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

/**
 * Parse the DUPR MiLP leaderboard HTML.
 * Sections are delimited by consecutive "Rank / Name / Points" triplet lines.
 * Each player entry follows the pattern: rank-number → player-name → points-number.
 */
function parseMiLPHtml(html) {
  const lines = htmlToLines(html);
  const result = {};

  // Locate section starts: where we see "Rank", "Name", "Points" on consecutive lines
  const sectionStarts = [];
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i] === 'Rank' && lines[i + 1] === 'Name' && lines[i + 2] === 'Points') {
      sectionStarts.push(i + 3);
    }
  }

  if (sectionStarts.length === 0) {
    console.warn('standings: could not find any Rank/Name/Points sections in DUPR HTML');
    return result;
  }

  sectionStarts.forEach((startIdx, sIdx) => {
    if (sIdx >= MILP_DIVS.length) return;
    const divName = MILP_DIVS[sIdx];
    const endIdx = sIdx + 1 < sectionStarts.length
      ? sectionStarts[sIdx + 1] - 3
      : lines.length;

    const players = [];
    let i = startIdx;

    while (i < endIdx && players.length < 10) {
      const line = lines[i];

      // A rank line: pure integer 1-100
      if (/^\d+$/.test(line)) {
        const rank = parseInt(line, 10);
        if (rank > 10) break; // done with top 10

        // Find player name: next non-numeric, meaningful line
        let nameIdx = i + 1;
        while (nameIdx < endIdx && nameIdx < i + 8 && /^\d+$/.test(lines[nameIdx])) nameIdx++;
        if (nameIdx >= endIdx) break;
        const name = lines[nameIdx];
        if (!name || name.length < 2) { i++; continue; }

        // Find points: next numeric line after the name
        let ptsIdx = nameIdx + 1;
        while (ptsIdx < endIdx && ptsIdx < nameIdx + 8 && !/^\d+$/.test(lines[ptsIdx])) ptsIdx++;
        if (ptsIdx >= endIdx) break;
        const points = parseInt(lines[ptsIdx], 10);

        players.push({ rank, name, points });
        i = ptsIdx + 1;
      } else {
        i++;
      }
    }

    if (players.length > 0) {
      result[divName] = players;
    }
  });

  return result;
}

async function fetchMiLPData() {
  if (miLPCache && Date.now() - miLPCache.at < CACHE_TTL) {
    return miLPCache;
  }

  const r = await fetch('https://www.dupr.com/minorleague/leaderboard', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!r.ok) throw new Error(`DUPR returned ${r.status}`);
  const html = await r.text();
  const divisions = parseMiLPHtml(html);

  if (Object.keys(divisions).length === 0) {
    throw new Error('Parsed 0 divisions from DUPR HTML — page structure may have changed');
  }

  miLPCache = { divisions, at: Date.now() };
  return miLPCache;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cached = miLPCache && (Date.now() - miLPCache.at < CACHE_TTL);
    const data = await fetchMiLPData();
    return res.status(200).json({
      milp: data.divisions,
      fetchedAt: data.at,
      divisions: MILP_DIVS,
      cached,
    });
  } catch (e) {
    console.error('standings error:', e.message);
    // Return stale cache if available rather than error
    if (miLPCache) {
      return res.status(200).json({
        milp: miLPCache.divisions,
        fetchedAt: miLPCache.at,
        divisions: MILP_DIVS,
        cached: true,
        stale: true,
      });
    }
    return res.status(500).json({ error: e.message });
  }
}
