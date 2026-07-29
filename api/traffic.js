import { supabase } from './_supabase.js';
import { createHmac, timingSafeEqual } from 'crypto';

// ══════════════════════════════════════════════════════════════════════════════
// STANDINGS — merged here to stay within the Vercel Hobby 12-function cap.
// GET /api/traffic?resource=standings  →  public MiLP leaderboard (no auth)
// ══════════════════════════════════════════════════════════════════════════════

const MILP_DIVS = ['12','12 (Age 50+)','14','14 (Age 50+)','16','16 (Age 50+)','18','18 (Age 50+)','20','Combined'];
const STANDINGS_TTL = 60 * 60 * 1000; // 1 hour
let miLPCache = null;

function parseMiLPHtml(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c)))
    .replace(/&nbsp;/g, ' ');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sectionStarts = [];
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i] === 'Rank' && lines[i+1] === 'Name' && lines[i+2] === 'Points') {
      sectionStarts.push(i + 3);
    }
  }
  const result = {};
  sectionStarts.forEach((startIdx, sIdx) => {
    if (sIdx >= MILP_DIVS.length) return;
    const divName = MILP_DIVS[sIdx];
    const endIdx = sIdx + 1 < sectionStarts.length ? sectionStarts[sIdx+1] - 3 : lines.length;
    const players = []; let i = startIdx;
    while (i < endIdx && players.length < 10) {
      if (/^\d+$/.test(lines[i])) {
        const rank = parseInt(lines[i], 10);
        if (rank > 10) break;
        let ni = i + 1;
        while (ni < endIdx && ni < i+8 && /^\d+$/.test(lines[ni])) ni++;
        if (ni >= endIdx) break;
        const name = lines[ni];
        if (!name || name.length < 2) { i++; continue; }
        let pi = ni + 1;
        while (pi < endIdx && pi < ni+8 && !/^\d+$/.test(lines[pi])) pi++;
        if (pi >= endIdx) break;
        players.push({ rank, name, points: parseInt(lines[pi], 10) });
        i = pi + 1;
      } else { i++; }
    }
    if (players.length > 0) result[divName] = players;
  });
  return result;
}

