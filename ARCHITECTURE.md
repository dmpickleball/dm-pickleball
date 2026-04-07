# DM Pickleball — Site Architecture Summary

> Last updated: March 2026. Copy and paste this document into a new Claude chat for context.

---

## 1. Overall Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (single-page app, all UI in `src/App.jsx`) |
| Hosting | Vercel (Hobby plan — **12 serverless function limit**) |
| Database | Supabase (PostgreSQL) |
| Calendar | Google Calendar API (via Service Account) |
| Email | Nodemailer + Gmail SMTP (personal Gmail App Password) |
| Auth (students) | Google OAuth / Microsoft OAuth / Yahoo OAuth (popup flow) |
| Auth (admin) | Hardcoded username + password in `App.jsx` (`ADMIN_USER`) |
| Location search | Google Places API (New) |
| Travel time | Google Maps Distance Matrix API |

---

## 2. File / Code Structure

```
dm-pickleball/
├── src/
│   ├── App.jsx          ← ENTIRE frontend: all UI, state, logic, routing
│   └── main.jsx         ← React entry point (renders <App />)
│
├── api/                 ← Vercel serverless functions (Node.js, ES modules)
│   ├── calendar-events.js    ← Read GCal events (list + verify event IDs exist)
│   ├── cancel-booking.js     ← Delete or soft-cancel a GCal event
│   ├── create-booking.js     ← Create a new GCal event
│   ├── earnings-calendar.js  ← Fetch GCal events + compute earnings for finance tab
│   ├── get-busy-times.js     ← Fetch busy slots + compute travel buffers
│   ├── lessons.js            ← Supabase CRUD: list / save / update / delete lessons
│   ├── locations.js          ← Supabase CRUD: manage saved court locations
│   ├── places-search.js      ← Google Places API proxy (location autocomplete)
│   ├── send-email.js         ← Nodemailer: all outbound email (confirmations, cancellations, etc.)
│   ├── students.js           ← Supabase CRUD: student profiles, access requests, approve/deny/block
│   ├── supabase.js           ← Shared Supabase client (helper, not a function)
│   └── yahoo-token.js        ← Yahoo OAuth token exchange helper
│
├── public/images/       ← Static assets (photos, logos)
├── package.json
└── vite.config.js
```

**Important:** `src/App.jsx` is one large file (~4,200+ lines) containing every page, component, and piece of state. There is no React Router — tab/page switching is done with a `useState` variable.

---

## 3. Google APIs in Use

### 3a. Google Calendar API
- **Auth method:** Service Account (JWT). Credentials stored as Vercel environment variables:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_CALENDAR_ID`
- **Scope for reads:** `calendar.readonly`
- **Scope for writes:** `calendar` (full access)
- **Used in:** `create-booking.js`, `cancel-booking.js`, `get-busy-times.js`, `calendar-events.js`, `earnings-calendar.js`

#### What each function does:
| Function | Operation | Purpose |
|---|---|---|
| `create-booking.js` | `events.insert` | Creates a GCal event when a lesson is booked |
| `cancel-booking.js` | `events.delete` or `events.patch` | Deletes event (mode: delete) or marks organizer declined (mode: cancel) |
| `get-busy-times.js` | `events.list` | Fetches all events for a date range to compute available time slots |
| `calendar-events.js` | `events.list` + `events.get` | Lists events for admin calendar view; also verifies whether specific event IDs still exist (used for GCal-as-source-of-truth sync) |
| `earnings-calendar.js` | `events.list` | Reads all lesson events in a date range and computes earnings |

### 3b. Google OAuth (Student Login)
- **Client ID:** `708565807163-uu8teuc876ufboujut8vhdo34ro27v8s.apps.googleusercontent.com`
- **Flow:** Browser popup → `accounts.google.com/o/oauth2/v2/auth` → implicit token → fetch `https://www.googleapis.com/oauth2/v3/userinfo` to get email/name/picture
- **No backend involved** — token is used client-side only to get the student's identity

