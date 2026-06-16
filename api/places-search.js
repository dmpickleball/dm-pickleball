// ────────────────────────────────────────────────────────────────────────────
// This function serves TWO jobs to stay within the Vercel Hobby 12-function cap:
//   1) Default: Google Places text search (used by location pickers).
//   2) ?feed=kalshi : read-only proxy for 2026 World Cup market prices on Kalshi
//      (used by /ev). Kalshi's public market-data API blocks direct browser calls
//      (CORS), so the page reads it through this server-side relay instead.
// ────────────────────────────────────────────────────────────────────────────

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const WC_SERIES = { ml: 'KXWCGAME', spread: 'KXWCSPREAD', total: 'KXWCTOTAL', btts: 'KXWCBTTS' };
const MONTHS = { JAN:'01', FEB:'02', MAR:'03', APR:'04', MAY:'05', JUN:'06', JUL:'07', AUG:'08', SEP:'09', OCT:'10', NOV:'11', DEC:'12' };

// Mid-price in whole cents from a market's yes (or no) bid/ask, falling back to last trade.
function midCents(bid, ask, last) {
  const b = parseFloat(bid), a = parseFloat(ask), l = parseFloat(last);
  if (b > 0 && a > 0) return Math.round(((b + a) / 2) * 100);
  if (l > 0) return Math.round(l * 100);
  if (a > 0) return Math.round(a * 100);
  if (b > 0) return Math.round(b * 100);
  return null;
}
function yesMid(m) { return midCents(m.yes_bid_dollars, m.yes_ask_dollars, m.last_price_dollars); }
function noMid(m)  { return midCents(m.no_bid_dollars,  m.no_ask_dollars,  null); }

// "KXWCGAME-26JUN27JORARG" -> "2026-06-27"
function dateFromTicker(eventTicker) {
  const tail = (eventTicker || '').split('-')[1] || '';
  const m = tail.match(/^(\d{2})([A-Z]{3})(\d{2})/);
  if (!m || !MONTHS[m[2]]) return null;
  return `20${m[1]}-${MONTHS[m[2]]}-${m[3]}`;
}
// Event title "Jordan vs Argentina" or "Jordan vs Argentina: Spread" -> ["Jordan","Argentina"]
function teamsFromTitle(title) {
  const base = (title || '').split(':')[0];
  const parts = base.split(/\s+vs\.?\s+/i);
  return parts.length === 2 ? [parts[0].trim(), parts[1].trim()] : null;
}

async function fetchSeriesEvents(seriesTicker) {
  const out = [];
  let cursor = '';
  for (let page = 0; page < 8; page++) {
    const url = `${KALSHI_BASE}/events?series_ticker=${seriesTicker}&with_nested_markets=true&status=open&limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) break;
    const data = await r.json();
    (data.events || []).forEach(e => out.push(e));
    cursor = data.cursor || '';
    if (!cursor) break;
  }
  return out;
}

async function kalshiHandler(req, res) {
  try {
    const [mlEv, spEv, totEv, bttsEv] = await Promise.all([
      fetchSeriesEvents(WC_SERIES.ml),
      fetchSeriesEvents(WC_SERIES.spread),
      fetchSeriesEvents(WC_SERIES.total),
      fetchSeriesEvents(WC_SERIES.btts),
    ]);

    // Assemble per-match record keyed by event ticker tail (date+teams), which is
    // identical across the four series for the same fixture.
    const byKey = {};
    function rec(ev) {
      const key = (ev.event_ticker || '').split('-')[1] || ev.event_ticker;
      if (!byKey[key]) {
        byKey[key] = { date: dateFromTicker(ev.event_ticker), teams: teamsFromTitle(ev.title) };
      }
      return byKey[key];
    }

    // Moneyline: yes_sub_title is a team name or "Tie"
    mlEv.forEach(ev => {
      const r = rec(ev); r.ml = r.ml || {};
      (ev.markets || []).forEach(m => {
        const c = yesMid(m);
        if (c !== null) r.ml[m.yes_sub_title] = c;
      });
    });

    // Spread: each market is "<Team> wins by over <line> goals". Keep yes (team -line)
    // and no (other side +line) for each team & line.
    spEv.forEach(ev => {
      const r = rec(ev); r.spread = r.spread || {};
      (ev.markets || []).forEach(m => {
        const sub = m.yes_sub_title || '';
        const mm = sub.match(/^(.*) wins by over ([\d.]+)/i);
        if (!mm) return;
        const team = mm[1].trim(), line = mm[2];
        r.spread[team] = r.spread[team] || {};
        r.spread[team][line] = { y: yesMid(m), n: noMid(m) };
      });
    });

    // Total: each market is "Over <line> goals scored"
    totEv.forEach(ev => {
      const r = rec(ev); r.total = r.total || {};
      (ev.markets || []).forEach(m => {
        const ln = (m.floor_strike !== undefined && m.floor_strike !== null) ? String(m.floor_strike) : null;
        if (ln === null) return;
        r.total[ln] = { over: yesMid(m), under: noMid(m) };
      });
    });

    // BTTS: single yes/no market
    bttsEv.forEach(ev => {
      const r = rec(ev);
      const m = (ev.markets || [])[0];
      if (m) r.btts = { yes: yesMid(m), no: noMid(m) };
    });

    const matches = Object.values(byKey).filter(r => r.date && r.teams);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ updated: new Date().toISOString(), count: matches.length, matches });
  } catch (err) {
    console.error('kalshi proxy error', err);
    return res.status(502).json({ error: 'kalshi_fetch_failed', message: err.message, matches: [] });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // World Cup price proxy branch (keeps us at 12 Vercel functions).
  // NOTE: param is "feed" not "source" — Vercel strips a "source" query param in routing.
  if (req.query.feed === 'kalshi') return kalshiHandler(req, res);

  // ── Default behavior: Google Places text search ──────────────────────────────
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