async function fetchMiLPData() {
  if (miLPCache && Date.now() - miLPCache.at < STANDINGS_TTL) return miLPCache;
  const r = await fetch('https://www.dupr.com/minorleague/leaderboard', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': 'text/html' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`DUPR returned ${r.status}`);
  const divisions = parseMiLPHtml(await r.text());
  if (!Object.keys(divisions).length) throw new Error('Parsed 0 divisions — page structure may have changed');
  miLPCache = { divisions, at: Date.now() };
  return miLPCache;
}

async function getStandings(res) {
  try {
    const data = await fetchMiLPData();
    return res.status(200).json({ milp: data.divisions, fetchedAt: data.at, divisions: MILP_DIVS, cached: true });
  } catch (e) {
    if (miLPCache) return res.status(200).json({ milp: miLPCache.divisions, fetchedAt: miLPCache.at, divisions: MILP_DIVS, cached: true, stale: true });
    return res.status(500).json({ error: e.message });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PPA RANKINGS — scraped from pickleball.com/rankings (Next.js SSR, parseable)
// GET /api/traffic?resource=ppa  →  public Women's Singles rankings (no auth)
// ══════════════════════════════════════════════════════════════════════════════

const PPA_TTL = 60 * 60 * 1000; // 1 hour
let ppaCache = null;

// Static fallback — used when live fetch fails (Vercel Hobby 10s timeout, or site blocked)
const PPA_STATIC_FALLBACK = {
  players: [
    {rank:1, name:'Anna Leigh Waters',    country:'USA', events:8, points:19500},
    {rank:2, name:'Kate Fahey',            country:'USA', events:7, points:16200},
    {rank:3, name:'Kaitlyn Christian',     country:'USA', events:9, points:12900},
    {rank:4, name:'Brooke Buckner',        country:'USA', events:8, points:10900},
    {rank:5, name:'Lea Jansen',            country:'USA', events:7, points:8450},
    {rank:6, name:'Catherine Parenteau',   country:'CAN', events:6, points:6800},
    {rank:7, name:'Chao Yi Wang',          country:'TPE', events:5, points:6000},
    {rank:8, name:'Judit Castillo',        country:'ESP', events:6, points:4550},
    {rank:9, name:'Liz Truluck',           country:'USA', events:5, points:3925},
    {rank:10,name:'Parris Todd',           country:'USA', events:7, points:3900},
  ],
  staticDate: 'June 2026',
};

function parsePPARankingsHtml(html) {
  // Strategy 1: extract from Next.js __NEXT_DATA__ JSON blob
  const ndMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (ndMatch) {
    try {
      const nd = JSON.parse(ndMatch[1]);
      const pp = nd?.props?.pageProps;
      for (const key of ['rankings','players','data']) {
        const list = pp?.[key] ?? pp?.data?.[key];
        if (Array.isArray(list) && list.length > 0 && (list[0].rank !== undefined || list[0].points !== undefined)) {
          const mapped = list.slice(0, 10).map((r, i) => ({
            rank: r.rank ?? r.position ?? (i + 1),
            name: r.name ?? r.playerName ?? r.fullName ?? r.displayName ?? '',
            country: r.country ?? r.countryCode ?? r.nationality ?? '',
            events: r.eventsPlayed ?? r.events ?? r.tournamentsPlayed ?? 0,
            points: r.points ?? r.totalPoints ?? r.rankingPoints ?? 0,
          })).filter(r => r.name && r.points > 0);
          if (mapped.length > 0) return mapped;
        }
      }
    } catch (_) {}
  }

  // Strategy 2: parse rendered HTML — extract img alts, then scan for row patterns
  const processed = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]+alt="([^"]*)"[^>]*\/?>/gi, '\nALT:$1\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

  const lines = processed.split('\n').map(l => l.trim()).filter(Boolean);
  const players = [];
  const seen = new Set();
  let i = 0;

  while (i < lines.length && players.length < 10) {
    if (!/^\d{1,2}$/.test(lines[i])) { i++; continue; }
    const rank = +lines[i];
    if (rank < 1 || rank > 10 || seen.has(rank)) { i++; continue; }

    let name = null, country = null;
    const nums = [];

    for (let j = i + 1; j < Math.min(i + 22, lines.length); j++) {
      const l = lines[j];
      // Player full name from img alt "Player Image {Name}"
      if (!name && l.startsWith('ALT:Player Image ')) {
        name = l.slice('ALT:Player Image '.length).trim();
      }
      // Country code: exactly 2-3 uppercase letters (skip "flag" suffix lines from alts)
      if (!country && /^[A-Z]{2,3}$/.test(l)) country = l;
      // Numeric data: age (opt), events played, points
      if (/^\d+(\.\d+)?$/.test(l) && +l > 0) {
        nums.push(+l);
        if (nums.length === 3) break;
      }
      // Stop when we reach the next rank
      if (/^\d{1,2}$/.test(l) && +l > rank && +l <= 10) break;
    }

    if (name && nums.length >= 2) {
      seen.add(rank);
      players.push({
        rank,
        name,
        country: country || '',
        // If 3 nums: [age, events, points]; if 2: [events, points]
        events: nums.length >= 3 ? nums[1] : nums[0],
        points: nums.length >= 3 ? nums[2] : nums[1],
      });
    }
    i++;
  }
  return players;
}

async function fetchPPAData() {
  if (ppaCache && Date.now() - ppaCache.at < PPA_TTL) return ppaCache;
  const r = await fetch('https://pickleball.com/rankings', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(7000), // Vercel Hobby has 10s function timeout; keep well under it
  });
  if (!r.ok) throw new Error(`pickleball.com returned ${r.status}`);
  const players = parsePPARankingsHtml(await r.text());
  if (!players.length) throw new Error('Parsed 0 PPA players — page structure may have changed');
  ppaCache = { players, at: Date.now() };
  return ppaCache;
}

