# Cowork Handoff — Al's World Cup 2026 Pool

## What This Is
I'm building and maintaining a World Cup 2026 pool website at dmpickleball.com/worldcup ("Al's World Cup 2026 Pool"). The file is `/Users/dmok/Downloads/dm-pickleball/public/worldcup.html` — a fully self-contained static HTML page (all CSS and JS inline, no external files). The project uses Vite + React but this one file is pure HTML/CSS/JS. Deployment is GitHub → Vercel auto-deploy.

## Deploy Command
Always use this from the user's terminal (NOT from the sandbox — git push fails from sandbox due to lock file permissions):
```
cd ~/Downloads/dm-pickleball && rm -f .git/HEAD.lock .git/index.lock && git add public/worldcup.html && git commit -m "message" && git push
```
The sandbox CAN run `git add` and `git commit` but NOT `git push`. Always tell the user to run the push themselves.

## Pool Details
- 17 players: `["JV","Alex","Chapul","Junior","Mike","Steve","Pablo","Kimmy","Edgar","Cesar","Diego","Eric","P.Sosa","Pollo","David","Jerry","Ivan"]`
- 72 matches, 12 groups (A–L), 3 matchdays
- Scoring: Win correct = 1pt, Tie correct = 2pts
- Dense ranking (1-2-2-3, no gaps)
- Payouts: 🥇 $275, 🥈 $100, 🥉 $50
- `const DAVID_IDX = PLAYERS.indexOf('David')` must stay in code (used by calcTotals for isMe field)

## ESPN API
```
https://site.api.espn.com/apis/site/v2/sports/soccer/FIFA.WORLD/scoreboard?dates=20260611-20260628&limit=100
```
- `comp.status.type.description` → match status string ("First Half", "Second Half", "Halftime", "Extra Time", "Penalty Shootout", "Final", etc.)
- `comp.status.displayClock` → live game clock e.g. "46:00" → shown as "46'"
- `ev.date` → UTC kickoff time, converted to PT
- Team name normalization via ESPN_MAP: `{'United States':'USA','Türkiye':'Turkey','Bosnia-Herzegovina':'Bosnia','Congo DR':'Congo','Curaçao':'Curacao','Korea Republic':'South Korea','Czech Republic':'Czechia'}`

## Key Global Variables
```javascript
let results = {};         // espnId → {winner,done,live,t1,t2,s1,s2,status}
let matchTimes = {};      // espnId → "12:00 PM PT"
let matchTimestamps = {}; // espnId → epoch ms for sorting
let matchClocks = {};     // espnId → "46'" live game clock
let matchView = 'chrono'; // 'group' | 'chrono'
let liveIds = new Set();
let selectedPlayers = new Set();
let autoTimer;
```

## All Features Currently Built

### HEADER / BANNER
- Top status line: `Updated 10:30 PM · 8 played · 64 left · 1 LIVE`
- Scoring note line 1: `Win correct = 1 pt | Tie correct = 2 pts`
- Scoring note line 2: `Payouts: 🥇 $275 🥈 $100 🥉 $50` (white-space:nowrap so it never wraps on mobile)
- Banner Live section (below scoring note, inside header) with 3 cards + ticker:
  1. **👑 Leading card** — current leader name + pts, handles ties with "&"
  2. **⚽ Latest Result card** — most recently completed match score + ✅ X/17 correct
  3. **Today's Games card** — colored progress dots (green=done, red pulsing=live, dark=upcoming) + "X/Y done"
  4. **Score Ticker** — scrolling horizontal strip of all completed results newest-first, duplicated for seamless CSS loop, pauses on hover

### TABS
- 3 tabs: 🏆 Leaderboard | ⚽ Results | 📋 All Picks
- Leaderboard tab has a pulsing red dot (`id="tab-live-dot"`) that appears when any game is live

### LEADERBOARD TAB (STANDINGS)
- Columns: # | Player | Points | [Dynamic "Jerrys"] 
- **# column**: 🥇🥈🥉 for top 3, 💩 for last place (all tied for last get 💩), number for everyone else
- **No special treatment for David** — he looks like everyone else
- **Player column**: name + live indicator next to name:
  - First half live → pulsing grey ● 
  - 2nd half / Halftime / ET / Shootout → ▲ (moving up, green) / ▼ (moving down, red) / ● (same, grey pulsing)
  - No live games → +2 / +1 / ✗ showing pts earned from last completed game batch
- **Points column**: large white bold
- **[Jerrys] column**: header is dynamic — last place player's name + "s" (e.g. "Jerrys"). If someone else takes last, it auto-updates.
  - Large red number on left = wrong picks count
  - Stacked to the right (small): `Wins X` in green / `Ties X` in gold
