# DM Pickleball — New Chat Handoff

Paste this entire file at the start of the new chat. It covers everything the assistant needs to know to continue working on the project without re-reading every file.

---

## What This Project Is

**DM Pickleball** — a coaching website for David Mok, a 5.0+ pickleball coach on the SF Peninsula. Students book private/semi-private/group lessons online. David manages everything through an admin panel.

Live site: https://dmpickleball.com
Repo folder: `/sessions/.../mnt/dm-pickleball/` (the mounted workspace folder)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, single-file `src/App.jsx` (~4750 lines), no routing library |
| Build | Vite |
| Hosting | Vercel (Hobby plan — **max 12 serverless functions**) |
| Database | Supabase (PostgreSQL) |
| Calendar | Google Calendar API via Service Account |
| Email | Nodemailer via `api/send-email.js` |
| Auth | Custom (passwords stored in Supabase, admin login hardcoded) |

---

## Critical Constraints

- **Vercel Hobby plan = max 12 serverless functions.** Any file in `/api/` is counted UNLESS it starts with `_`. That's why the Supabase helper is `api/_supabase.js` (underscore = excluded from count).
- **Google Service Account** does NOT have domain-wide delegation. It can add attendees to calendar events but cannot use `sendUpdates:'all'` (causes 403). Always use `sendUpdates:'none'` as a query param.
- All state is client-side React (`useState`). There is no Redux/Zustand. The admin panel (`AdminPanel` component) receives everything via props from the root `App` component.

---

## File Map

```
dm-pickleball/
├── src/
│   └── App.jsx              ← ENTIRE frontend, ~4750 lines
├── api/
│   ├── _supabase.js         ← Supabase client helper (underscore = not a function)
│   ├── create-booking.js    ← Creates Google Calendar event + handles attendees
│   ├── cancel-booking.js    ← Deletes or marks cancelled on GCal
│   ├── earnings-calendar.js ← Powers admin Finances + Lessons calendarItems state
│   ├── calendar-events.js   ← Events/tournaments/rentals (NOT the main lesson feed)
│   ├── lessons.js           ← CRUD for lessons in Supabase
│   ├── students.js          ← CRUD for students in Supabase
│   ├── gear.js              ← Gear/brands settings from Supabase
│   ├── get-busy-times.js    ← Google Calendar free/busy query
│   ├── locations.js         ← Student home court locations
│   ├── places-search.js     ← Google Places autocomplete
│   ├── send-email.js        ← Nodemailer email sender
│   └── yahoo-token.js       ← Yahoo OAuth token exchange
├── index.html               ← Loads DM Sans + Inter from Google Fonts
├── vercel.json              ← { "rewrites": [{ "source":"/(.*)", "destination":"/" }] }
└── package.json
```

---

## Key Constants in App.jsx (top of file)

```js
const G = "#1a3c34"   // brand green (used everywhere)
const Y = "#c0c0c0"   // silver accent

const ADMIN_USER = { email:"dlogfx", password:"pejkyt-8sejFu-wyzcac" }

// Fonts:
// Admin panel wrapper → fontFamily:"'Inter',sans-serif"
// Public site wrapper → fontFamily:"'DM Sans',sans-serif"

// Home court / default lesson location:
// "Andrew Spinas Park, 3003 Bay Rd, Redwood City, CA 94063"
// Google Maps: https://maps.google.com/?q=Andrew+Spinas+Park,+3003+Bay+Rd,+Redwood+City,+CA+94063

// Menlo location:
// "Menlo Circus Club, 190 Park Ln, Atherton, CA 94027"

// Stanford location:
// "Stanford Redwood City"
```

---