// All-category static fallback — used when Supabase is empty/unavailable
const PPA_ALL_STATIC = {
  womensSingles: PPA_STATIC_FALLBACK.players,
  mensSingles: [
    {rank:1, name:'Ben Johns',           country:'USA', events:8,  points:22000},
    {rank:2, name:'JW Johnson',          country:'USA', events:9,  points:17200},
    {rank:3, name:'Federico Staksrud',   country:'ARG', events:8,  points:13500},
    {rank:4, name:'Jay DeVilliers',      country:'USA', events:7,  points:11000},
    {rank:5, name:'Tyson McGuffin',      country:'USA', events:8,  points:8600},
    {rank:6, name:'Dylan Frazier',       country:'USA', events:9,  points:7100},
    {rank:7, name:'James Ignatowich',    country:'USA', events:8,  points:6000},
    {rank:8, name:'Collin Johns',        country:'USA', events:7,  points:4900},
    {rank:9, name:'Hunter Johnson',      country:'USA', events:6,  points:3950},
    {rank:10,name:'AJ Koller',           country:'USA', events:7,  points:3500},
  ],
  womensDoubles: [
    {rank:1, name:'Anna Leigh Waters',   country:'USA', events:8,  points:18200},
    {rank:2, name:'Anna Bright',         country:'USA', events:7,  points:15400},
    {rank:3, name:'Catherine Parenteau', country:'CAN', events:6,  points:11800},
    {rank:4, name:'Lea Jansen',          country:'USA', events:7,  points:9500},
    {rank:5, name:'Callie Smith',        country:'USA', events:8,  points:7700},
    {rank:6, name:'Kaitlyn Christian',   country:'USA', events:9,  points:6400},
    {rank:7, name:'Lauren Stratman',     country:'USA', events:6,  points:5100},
    {rank:8, name:'Jessie Irvine',       country:'USA', events:7,  points:4100},
    {rank:9, name:'Parris Todd',         country:'USA', events:5,  points:3550},
    {rank:10,name:'Brooke Buckner',      country:'USA', events:8,  points:3200},
  ],
  mensDoubles: [
    {rank:1, name:'Ben Johns',           country:'USA', events:8,  points:21000},
    {rank:2, name:'JW Johnson',          country:'USA', events:9,  points:16500},
    {rank:3, name:'Dylan Frazier',       country:'USA', events:9,  points:13100},
    {rank:4, name:'Collin Johns',        country:'USA', events:7,  points:10500},
    {rank:5, name:'Jay DeVilliers',      country:'USA', events:7,  points:8500},
    {rank:6, name:'Federico Staksrud',   country:'ARG', events:8,  points:6800},
    {rank:7, name:'James Ignatowich',    country:'USA', events:8,  points:5500},
    {rank:8, name:'Matt Wright',         country:'USA', events:6,  points:4200},
    {rank:9, name:'Riley Newman',        country:'USA', events:7,  points:3700},
    {rank:10,name:'AJ Koller',           country:'USA', events:7,  points:3100},
  ],
  mixedDoubles: [
    {rank:1, name:'Ben Johns',            country:'USA', events:8,  points:20100},
    {rank:2, name:'Anna Leigh Waters',    country:'USA', events:8,  points:17500},
    {rank:3, name:'JW Johnson',           country:'USA', events:9,  points:14100},
    {rank:4, name:'Jessie Irvine',        country:'USA', events:7,  points:11000},
    {rank:5, name:'Jay DeVilliers',       country:'USA', events:7,  points:8800},
    {rank:6, name:'Lea Jansen',           country:'USA', events:7,  points:7200},
    {rank:7, name:'Dylan Frazier',        country:'USA', events:9,  points:5800},
    {rank:8, name:'Anna Bright',          country:'USA', events:7,  points:4500},
    {rank:9, name:'Riley Newman',         country:'USA', events:6,  points:3800},
    {rank:10,name:'Catherine Parenteau',  country:'CAN', events:6,  points:3200},
  ],
};

const PPA_CAT_KEYS = ['mensDoubles','womensDoubles','mixedDoubles','mensSingles','womensSingles'];

