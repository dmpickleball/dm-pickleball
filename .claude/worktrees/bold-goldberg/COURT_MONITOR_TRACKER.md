# 🎾 Court Monitor System — Project Tracker
**Project:** Solar-Powered Court Monitoring System
**Site:** dmpickleball.com
**Last Updated:** 2026-04-02
**Status:** 🟡 Phase 1 — Hardware Setup (In Progress)

---

## How to Use This File

- **David's tasks** are marked 🙋 — these require physical action or purchasing
- **Claude's tasks** are marked 🤖 — code/backend work I handle
- Update status by changing the emoji: ⬜ Not Started → 🔄 In Progress → ✅ Done → ❌ Blocked
- At the start of each session, tell me what you've checked off and I'll update this file and pick up where we left off

---

## 📦 Phase 1 — Hardware Setup

**Goal:** Get the Android device connected and verified on the Helium network.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1.1 | Purchase Android phone (Motorola Moto G 5G 2024, model XT2417D, ~$50–$80 used) | 🙋 David | ⬜ Not Started | Must be **unlocked**. Check eBay, Swappa, Facebook Marketplace. Verify IMEI is clean. |
| 1.2 | Confirm phone is unlocked | 🙋 David | ⬜ Not Started | Insert a non-original SIM to test, or use an IMEI checker |
| 1.3 | Download Helium Mobile app on the target Android device | 🙋 David | ⬜ Not Started | App required for activation |
| 1.4 | Create Helium Mobile account + sign up for Zero Plan (free, ~3GB/mo) | 🙋 David | ⬜ Not Started | Do this through the app on the target device |
| 1.5 | Choose eSIM (instant) or physical SIM (shipped) — **eSIM recommended** | 🙋 David | ⬜ Not Started | eSIM is faster; physical SIM takes a few days shipping |
| 1.6 | Activate Helium line through app | 🙋 David | ⬜ Not Started | Complete activation flow in app |
| 1.7 | Confirm cellular data is working (browse a website, not on WiFi) | 🙋 David | ⬜ Not Started | Turn off WiFi, load a page — confirms LTE is live |
| 1.8 | Purchase solar panel (~5W+, USB-A or USB-C output) | 🙋 David | ⬜ Not Started | Options: Voltaic, Anker, or Amazon — confirm correct USB connector for phone |
| 1.9 | Test solar panel charging the phone (leave in direct sun 30 min) | 🙋 David | ⬜ Not Started | Confirm it actually charges — some cheap panels underperform |
| 1.10 | Purchase weatherproof phone mount/enclosure for fence mounting | 🙋 David | ⬜ Not Started | Needs to: protect from rain, allow camera view, stay secure on fence |

**Phase 1 Blockers / Open Questions:**
- [ ] What connector does the Moto G 5G 2024 use? (USB-C — verify before buying solar cable)
- [ ] What fence/post will the device mount on? Height and angle TBD for camera coverage

---

## 📱 Phase 2 — App Prototype

**Goal:** Build a simple Android app that captures an image and sends it to an API endpoint.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 2.1 | Decide: on-device AI vs. backend image analysis | 🙋 David | ⬜ Not Started | On-device = more private, less data. Backend = easier to update. Recommendation: **backend** |
| 2.2 | Set up backend project (Node.js + Express or Supabase Edge Function) | 🤖 Claude | ⬜ Not Started | Will create API endpoint to receive images + occupancy data |
| 2.3 | Create Supabase table: `court_status` (timestamp, occupied bool, image_url, confidence) | 🤖 Claude | ⬜ Not Started | SQL migration ready to run |
| 2.4 | Build Android app skeleton (React Native or Kotlin — TBD) | 🤖 Claude | ⬜ Not Started | Needs decision on framework — see open questions |
| 2.5 | Implement camera capture in app | 🤖 Claude | ⬜ Not Started | Periodic capture, wide-angle, background mode |
| 2.6 | Implement API call: POST image + timestamp to backend | 🤖 Claude | ⬜ Not Started | Include compression before upload |
| 2.7 | Install app on device and capture first test image | 🙋 David | ⬜ Not Started | Requires the phone from Phase 1 |
| 2.8 | Confirm backend receives image (check Supabase table) | 🙋 David | ⬜ Not Started | We'll check together — I'll show you where to look |

**Phase 2 Open Questions:**
- [ ] Android app framework: **React Native** (faster, JS) vs **Kotlin** (native, more control)?
  → Recommendation: React Native (easier to iterate, David can read the JS)
- [ ] Where does the API endpoint live? New Vercel function vs. Supabase Edge Function?
  → Note: Vercel Hobby plan has max 12 functions — currently at ~11. **Supabase Edge Function recommended.**

---

## 🤖 Phase 3 — Automation + Occupancy Logic

**Goal:** App runs automatically, detects occupancy, sends minimal data.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 3.1 | Add periodic capture timer to app (every 60–120 seconds) | 🤖 Claude | ⬜ Not Started | Wakes camera, captures, sends, goes back to sleep |
| 3.2 | Build occupancy detection logic | 🤖 Claude | ⬜ Not Started | Start with simple pixel-diff or brightness heuristic; upgrade to ML if needed |
| 3.3 | Implement event-based send (only POST when status CHANGES) | 🤖 Claude | ⬜ Not Started | Reduces data usage dramatically |
| 3.4 | Add keepalive ping (1x/day minimum to prevent Helium plan termination) | 🤖 Claude | ⬜ Not Started | Tiny heartbeat request — critical for plan continuity |
| 3.5 | Test occupancy detection accuracy (day/night, shadows, different weather) | 🙋 David | ⬜ Not Started | Walk on/off court while watching dashboard — confirm detection works |
| 3.6 | Optimize image compression (target <50KB per image) | 🤖 Claude | ⬜ Not Started | Keep well under 3GB/month plan |
| 3.7 | Set up Android device in persistent/kiosk mode (screen off, app always running) | 🙋 David | ⬜ Not Started | Android developer options + app settings — I'll write step-by-step instructions |