## Environment Variables (set in Vercel dashboard)

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_PRIVATE_KEY           ← multiline key, \n escaped as \\n in Vercel
GOOGLE_CALENDAR_ID           ← the calendar events are written to
CONTACT_GMAIL
CONTACT_GMAIL_APP_PASSWORD
YAHOO_CLIENT_SECRET
```

---

## Data Architecture

### Lessons
- Stored in Supabase `lessons` table
- Loaded into `allLessons` state: `{ [studentEmail]: Lesson[] }`
- Flattened to `allLessonsList` for calendar views (excludes `status === 'archived'`)
- Key lesson statuses: `confirmed | cancelled | late_cancel | no_show | weather_cancel | cancelled_forgiven | archived`

### Students
- Stored in Supabase `students` table
- Loaded into `mockUsersState`: `{ [email]: { name, memberType, approved, ... } }`
- `memberType`: `'public'` | `'menlo'` | `'grandfathered'`

### Calendar Items (`calendarItems` state)
- Loaded from `/api/earnings-calendar.js` (NOT `calendar-events.js`)
- Powers: admin Lessons view (all 4 tabs: Day/Week/Month/Upcoming), RSVP dots
- Each item has: `gcalEventId, attendees[], attendeeEmails[], date, summary, ...`

### Calendar Events (`calendarEvents` / `eventsData` state)
- Loaded from `/api/calendar-events.js`
- Powers: external events (tournaments, rentals, pickups) in the Lessons tab
- These are SEPARATE from portal lessons

---

## Admin Panel Structure

The admin panel (`AdminPanel` component, defined around line 2606) has these tabs:
- **Lessons** — Day/Week/Month/Upcoming views, all lessons + calendar events merged
- **Students** — Student list, detail view with lesson history + archived lessons
- **Schedule** — 5-step wizard to book a lesson for a student
- **Finances** — Earnings by day/week/month/year, actual vs projected
- **Settings** — Stanford enable/disable, Saturday enable/disable, Gear tab
- **Pending** — Student registration approvals

---

## Google Calendar / Attendees Flow

### Creating a booking (`api/create-booking.js`)
1. Builds attendee list: `[studentEmail, ...additionalEmails]` (deduplicated)
2. Tries `calendar.events.insert` with `sendUpdates:'none'` (query param) + `attendees` array
3. If that fails (e.g. permission error), falls back to insert without attendees
4. Returns `{ success, eventId, attendeesAdded: bool, attendeeCount, attendeeError? }`
5. Frontend logs a `console.warn` if attendees weren't added, showing the reason

### RSVP dots in admin panel
- `earnings-calendar.js` returns `attendees[]` with `{ email, status, displayName }` on each event
- `status` values: `accepted | declined | needsAction | tentative`
- In App.jsx, `calAttendeesByGcalId` map is built from `calendarItems` (all events, unfiltered)
- `RsvpDot` component renders colored circles: green=accepted, red=declined, grey=needsAction
- `RsvpBadge` wraps multiple dots
- Applied to both `LessonRow` (portal lessons) and `CalRow` (calendar events)

---

## Archive System (lessons)

Replacing the old hard-delete:
- **Archive button** (was "Delete") → sets `status: 'archived'` in Supabase, updates state via `onUpdateLesson`
- Archived lessons are hidden from: main lesson list in student detail, `allLessonsList` (all calendar views)
- **Archived Lessons section** — collapsible section at bottom of each student's detail view
- **Permanent delete from archive** — requires admin password (`ADMIN_USER.password`) typed into an inline input; then calls `onDeleteLesson` + Supabase delete + GCal delete

---

## Booking Summaries — Location Display

Three places all show a labeled, linked location row:
```jsx
<div style={{display:"flex",alignItems:"flex-start",gap:6}}>
  <span style={{color:"#9ca3af",fontSize:"0.8rem",fontWeight:700,paddingTop:2,whiteSpace:"nowrap"}}>📍 Location:</span>
  <a href={mapsUrl} target="_blank" rel="noreferrer" style={{color:G,fontWeight:600}}>{locationText}</a>
</div>
```
Locations:
1. Student booking step 4 (line ~1733)
2. Post-booking success screen (line ~1552)
3. Admin schedule step 4 confirm (line ~3594)

---

## Finances UX

- **Income cell** (`td` in Finances > Actual table): dashed underline on amount, hover highlight, `✎` icon, `title="Click to edit income"`
- **Edit dialog**: shows "Current value: $X.XX" (the value before editing) + "Default rate: $X.XX"
- `editOriginalVal` state stores the value when dialog opens

---

## Confirmation Emails

Sent via `api/send-email.js` using Nodemailer. Email templates:
- `makeEmailHtml(text, calLink)` — student booking confirmation (has Google Calendar add link)
- `makeCancelEmailHtml(text)` — cancellation notification
- Sent from `book@dmpickleball.com` or `noreply@dmpickleball.com`
- Admin always gets a copy at `david@dmpickleball.com`

---

## Lesson Pricing (`SCHED_PRICES` / `getRate`)

```js
// Base rates (public)
private 60min → $120, 90min → $165
semi    60min → $160, 90min → $220  (split = /2 per person)
group   60min → $200, 90min → $270  (split equally)

// Menlo Club members get discounted rates (check getRate() for exact values)
```

---

## What Was Just Worked On (latest commits)

```
421cfd5  Debug attendees: add sendUpdates:'none', surface errors in response/console
c960b37  UX: location labels, archive lessons, finances improvements, Inter font
e7e8c9d  Fix RSVP dots: add attendees[] with responseStatus to earnings-calendar.js
5c32dcb  Fix: remove sendUpdates:'all' which broke calendar event creation
1f74dc9  Add student/partner attendees to Google Calendar invites + RSVP dots
b3d0a20  Fix Vercel Hobby plan limit: rename supabase.js to _supabase.js
```

---

## Known / Open Issues (as of this handoff)

1. **Calendar attendees still not showing** — The attendee code is correct. Added `sendUpdates:'none'` and detailed logging. After next deploy, check:
   - Browser console for `"GCal attendees added OK"` vs `"GCal attendees NOT added: [reason]"`
   - Vercel logs for `create-booking` function: `console.log('create-booking: studentEmail=...')`
   - The error message will identify exactly what Google is rejecting

2. **Mobile responsiveness** — Homepage grids (stats `repeat(3,1fr)`, about `"1fr 2fr"`) need mobile detection + collapse. The `Homepage` component would need a local `mob` state (viewport width check).

3. **Confirmation email improvements** — Could be clearer about who set up the lesson, who's in it, and include a clickable Google Maps link for Andrew Spinas Park.

---

## How to Work on This

1. The workspace folder is already mounted at the right path
2. Edit `src/App.jsx` and/or files in `api/`
3. Commit with `git add ... && git commit -m "message"`
4. Tell David to `git push` from his terminal (or push is done in the session)
5. Vercel auto-deploys on push to `main`

**To search the codebase effectively:**
- Use Grep with `-n` flag for line numbers
- App.jsx is one big file — search for component names, state variable names, or unique strings
- Key component boundaries: `function AdminPanel(` ~line 2606, `function FinancesTab(` ~line 1919, `function BookingPage(` search for it, `function Homepage(` search for it

---

## Starting Prompt Template for New Chat

```
I'm continuing work on the DM Pickleball coaching website. Here's the full project context:

[paste this entire file]

Here's the new task I want to build:
[describe your task]
```