async function getPPARankings(res) {
  // Try Supabase first — populated daily by the GitHub Actions scraper
  try {
    const { data: sbData, error: sbError } = await supabase
      .from('ppa_rankings')
      .select('category,rank,name,country,events,points,updated_at')
      .order('rank', { ascending: true });

    if (!sbError && sbData && sbData.length > 0) {
      // Group rows by category
      const grouped = {};
      for (const row of sbData) {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push({
          rank: row.rank, name: row.name,
          country: row.country || '', events: row.events || 0, points: row.points || 0,
        });
      }
      // Fill any missing categories from static fallback
      const ppa = {};
      for (const k of PPA_CAT_KEYS) {
        ppa[k] = grouped[k]?.length ? grouped[k] : PPA_ALL_STATIC[k];
      }
      const updatedAt = sbData.reduce((a, r) => (r.updated_at > a ? r.updated_at : a), '');
      return res.status(200).json({ ppa, fromSupabase: true, updatedAt, live: true });
    }
  } catch (_) { /* fall through to static */ }

  // Static fallback — all 5 categories
  const ppa = {};
  for (const k of PPA_CAT_KEYS) ppa[k] = PPA_ALL_STATIC[k];
  return res.status(200).json({
    ppa,
    staticDate: PPA_STATIC_FALLBACK.staticDate,
    live: false,
    staticFallback: true,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MLP PREMIER TEAM STANDINGS — via majorleaguepickleball.co WP REST API
// GET /api/traffic?resource=mlp  →  public Premier team leaderboard (no auth)
// ══════════════════════════════════════════════════════════════════════════════

const MLP_TTL = 60 * 60 * 1000; // 1 hour
let mlpCache = null;

// 2026 season UUID (from pickleballteamleagues.com standings URL)
const MLP_SEASON_UUID = 'c90dcfd5-6209-49db-842d-48a6e1827bf9';

// Static fallback — standings through Grand Rapids Mid-Season Tournament (Jul 12, 2026).
// Top 5 per official standings reports; 6-20 ordered by record (approx.)
const MLP_STATIC_FALLBACK = {
  teams: [
    {rank:1, team:'St. Louis Shock',          wins:24, losses:2},
    {rank:2, team:'New Jersey 5s',            wins:22, losses:4},
    {rank:3, team:'LA Mad Drops',             wins:18, losses:4},
    {rank:4, team:'Columbus Sliders',         wins:20, losses:7},
    {rank:5, team:'Brooklyn Pickleball Team', wins:15, losses:5},
    {rank:6, team:'Texas Ranchers',           wins:16, losses:12},
    {rank:7, team:'Palm Beach Royals',        wins:14, losses:12},
    {rank:8, team:'Dallas Flash',             wins:11, losses:10},
    {rank:9, team:'SoCal Hard Eights',        wins:10, losses:10},
    {rank:10,team:'Utah Black Diamonds',      wins:9,  losses:13},
    {rank:11,team:'Orlando Squeeze',          wins:9,  losses:9},
    {rank:12,team:'Atlanta Bouncers',         wins:9,  losses:13},
    {rank:13,team:'Las Vegas Night Owls',     wins:7,  losses:12},
    {rank:14,team:'Chicago Slice',            wins:7,  losses:12},
    {rank:15,team:'Florida Smash',            wins:8,  losses:17},
    {rank:16,team:'Miami Pickleball Club',    wins:6,  losses:13},
    {rank:17,team:'California Black Bears',   wins:3,  losses:7},
    {rank:18,team:'Phoenix Flames',           wins:3,  losses:10},
    {rank:19,team:'Bay Area Breakers',        wins:4,  losses:18},
    {rank:20,team:'Carolina Hogs',            wins:2,  losses:18},
  ],
  staticDate: 'Jul 12, 2026 · through Grand Rapids',
};

// Find the best candidate array of team-standing objects anywhere in the JSON
// (plugin response shape is not documented, so match flexibly on field names)
function normalizeMLPTeams(data) {
  const NAME_KEYS = ['team_name','teamName','name','team','title','display_name'];
  const WIN_KEYS  = ['wins','win','w','match_wins','matches_won','matchWins'];
  const LOSS_KEYS = ['losses','loss','l','match_losses','matches_lost','matchLosses'];
  const PTS_KEYS  = ['points','pts','standings_points','standingsPoints','event_points','total_points'];
  const RANK_KEYS = ['rank','position','place','standing'];

  let best = null;
  const visit = (node) => {
    if (Array.isArray(node)) {
      if (node.length >= 4 && node.every(o => o && typeof o === 'object' && !Array.isArray(o))) {
        const s = node[0];
        const nameKey = NAME_KEYS.find(k => typeof s[k] === 'string' && s[k].length > 1);
        const winKey  = WIN_KEYS.find(k => s[k] !== undefined);
        if (nameKey && winKey && (!best || node.length > best.node.length)) {
          best = { node, nameKey, winKey };
        }
      }
      node.forEach(visit);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(visit);
    }
  };
  visit(data);
  if (!best) return null;

  const s = best.node[0];
  const lossKey = LOSS_KEYS.find(k => s[k] !== undefined);
  const ptsKey  = PTS_KEYS.find(k => s[k] !== undefined);
  const rankKey = RANK_KEYS.find(k => s[k] !== undefined);

  const teams = best.node.map((t, i) => ({
    rank:   rankKey ? parseInt(t[rankKey], 10) || (i + 1) : (i + 1),
    team:   String(t[best.nameKey]).trim(),
    wins:   parseInt(t[best.winKey], 10) || 0,
    losses: lossKey ? (parseInt(t[lossKey], 10) || 0) : 0,
    points: ptsKey ? (parseFloat(t[ptsKey]) || 0) : null,
  })).filter(t => t.team);

  if (teams.length < 4) return null;
  // If no explicit rank, sort by points (when present) then win pct
  if (!rankKey) {
    teams.sort((a, b) => (b.points ?? -1) - (a.points ?? -1)
      || (b.wins / Math.max(1, b.wins + b.losses)) - (a.wins / Math.max(1, a.wins + a.losses)));
    teams.forEach((t, i) => { t.rank = i + 1; });
  } else {
    teams.sort((a, b) => a.rank - b.rank);
  }
  return teams.slice(0, 20);
}

async function fetchMLPData() {
  if (mlpCache && Date.now() - mlpCache.at < MLP_TTL) return mlpCache;
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://majorleaguepickleball.co/standings/',
  };
  const BASE = 'https://majorleaguepickleball.co/wp-json/fau-scores-and-stats/v1/standings';
  // Try with the known season UUID first, then let the server resolve the season
  const urls = [
    `${BASE}?selectedDivision=premier&selectedStandings=team&season_uuid=${MLP_SEASON_UUID}`,
    `${BASE}?selectedDivision=premier&selectedStandings=team`,
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(7000) });
      if (!r.ok) continue;
      const text = await r.text();
      if (!text) continue;
      const teams = normalizeMLPTeams(JSON.parse(text));
      if (teams && teams.length) {
        mlpCache = { teams, at: Date.now() };
        return mlpCache;
      }
    } catch (_) { /* try next */ }
  }
  throw new Error('No parseable MLP standings from majorleaguepickleball.co');
}