- NO "Left" column (removed — games remaining shown in header instead)
- NO LIVE badge next to "STANDINGS" title (removed)

### RESULTS TAB
- Toggle: By Group | Chronological (default = chronological)
- Chronological view has gold date pill headers (e.g. "Jun 13")
- Each match row layout: `[date] [teams + MD badge + Grp badge] | [score col fixed 130px] [meta col fixed 290px]`
- Score column always aligned (fixed width so live/final/scheduled all line up)
- Status badge (Final/LIVE/Half) is NEXT TO THE SCORE, not next to team name
- **Final scores**: green box, PT time below score
- **Live scores**: neutral dark blue box, game clock below (e.g. "58'")
- **Scheduled**: dark box with date + PT kickoff time
- **Status badges**: `Final` (green), `Half` (gold), `LIVE` (red pulsing)
- **✅ X/17 correct** shown on completed matches
- **📋 Picks** button → jumps to Picks tab filtered to that match's group
- **🎬 Recap** button → opens ESPN match page `https://www.espn.com/soccer/match/_/gameId/${m.id}` in new tab

### ALL PICKS TAB
- Default order: chronological (sorted by matchTimestamps)
- Multi-select player dropdown filter (selectedPlayers Set)
- **✕ Clear Filters** button resets all filters at once
- Table width: `width:auto` (no min-width — doesn't leave empty space when few players selected)
- Pick cell states:
  - No result → grey (cell-pending)
  - Live, pick matches current score → solid green pulsing (cell-live-on, same color as final correct)
  - Live, pick doesn't match → solid red pulsing (cell-live-off, same color as final wrong)
  - Final correct → solid green (cell-correct)
  - Final wrong → solid red (cell-wrong)
- Team names shortened via shorten() function
- "Tie" shown correctly (old bug showed "Tie 2" — fixed)

## CSS Animations
```css
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}        /* LIVE badge, tab dot */
@keyframes trend-pulse{0%,100%{opacity:1}50%{opacity:.25}} /* leaderboard arrows */
@keyframes cell-pulse{0%,100%{opacity:1}50%{opacity:.45}}  /* live pick cells */
@keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}} /* banner */
```

## Key Functions
- `fetchScores()` — fetches ESPN API, populates all globals, calls renderAll(), sets autoTimer (30s if live, 60s otherwise)
- `calcTotals()` → returns `{name, pts, correct, wins, ties, wrong, pending, isMe}` per player
- `calcLiveTrends()` → rank projection trends, only active during 2nd half/Halftime/ET/Shootout
- `calcLastGamePoints()` → per-player pts from most recently completed match batch (within ~2.5hr window)
- `renderAll()` → renderLeaderboard() + renderBanner() + active tab render
- `renderBanner()` → renderBannerLeader(), renderBannerMotd(), renderBannerProgress(), renderBannerTicker()
- `renderLeaderboard()` — handles 💩, Jerrys column, all 3 live states + post-game indicators
- `renderMatches()` — group or chrono view with date headers
- `matchRowHtml(m)` — builds one match row with fixed-width columns
- `renderPicks()` — filtered picks table with live pulsing cells
- `jumpToPicks(group)` — switches to picks tab filtered by group
- `toPT(utcStr)` — converts UTC to Pacific Time string
- `shorten(name)` — abbreviates team names for picks table cells

## Mobile Responsive
- Tested on iPhone Air and MacBook
- Banner cards: 2-column on mobile (min-width: calc(50% - 4px))
- Ticker font smaller on mobile
- Pool title smaller on mobile
- Payouts line uses white-space:nowrap to stay on one line

## Recent Changes (Last Session — not yet confirmed working, just pushed)
1. Banner with all 5 features: leader spotlight, latest result, today's progress dots, score ticker, enhanced header
2. 💩 emoji for last place instead of wooden spoon
3. Jerrys column: wrong picks as large number, wins/ties stacked
4. Dynamic column header (updates to last place player's name automatically)
5. Payouts on one line on mobile
6. Games played count in header
7. Score alignment fixed with fixed-width match-score-col + match-meta containers
8. Status badge moved next to score (not next to team name)
9. Live score box changed to neutral dark blue (not red)
10. Game clock shown below live score

## Known Issues / Pending
- Git push must be done from user's terminal due to sandbox lock file permissions
- Jerry's Canada v Bosnia pick was disputed by user but never confirmed changed — Jerry's pick is currently "Canada" in the HTML data
- Banner features (all 5) just deployed — user hasn't tested yet, may need tweaks

## What To Do Next / How To Continue
The user will tell you what to change next. Read the file before editing:
`/Users/dmok/Downloads/dm-pickleball/public/worldcup.html`
Always use Edit tool (not Write) for changes. Commit from sandbox, tell user to push from terminal.
