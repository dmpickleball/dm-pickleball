/**
 * scrape-standings.mjs
 * Runs daily via GitHub Actions. Opens a real Chromium browser, scrapes
 * pickleball.com/rankings for all 5 PPA categories + MLP standings,
 * and writes results to Supabase.
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── PPA category definitions ──────────────────────────────────────────────────
const PPA_CATS = [
  { id: 'womensSingles', tabText: "Women's Singles" },
  { id: 'mensSingles',   tabText: "Men's Singles"   },
  { id: 'womensDoubles', tabText: "Women's Doubles" },
  { id: 'mensDoubles',   tabText: "Men's Doubles"   },
  { id: 'mixedDoubles',  tabText: 'Mixed Doubles'   },
];

// ── Extract rankings from the current page state ──────────────────────────────
async function extractRankings(page) {
  return page.evaluate(() => {
    // Strategy 1: pull from Next.js hydrated data (fastest, most reliable)
    const nd = window.__NEXT_DATA__;
    if (nd) {
      const pp = nd?.props?.pageProps;
      for (const key of ['rankings', 'players', 'data']) {
        const list = pp?.[key] ?? pp?.data?.[key];
        if (Array.isArray(list) && list.length > 3) {
          const mapped = list.slice(0, 10).map((r, i) => ({
            rank:    r.rank         ?? r.position         ?? (i + 1),
            name:    r.name         ?? r.playerName       ?? r.fullName ?? r.displayName ?? '',
            country: r.country      ?? r.countryCode      ?? r.nationality ?? '',
            events:  r.eventsPlayed ?? r.events           ?? 0,
            points:  r.points       ?? r.totalPoints      ?? r.rankingPoints ?? 0,
          })).filter(r => r.name && r.points > 0);
          if (mapped.length > 0) return { source: 'nextData', players: mapped };
        }
      }
    }

    // Strategy 2: find React fiber state on any element holding ranking arrays
    function getRootFiber(el) {
      return el[Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternals')) || ''];
    }
    function searchFiber(fiber, depth = 0) {
      if (!fiber || depth > 30) return null;
      const state = fiber.memoizedState;
      if (state?.queue?.dispatch) {
        // hook state — look for arrays of player objects
        let s = state;
        while (s) {
          const val = s.memoizedState;
          if (Array.isArray(val) && val.length > 3 && val[0]?.name && val[0]?.points) {
            return val.slice(0, 10).map((r, i) => ({
              rank: r.rank ?? (i + 1), name: r.name, country: r.country ?? '', events: r.events ?? 0, points: r.points ?? 0,
            }));
          }
          s = s.next;
        }
      }
      return searchFiber(fiber.child, depth + 1) || searchFiber(fiber.sibling, depth + 1);
    }
    const rootEl = document.querySelector('#__next') || document.body;
    if (rootEl) {
      const fiber = getRootFiber(rootEl);
      if (fiber) {
        const found = searchFiber(fiber);
        if (found) return { source: 'fiber', players: found };
      }
    }

    // Strategy 3: DOM table scraping — look for standard <tr> ranking rows
    const rows = [];
    const trEls = document.querySelectorAll('tr');
    for (const tr of trEls) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length < 3) continue;
      const rankNum = parseInt(cells[0].textContent.trim(), 10);
      if (isNaN(rankNum) || rankNum < 1 || rankNum > 10) continue;
      const name = cells[1].textContent.trim();
      if (!name || name.length < 3) continue;
      // Points: last numeric-looking cell
      let points = 0, events = 0;
      for (let ci = cells.length - 1; ci >= 2; ci--) {
        const val = parseInt(cells[ci].textContent.replace(/,/g, '').trim(), 10);
        if (!isNaN(val) && val > 0) {
          if (points === 0) points = val;
          else if (events === 0) { events = points; points = val; break; }
        }
      }
      // Country: look for 2-3 uppercase letters
      let country = '';
      for (const cell of cells) {
        const t = cell.textContent.trim();
        if (/^[A-Z]{2,3}$/.test(t)) { country = t; break; }
      }
      rows.push({ rank: rankNum, name, country, events, points });
    }
    if (rows.length > 2) return { source: 'dom', players: rows };

    return { source: 'none', players: [] };
  });
}

// ── Scrape all 5 PPA categories ───────────────────────────────────────────────
async function scrapePPA(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
  });

  const results = {};

  try {
    console.log('  → Loading pickleball.com/rankings...');
    await page.goto('https://pickleball.com/rankings', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    for (const cat of PPA_CATS) {
      try {
        // Click the category tab (if not the first/default)
        if (cat.id !== 'womensSingles') {
          // Try button, link, or any element containing the tab text
          const tab = page.locator(`button:has-text("${cat.tabText}"), a:has-text("${cat.tabText}"), [role="tab"]:has-text("${cat.tabText}")`).first();
          const exists = await tab.count();
          if (exists) {
            await tab.click();
            await page.waitForTimeout(1800);
          } else {
            console.log(`    Tab not found: ${cat.tabText}`);
          }
        }

        const { source, players } = await extractRankings(page);
        if (players.length > 0) {
          results[cat.id] = players;
          console.log(`    ✓ ${cat.tabText}: ${players.length} players (via ${source})`);
        } else {
          console.log(`    ✗ ${cat.tabText}: no data found`);
        }
      } catch (e) {
        console.log(`    ✗ ${cat.tabText}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('  PPA page error:', e.message);
  }

  await page.close();
  return results;
}

// ── Scrape MLP team standings ─────────────────────────────────────────────────
async function scrapeMLPStandings(browser) {
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const teams = [];

  try {
    console.log('  → Loading majorleaguepickleball.co/standings...');
    await page.goto('https://majorleaguepickleball.co/standings/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const rows = [];

      // Try standard table rows
      const trEls = document.querySelectorAll('tr');
      for (const tr of trEls) {
        const cells = Array.from(tr.querySelectorAll('td'));
        if (cells.length < 3) continue;
        const texts = cells.map(c => c.textContent.trim());
        const rank = parseInt(texts[0], 10);
        if (isNaN(rank) || rank < 1 || rank > 24) continue;
        const team = texts[1];
        if (!team || team.length < 3) continue;
        const wins   = parseInt(texts[2], 10) || 0;
        const losses = parseInt(texts[3], 10) || 0;
        rows.push({ rank, team, wins, losses, win_pct: wins + losses > 0 ? wins / (wins + losses) : 0 });
      }
      if (rows.length > 3) return rows;

      // Try div-based layouts common in WordPress/Bricks builders
      const divRows = document.querySelectorAll('[class*="standing-row"], [class*="team-row"], [class*="standings"] li');
      let r = 1;
      for (const el of divRows) {
        const text = el.textContent.trim();
        const nums = text.match(/\d+/g);
        if (!nums || nums.length < 2) continue;
        // Heuristic: look for a team name (long text) + W-L numbers
        const nameMatch = el.querySelector('[class*="name"], [class*="team-name"], strong, b');
        const team = nameMatch?.textContent?.trim() || text.replace(/\d+/g, '').trim().slice(0, 40);
        if (!team || team.length < 3) continue;
        const wins = parseInt(nums[0], 10);
        const losses = parseInt(nums[1], 10);
        rows.push({ rank: r++, team, wins, losses, win_pct: wins + losses > 0 ? wins / (wins + losses) : 0 });
        if (r > 24) break;
      }
      return rows;
    });

    teams.push(...data);
    if (teams.length > 0) console.log(`    ✓ MLP standings: ${teams.length} teams`);
    else console.log('    ✗ MLP standings: no data found');
  } catch (e) {
    console.error('  MLP page error:', e.message);
  }

  await page.close();
  return teams;
}

// ── Write PPA data to Supabase ────────────────────────────────────────────────
async function savePPARankings(category, players) {
  if (!players.length) return;
  const rows = players.map(p => ({
    category,
    rank:       p.rank,
    name:       p.name,
    country:    p.country || '',
    events:     p.events  || 0,
    points:     p.points  || 0,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('ppa_rankings')
    .upsert(rows, { onConflict: 'category,rank' });
  if (error) console.error(`  DB error (${category}):`, error.message);
  else console.log(`  ✓ Saved ${category} to Supabase`);
}

// ── Write MLP data to Supabase ────────────────────────────────────────────────
async function saveMLPStandings(teams) {
  if (!teams.length) return;
  const rows = teams.map(t => ({ ...t, updated_at: new Date().toISOString() }));
  const { error } = await supabase
    .from('mlp_standings')
    .upsert(rows, { onConflict: 'rank' });
  if (error) console.error('  DB error (MLP):', error.message);
  else console.log('  ✓ Saved MLP standings to Supabase');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏓 DM Pickleball standings update — ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // PPA rankings (all 5 categories)
    console.log('PPA Rankings:');
    const ppaData = await scrapePPA(browser);
    for (const [cat, players] of Object.entries(ppaData)) {
      await savePPARankings(cat, players);
    }

    // MLP standings
    console.log('\nMLP Standings:');
    const mlpData = await scrapeMLPStandings(browser);
    await saveMLPStandings(mlpData);

  } finally {
    await browser.close();
  }

  const total = Object.keys(await (async () => {
    const { data } = await supabase.from('ppa_rankings').select('category').limit(100);
    return Object.fromEntries((data || []).map(r => [r.category, 1]));
  })()).length;

  console.log(`\n✅ Done. ${total} PPA categories live in Supabase.\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