async function getMLPStandings(res) {
  // Try Supabase first — populated daily by the GitHub Actions scraper
  try {
    const { data: sbData, error: sbError } = await supabase
      .from('mlp_standings')
      .select('rank,team,wins,losses,win_pct,updated_at')
      .order('rank', { ascending: true })
      .limit(20);
    if (!sbError && sbData && sbData.length >= 4) {
      const teams = sbData.map(t => ({
        rank: t.rank, team: t.team, wins: t.wins, losses: t.losses,
        win_pct: t.win_pct ?? null,
      }));
      const updatedAt = sbData[0]?.updated_at || null;
      return res.status(200).json({ mlp: { teams }, fromSupabase: true, updatedAt, live: true });
    }
  } catch (_) { /* fall through */ }

  // Try live MLP API
  try {
    const data = await fetchMLPData();
    return res.status(200).json({ mlp: { teams: data.teams }, fetchedAt: data.at, live: true });
  } catch (e) {
    if (mlpCache) return res.status(200).json({ mlp: { teams: mlpCache.teams }, fetchedAt: mlpCache.at, live: false, stale: true });
    return res.status(200).json({
      mlp: { teams: MLP_STATIC_FALLBACK.teams },
      staticDate: MLP_STATIC_FALLBACK.staticDate,
      live: false,
      staticFallback: true,
    });
  }
}

