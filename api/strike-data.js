// /api/strike-data — gated equity data for the Strike planner.
//
// Amanda's real grant data lives ONLY in this server-side function. It is never
// shipped in the public HTML. The endpoint returns data only after verifying a
// Google ID token (JWT) AND confirming the signed-in email is on the allowlist.
//
// Auth flow: client signs in with Google Identity Services -> gets an ID token
// -> POSTs it here -> we verify signature + audience with google-auth-library
// -> check email is allowlisted + verified -> return the plan.

import { OAuth2Client } from 'google-auth-library';

// Same OAuth client already used by the site (authorized for dmpickleball.com).
const CLIENT_ID = '708565807163-uu8teuc876ufboujut8vhdo34ro27v8s.apps.googleusercontent.com';

// Only these two Google accounts may ever see the data.
const ALLOWLIST = ['davidmokblock@gmail.com', 'amandale91@gmail.com'];

const client = new OAuth2Client(CLIENT_ID);

// ---- Amanda's BillionToOne (BLLN) equity, from Fidelity NetBenefits ----
// "Exercisable" = shares still available to exercise right now (after the 600
// $2.80 ISOs already exercised in 2026). Spread is computed live from price.
const PLAN = {
  company: 'BillionToOne',
  ticker: 'BLLN',
  asOfDate: '2026-06-17',
  currentPrice: 99.38,          // implied by every grant's Fidelity exercisable value
  filingStatus: 'single',
  state: 'CA',
  // Ordinary income before any option event. Amanda's own estimate for 2026
  // (~$119k gross YTD at mid-June, projecting to ~$240k for the full year).
  expectedIncome: 240000,
  expectedIncomeIsEstimate: false,
  // ISO spread already realized & held in 2026 (the 600 $2.80 options) -> already
  // an AMT preference item for this tax year. 600 * (99.38 - 2.80) = 57,948.
  priorIsoExerciseThisYear: { strike: 2.80, shares: 600, type: 'ISO' },
  // Grants with shares still exercisable. Strikes/quantities from the award detail.
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = req.body || {};
    const credential = body.credential;
    if (!credential) return res.status(401).json({ error: 'Missing credential' });

    const ticket = await client.verifyIdToken({ idToken: credential, audience: CLIENT_ID });
    const payload = ticket.getPayload();

    const email = (payload?.email || '').toLowerCase();
    const verified = payload?.email_verified === true || payload?.email_verified === 'true';

    if (!verified || !ALLOWLIST.includes(email)) {
      return res.status(403).json({ error: 'Not authorized', email });
    }

    return res.status(200).json({
      ok: true,
      user: { email, name: payload.name || '', picture: payload.picture || '' },
      plan: PLAN,
    });
  } catch (err) {
    console.error('strike-data auth error:', err?.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