### 3c. Google Maps APIs
- **API key env var:** `GOOGLE_MAPS_API_KEY`
- **Distance Matrix API** — used in `get-busy-times.js` to calculate real driving time between lesson location and GCal event location, determining the travel buffer to add around each event
- **Places API (New)** — used in `places-search.js` for location autocomplete when the admin sets a custom lesson location. Biased to a 50km radius around Palo Alto (37.4775, -122.1697)

---

## 4. Booking / Scheduling Flow

### 4a. Student Self-Booking (BookingPage)

1. Student selects lesson type (Private / Semi-Private / Group) and duration (60 or 90 min)
2. On duration select, frontend immediately fires `GET /api/get-busy-times?date=TODAY&endDate=TODAY+30&memberType=...` to pre-load 30 days of availability in the background
3. `get-busy-times.js` fetches all GCal events and computes per-event travel buffers using Google Maps Distance Matrix. Returns a list of busy windows with `startMins`, `endMins`, `bufferBefore`, `bufferAfter`
4. Frontend's `getSlots()` function generates candidate time slots based on member type (Menlo vs. public) and day-of-week schedules, then filters out any that conflict with busy windows + buffers
5. CalendarPicker shows available dates with "X open" slot counts. Fully booked dates are greyed out
6. Student picks date → clicks date → `GET /api/get-busy-times?date=SELECTED` fires again for precise per-slot filtering
7. Student picks a time slot → proceeds through participant step (if semi/group) → confirm step
8. On confirm:
   - `POST /api/create-booking` → creates GCal event, returns `eventId`
   - `POST /api/lessons?action=save` → saves lesson to Supabase, returns UUID (`id`)
   - `POST /api/send-email` fires for: student confirmation, admin notification, partner (semi), each group member (group)
   - Lesson added to React state with Supabase UUID

### 4b. Admin Scheduling (AdminPanel → Schedule Lesson)

Identical flow to student booking, but initiated by David from the admin panel:

1. David selects a student, then picks lesson type + duration
2. Same 30-day availability pre-load fires when duration is selected
3. Same CalendarPicker with slot counts (as of recent update)
4. Additional step for semi/group: enter partner/group member first+last names and optional emails
5. Optional: custom price override, custom location
6. On confirm:
   - `POST /api/create-booking` → GCal event
   - `POST /api/lessons?action=save` → Supabase record
   - Emails fire to student, admin (David), partner/group members if emails provided

### 4c. Google Calendar as Source of Truth

- Every portal lesson has a ticket ID (format: `PB-MMDD-XXXX`) stored in both Supabase (`ticket_id` column) and the GCal event description
- On portal load, the frontend collects all `gcalEventId`s from confirmed/pending lessons and calls `GET /api/calendar-events?action=verify&ids=id1,id2,...`
- Any lesson whose GCal event no longer exists is automatically marked `status: "cancelled"` (with `cancelled_by: "gcal_sync"`) and a Supabase update is fired silently
- Calendar views (week/month/upcoming) deduplicate: GCal events whose `gcalEventId` matches a portal lesson's `gcalEventId` are filtered out of the "Calendar" row display — they appear only as the portal lesson row instead
- Manual GCal events (no ticket in description) are not in Supabase and are shown only as "Calendar" rows

---

## 5. Email System

### How emails are sent

- **Library:** Nodemailer
- **Transport:** Gmail SMTP using an App Password (not OAuth)
- **From address:** `"DM Pickleball" <CONTACT_GMAIL>` — this is David's personal Gmail
- **Env vars required:**
  - `CONTACT_GMAIL` — the Gmail address (e.g. `dmpickleball@gmail.com`)
  - `CONTACT_GMAIL_APP_PASSWORD` — 16-character Google App Password

### Email triggers