// ── Admin auth ────────────────────────────────────────────────────────────────
function verifyAdminToken(token) {
  try {
    if (!token) return null;
    const { email, ts, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    const expected = createHmac('sha256', secret).update(`${email}:${ts}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    return email;
  } catch { return null; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDeviceType(ua = '') {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

function startOf(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ── POST: track a page visit OR a click event ─────────────────────────────────
async function trackVisit(req, res) {
  const { page, referrer, sessionId, type, eventName, eventData } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const ua = req.headers['user-agent'] || '';
  const row = {
    session_id: sessionId,
    page: page || '/',
    referrer: referrer || null,
    device_type: getDeviceType(ua),
    country: req.headers['x-vercel-ip-country'] || null,
  };

  // Click events: store event_name + optional event_data
  if (type === 'event' && eventName) {
    row.event_name = eventName;
    if (eventData) row.event_data = eventData;
  }

  const { error } = await supabase.from('page_views').insert(row);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

// ── GET: return traffic + events summary ──────────────────────────────────────
async function getTraffic(req, res) {
  const { data, error } = await supabase
    .from('page_views')
    .select('page, referrer, session_id, device_type, country, created_at, event_name, event_data')
    .gte('created_at', startOf(90))
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = data || [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = startOf(7), monthAgo = startOf(30);
  const inRange = (row, from) => row.created_at >= from;
  const uniqueSessions = subset => new Set(subset.map(r => r.session_id)).size;

  // Separate page views from events
  const pageViewRows = rows.filter(r => !r.event_name);
  const eventRows    = rows.filter(r => !!r.event_name);

  const todayRows = pageViewRows.filter(r => r.created_at.slice(0, 10) === todayStr);
  const weekRows  = pageViewRows.filter(r => inRange(r, weekAgo));
  const monthRows = pageViewRows.filter(r => inRange(r, monthAgo));

  // Daily page view counts (last 30 days)
  const dailyCounts = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  monthRows.forEach(r => { const day = r.created_at.slice(0, 10); if (day in dailyCounts) dailyCounts[day]++; });

  // Top pages
  const pageCounts = {};
  monthRows.forEach(r => { pageCounts[r.page] = (pageCounts[r.page] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([page,views])=>({page,views}));

  // Devices
  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  monthRows.forEach(r => { if (r.device_type in deviceCounts) deviceCounts[r.device_type]++; });

  // Countries
  const countryCounts = {};
  monthRows.forEach(r => { if (r.country) countryCounts[r.country] = (countryCounts[r.country] || 0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([country,views])=>({country,views}));

  // Referrers
  const refCounts = {};
  pageViewRows.filter(r => r.referrer && inRange(r, monthAgo)).forEach(r => {
    try { const host = new URL(r.referrer).hostname.replace(/^www\./, ''); refCounts[host] = (refCounts[host] || 0) + 1; } catch {}
  });
  const topReferrers = Object.entries(refCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([referrer,views])=>({referrer,views}));

  // ── Events: top click events in last 30 days ──────────────────────────────
  const monthEventRows = eventRows.filter(r => inRange(r, monthAgo));
  const eventCounts = {};
  monthEventRows.forEach(r => {
    eventCounts[r.event_name] = (eventCounts[r.event_name] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .sort((a,b)=>b[1]-a[1])
    .map(([event, count]) => ({ event, count }));

  // Daily event counts (last 30 days, all events combined)
  const dailyEventCounts = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyEventCounts[d.toISOString().slice(0, 10)] = 0;
  }
  monthEventRows.forEach(r => {
    const day = r.created_at.slice(0, 10);
    if (day in dailyEventCounts) dailyEventCounts[day]++;
  });

  return res.status(200).json({
    summary: {
      today:   { views: todayRows.length,  sessions: uniqueSessions(todayRows) },
      week:    { views: weekRows.length,   sessions: uniqueSessions(weekRows) },
      month:   { views: monthRows.length,  sessions: uniqueSessions(monthRows) },
      allTime: { views: pageViewRows.length, sessions: uniqueSessions(pageViewRows) },
    },
    daily: Object.entries(dailyCounts).map(([date, views]) => ({ date, views })),
    topPages, devices: deviceCounts, topCountries, topReferrers,
    // Events
    topEvents,
    totalEvents30d: monthEventRows.length,
    dailyEvents: Object.entries(dailyEventCounts).map(([date, count]) => ({ date, count })),
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST') return trackVisit(req, res);
  if (req.method === 'GET') {
    // Public: MiLP standings (no auth)
    if (req.query.resource === 'standings') return getStandings(res);
    // Public: PPA live rankings via pickleball.com (no auth)
    if (req.query.resource === 'ppa') return getPPARankings(res);
    // Public: MLP Premier team standings (no auth)
    if (req.query.resource === 'mlp') return getMLPStandings(res);
    // Admin only: traffic analytics
    const token = req.headers['x-admin-token'] || '';
    if (!verifyAdminToken(token)) return res.status(401).json({ error: 'Unauthorized' });
    return getTraffic(req, res);
  }
  return res.status(405).end();
}
