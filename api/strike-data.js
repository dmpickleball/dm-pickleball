// /api/strike-data — gated equity data for the Strike planner.
//
// Runs on Vercel's EDGE runtime so it does NOT count against the Hobby plan's
// 12 Serverless Function limit (the rest of the site's /api functions are
// serverless and untouched).
//
// Amanda's real grant data lives ONLY in this server-side function — never in
// the public HTML. It is returned only after Google verifies the ID token and
// the signed-in email is on the allowlist. Verification uses Google's own
// tokeninfo endpoint (built-in fetch), so there are zero npm dependencies.

export const config = { runtime: 'edge' };

// Same OAuth client already used by the site (authorized for dmpickleball.com).
const CLIENT_ID = '708565807163-uu8teuc876ufboujut8vhdo34ro27v8s.apps.googleusercontent.com';

// Only these two Google accounts may ever see the data.
const ALLOWLIST = ['davidmokblock@gmail.com', 'amandale91@gmail.com'];

// ---- Amanda's BillionToOne (BLLN) equity, from Fidelity NetBenefits ----
// "exercisable" = shares still available to exercise right now (after the 600
// $2.80 ISOs already exercised in 2026). Spread is computed live from price.
const PLAN = {
  company: 'BillionToOne',
  ticker: 'BLLN',
  asOfDate: '2026-06-17',
  currentPrice: 99.38,
  filingStatus: 'single',
  state: 'CA',
  // Ordinary income before any option event. Amanda's own estimate for 2026
  // (~$119k gross YTD at mid-June, projecting to ~$240k for the full year).
  expectedIncome: 240000,
  expectedIncomeIsEstimate: false,
  // ISO spread already realized & held in 2026 (the 600 $2.80 options) -> already
  // an AMT preference item for this tax year.
  priorIsoExerciseThisYear: { strike: 2.80, shares: 600, type: 'ISO' },
  // David's side of the household, for the guided Advisor's affordability picture.
  // Income is an editable estimate: MCC pays him 70% of each lesson as a 1099, and
  // he keeps most of it after business deductions (~5% effective). Variable, so a range.
  household: {
    davidNetMonthly: '4000-6500',
    davidFixedCosts: { car: 667, insuranceMonthly: 192, phone: 145 }, // car payment; auto ins. ($1,150 in Apr & Oct); Verizon share
    davidCashSavings: 12000, // separate small buffer; not AMT-available
  },
  grants: [
    { id: '2021',     year: 2021, type: 'ISO', strike: 2.80,  granted: 8000,  exercisable: 7400, grantDate: '2021-06-08', expires: '2031-06-07' },
    { id: '2022',     year: 2022, type: 'ISO', strike: 10.92, granted: 7000,  exercisable: 7000, grantDate: '2022-08-02', expires: '2032-08-01' },
    { id: '2023-a',   year: 2023, type: 'ISO', strike: 11.55, granted: 10000, exercisable: 6666, grantDate: '2023-10-18', expires: '2033-10-17' },
    { id: '2023-b',   year: 2023, type: 'ISO', strike: 8.65,  granted: 3000,  exercisable: 2750, grantDate: '2023-01-19', expires: '2033-01-18' },
    { id: '2024',     year: 2024, type: 'ISO', strike: 15.17, granted: 7000,  exercisable: 3500, grantDate: '2024-06-06', expires: '2034-06-05' },
    { id: '2025-iso', year: 2025, type: 'ISO', strike: 30.78, granted: 4815,  exercisable: 833,  grantDate: '2025-10-01', expires: '2035-09-30' },
    { id: '2025-nso', year: 2025, type: 'NSO', strike: 30.78, granted: 185,   exercisable: 0,    grantDate: '2025-10-01', expires: '2035-09-30' },
  ],
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body = {};
  try { body = await req.json(); } catch (e) { /* ignore */ }
  const credential = body && body.credential;
  if (!credential) return json({ error: 'Missing credential' }, 401);

  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
    if (!r.ok) return json({ error: 'Invalid token' }, 401);
    const p = await r.json();

    const email = (p.email || '').toLowerCase();
    const verified = p.email_verified === true || p.email_verified === 'true';

    if (p.aud !== CLIENT_ID) return json({ error: 'Wrong audience' }, 401);
    if (!verified || !ALLOWLIST.includes(email)) return json({ error: 'Not authorized' }, 403);

    return json({ ok: true, user: { email, name: p.name || '', picture: p.picture || '' }, plan: PLAN });
  } catch (e) {
    return json({ error: 'Auth failed' }, 401);
  }
}