**Phase 3 Open Questions:**
- [ ] What hours should monitoring be active? (e.g., 7am–9pm only to save power)
- [ ] Night vision / low-light: does the court have lights? Affects detection approach.
- [ ] Alert needed? (e.g., push notification if court is full for >2 hours?)

---

## 📊 Phase 4 — Admin Dashboard Tab

**Goal:** New "Court Monitoring" tab in the dmpickleball.com admin panel.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 4.1 | Design dashboard layout (mockup/wireframe) | 🤖 Claude | ⬜ Not Started | Matches existing admin panel style (Inter font, brand green #1a3c34) |
| 4.2 | Build `CourtMonitorTab` component in App.jsx | 🤖 Claude | ⬜ Not Started | Added to AdminPanel tab list |
| 4.3 | Add new Vercel API endpoint OR Supabase query for dashboard data | 🤖 Claude | ⬜ Not Started | Must respect 12-function Vercel limit |
| 4.4 | Display: real-time court status (OCCUPIED / EMPTY) with color indicator | 🤖 Claude | ⬜ Not Started | Big green/red badge, last-updated timestamp |
| 4.5 | Display: historical usage chart (e.g., occupancy by hour over last 7 days) | 🤖 Claude | ⬜ Not Started | Simple bar chart — no extra libraries needed |
| 4.6 | Display: latest snapshot image (optional, low-frequency) | 🤖 Claude | ⬜ Not Started | Small thumbnail, refreshes periodically |
| 4.7 | Auto-refresh dashboard every 60 seconds | 🤖 Claude | ⬜ Not Started | useEffect polling, not websocket (simpler) |
| 4.8 | Deploy to production + verify on live site | 🙋 David | ⬜ Not Started | Git push from terminal → Vercel auto-deploys |

---

## 🔧 Phase 5 — Physical Deployment

**Goal:** Mount device, connect solar, verify autonomous operation.

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 5.1 | Scout mounting location at the court | 🙋 David | ⬜ Not Started | Identify: fence post, height, angle, sun exposure |
| 5.2 | Confirm camera angle captures full court (test before permanent mount) | 🙋 David | ⬜ Not Started | Hold phone at planned spot, take test photo, verify coverage |
| 5.3 | Install weatherproof enclosure on fence | 🙋 David | ⬜ Not Started | Use enclosure from Phase 1 (task 1.10) |
| 5.4 | Mount phone in enclosure, angle camera | 🙋 David | ⬜ Not Started | Secure phone, confirm it won't move |
| 5.5 | Connect solar panel, verify charging | 🙋 David | ⬜ Not Started | Check phone battery is climbing or holding in direct sun |
| 5.6 | Confirm cellular connectivity at mounted location | 🙋 David | ⬜ Not Started | LTE signal can vary — check bars at that spot |
| 5.7 | Start app, verify first live data appears in dashboard | 🙋 David | ⬜ Not Started | The moment of truth 🎉 |
| 5.8 | Monitor for 48 hours (check dashboard, verify data keeps coming in) | 🙋 David | ⬜ Not Started | Look for: gaps in data, battery drain, false positives |

---

## 🔓 Open Decisions (Need David's Input)

| Decision | Options | Recommendation | Status |
|----------|---------|----------------|--------|
| Android app framework | React Native vs. Kotlin | React Native (JS, faster) | ⬜ Decide |
| Occupancy detection location | On-device vs. Backend | Backend (easier to update) | ⬜ Decide |
| Backend for app API | New Vercel fn vs. Supabase Edge Fn | Supabase Edge Fn (no Vercel limit) | ⬜ Decide |
| Monitoring hours | 24/7 vs. dawn-to-dusk | Dawn-to-dusk (saves power) | ⬜ Decide |
| Alert system | None vs. Push/email notification | Nice-to-have later | ⬜ Decide |
| Data retention | How long to keep historical data | 90 days (suggested) | ⬜ Decide |

---

## 🛒 Shopping List

| Item | Est. Cost | Where to Buy | Status |
|------|-----------|-------------|--------|
| Motorola Moto G 5G 2024 (XT2417D), used, unlocked | $50–$80 | Swappa, eBay, Facebook Marketplace | ⬜ Not Purchased |
| Solar panel, 5W+, USB-C output | $20–$40 | Amazon (Voltaic, Anker, or generic) | ⬜ Not Purchased |
| USB-C cable (short, 1–2ft, weatherproof ideally) | $10–$15 | Amazon | ⬜ Not Purchased |
| Weatherproof phone enclosure / outdoor mount | $20–$40 | Amazon — search "outdoor phone mount fence waterproof" | ⬜ Not Purchased |
| Helium Mobile SIM (if physical, not eSIM) | Free | helium.com | ⬜ Not Purchased |

**Estimated Total Hardware Cost: ~$100–$175**

---

## 📝 Session Log

| Date | What Happened | Next Steps |
|------|---------------|------------|
| 2026-04-02 | Project kicked off. Tracker created. Full spec reviewed. Awaiting hardware decisions. | David to start shopping list (Phase 1). Decide on app framework + backend approach. |

---

## 🚀 How Each Session Works

1. **David tells me**: "I bought the phone" / "Helium is activated" / "I tested the solar"
2. **I update this file**: Mark tasks ✅, update the session log
3. **I pick up code work**: Whatever Phase 2/3/4 tasks I can do in parallel
4. **End of session**: File saved, you can always see current status here

**File location in your folder:** `dm-pickleball/COURT_MONITOR_TRACKER.md`
