import { google } from 'googleapis';

function getAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
}

function getDurationHrs(start, end) {
  return (new Date(end) - new Date(start)) / 3600000;
}

function categorizeEvent(summary, location) {
  const s = (summary || '').toLowerCase();
  const l = (location || '').toLowerCase();
  const isMenlo = l.includes('190 park') || l.includes('atherton');
  if (isMenlo) return null;

  if (s.includes('stanford rec')) {
    const level = s.includes('adv') ? 'Int-Adv' : s.includes('int') ? 'Beg-Int' : 'Beginner';
    return { type: 'stanford_rec', label: 'Stanford REC ('+level+')', rateType: 'hourly', rate: 68 };
  }

  if (s.includes('stanford pb lesson') || s.includes('stanford open play')) {
    return { type: 'stanford_open', label: 'Stanford Open Play', rateType: 'hourly', rate: 68 };
  }

  if (s.includes('stanford') && !s.includes('pb')) return null;

  // Group: "group pb lesson" OR 2+ slashes with "pb lesson"
  if (s.includes('group pb lesson')) {
    return { type: 'group', label: 'Group Lesson', rateType: 'flat', rate: 140 };
  }

  if (s.includes('pb lesson')) {
    const slashCount = (s.match(/\//g) || []).length;
    if (slashCount >= 2) {
      return { type: 'group', label: 'Group Lesson', rateType: 'flat', rate: 140 };
    }
    if (slashCount === 1) {
      return { type: 'semi', label: 'Semi-Private Lesson', rateType: 'flat', rate: 140 };
    }
    return { type: 'private', label: 'Private Lesson', rateType: 'per60', rate: 120 };
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { start, end, includeStanford } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start + 'T00:00:00-07:00').toISOString(),
      timeMax: new Date(end + 'T23:59:59-07:00').toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = [];
    let totalEarnings = 0, stanfordEarnings = 0, stanfordHours = 0, lessonEarnings = 0;

    for (const event of response.data.items || []) {
      const category = categorizeEvent(event.summary, event.location);
      if (!category) continue;
      const startDT = event.start.dateTime || event.start.date;
      const endDT = event.end.dateTime || event.end.date;
      const hrs = getDurationHrs(startDT, endDT);
      let earnings = 0;
      if (category.rateType === 'hourly' || category.rateType === 'per60') {
        earnings = Math.round(category.rate * hrs * 100) / 100;
      } else {
        earnings = category.rate;
      }
      const isStanford = category.type === 'stanford_rec' || category.type === 'stanford_open';
      if (isStanford) { stanfordHours += hrs; stanfordEarnings += earnings; }
      else { lessonEarnings += earnings; }
      if (!isStanford || includeStanford === 'true') totalEarnings += earnings;
      events.push({ date: startDT.substring(0, 10), summary: event.summary, category: category.label, type: category.type, hours: Math.round(hrs * 100) / 100, earnings, isStanford, location: event.location || '' });
    }

    res.status(200).json({
      events,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      lessonEarnings: Math.round(lessonEarnings * 100) / 100,
      stanfordEarnings: Math.round(stanfordEarnings * 100) / 100,
      stanfordHours: Math.round(stanfordHours * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