| Trigger | Recipients | Subject format |
|---|---|---|
| Student books a lesson | Student, David | "Your lesson is booked - [date]" / "New booking: [summary] - [date]" |
| Admin schedules a lesson | Student, David | "Your lesson is booked - [date]" / "Scheduled: [summary] - [date]" |
| Semi-private booked | Partner (if email provided) | "You have been added to a pickleball lesson - [date]" |
| Group lesson booked | Each group member (if email provided) | "You have been added to a group pickleball lesson - [date]" |
| Student cancels | Student, David, partner/group members | "Lesson Cancelled - [date]" |
| Admin cancels | Student, David, partner/group members | "Lesson Cancelled - [date]" |
| Account approved | Student (comm email if set, else Google email) | "Your DM Pickleball account is approved!" |
| Contact form submission | David (CONTACT_GMAIL) | "New contact form message from [name]" |

### Email format

All confirmation/cancellation emails are **branded HTML** with:
- Dark green DM Pickleball header
- Ticket badge (🎫 `PB-MMDD-XXXX`) for booked lessons
- Label: value formatting for lesson details
- **"📅 Add to Google Calendar" button** (styled link) when a GCal link is available
- Plain-text fallback always included

---

## 6. Limitations of Using a Personal Gmail Account

1. **Daily send limit:** Gmail SMTP via App Password has a ~500 email/day limit. Not an issue at current scale, but would need a transactional email provider (SendGrid, Postmark, Resend) if volume grows significantly.

2. **Sender reputation:** Emails come from a personal Gmail address. Some recipients' spam filters may flag them, especially if David's Gmail ever gets flagged for bulk sending.

3. **No email scheduling / queuing:** If the Vercel function times out or fails, the email is lost — there's no retry queue. Currently handled with `.catch(()=>{})` (silent failure).

4. **Reply-To header used to simulate "from student":** When a student books, the admin notification sets `replyTo` to the student's email so David can reply directly to them. The From address is always David's Gmail.

5. **App Password security:** If David's Gmail password changes or 2FA is reset, the App Password is invalidated and all emails stop. Requires regenerating and updating the Vercel env var.

6. **No email templates stored server-side:** All email HTML is generated client-side in the `makeEmailHtml()` helper in `App.jsx` and sent as the `html` field in the API call.

---

## 7. Supabase Database Tables

| Table | Purpose |
|---|---|
| `students` | Approved student profiles (email, name, member_type, skill_level, etc.) |
| `lessons` | All lesson records (date, time, type, status, gcal_event_id, ticket_id, etc.) |
| `access_requests` | Pending student registration requests awaiting admin approval |
| `deleted_students` | Archived student profiles (removed but preserved for history) |
| `locations` | Saved court locations for admin scheduling |

**Supabase auth method:** Service key (`SUPABASE_SERVICE_KEY`) used server-side in API functions only. The frontend never talks to Supabase directly.

---

## 8. Environment Variables Required (Vercel)

| Variable | Used By |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | All GCal API functions |
| `GOOGLE_PRIVATE_KEY` | All GCal API functions |
| `GOOGLE_CALENDAR_ID` | All GCal API functions |
| `GOOGLE_MAPS_API_KEY` | `get-busy-times.js`, `places-search.js` |
| `SUPABASE_URL` | `supabase.js` (shared) |
| `SUPABASE_SERVICE_KEY` | `supabase.js` (shared) |
| `CONTACT_GMAIL` | `send-email.js` |
| `CONTACT_GMAIL_APP_PASSWORD` | `send-email.js` |

---

## 9. Known Constraints & Workarounds

- **12 serverless function limit (Vercel Hobby):** Currently at 11 functions (`supabase.js` is a shared helper, not a function). Any new backend feature must be added as an `?action=` parameter on an existing function, not a new file.
- **No real auth system:** Student login uses OAuth popup to verify identity, but session is stored in React `useState` (lost on page refresh). Admin login is a hardcoded username/password in `App.jsx`.
- **All UI in one file:** `src/App.jsx` is ~4,200+ lines. There is no component splitting or file separation on the frontend.
- **Optimistic UI for deletes:** Lesson deletes remove from React state immediately and fire the API in the background with `.catch()`. If the API call fails silently, the UI and database can get out of sync until the next page load.
- **GCal is source of truth:** If David deletes a lesson event directly from Google Calendar (without using the portal), the portal detects this on next load via the `?action=verify` batch check and auto-cancels the matching Supabase record.
