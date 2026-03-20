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

// Stanford tax deduction rate from 2025 W-2
const STANFORD_TAX_RATE = 0.1441;
const STANFORD_HOURLY = 68;

// Calculate Stanford hours for a week based on whether rec classes are running
// Rec quarter detected by presence of Thursday rec class
function getStanfordHoursForWeek(weekEvents) {
  const summaries = weekEvents.map(e => (e.summary||'').toLowerCase());
  const hasThursdayRec = weekEvents.some(e => {
    const d = new Date(e.start.dateTime || e.start.date);
    return d.getDay() === 4 && (e.summary||'').toLowerCase().includes('stanford rec');
  });

  if (hasThursdayRec) {
    // Rec quarter: Tue 2.91 + Wed 1.66 + Thu 2.91 + Fri 1.66 = 9.14
    return { hours: 9.14, isRecQuarter: true };
  } else {
    // Off quarter: Tue 1.66 + Wed 1.66 + Fri 1.66 = 4.98
    return { hours: 4.98, isRecQuarter: false };
  }
}

function categorizeEvent(summary, location) {
  const s = (summary || '').toLowerCase();
  const l = (location || '').toLowerCase();
  const isMenlo = l.includes('190 park') || l.includes('190 park ln');
  if (isMenlo) return null;

  if (s.includes('stanford rec')) {
    const level = s.includes('adv') ? 'Int-Adv' : s.includes('int') ? 'Beg-Int' : 'Beginner';
    return { type: 'stanford_rec', label: 'Stanford REC ('+level+')', rateType: 'stanford', rate: STANFORD_HOURLY };
  }

  if (s.includes('stanford pb lesson') || s.includes('stanford open play')) {
    return { type: 'stanford_open', label: 'Stanford Open Play', rateType: 'stanford', rate: STANFORD_HOURLY };
  }

  if (s.includes('stanford') && !s.includes('pb')) return null;

  if (s.includes('group pb lesson')) {
    return { type: 'group', label: 'Group Lesson', rateType: 'flat', rate: 140 };
  }

  if (s.includes('pb lesson')) {
    const slashCount = (s.match(/\//g) || []).length;
    if (slashCount >= 2) return { type: 'group', label: 'Group Lesson', rateType: 'flat', rate: 140 };
    if (slashCount === 1) return { type: 'semi', label: 'Semi-Private Lesson', rateType: 'flat', rate: 140 };
    return { type: 'private', label: 'Private Lesson', rateType: 'per60', rate: 120 };
  }

  return null;
}

// Get week key (Sunday date) for grouping
function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  return sunday.toISOString().substring(0, 10);
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

    const allCalEvents = response.data.items || [];

    // Group Stanford events by week to calculate hours
    const stanfordByWeek = {};
    allCalEvents.forEach(e => {
      const s = (e.summary||'').toLowerCase();
      if (s.includes('stanford')) {
        const startDT = e.start.dateTime || e.start.date;
        const weekKey = getWeekKey(startDT.substring(0, 10));
        if (!stanfordByWeek[weekKey]) stanfordByWeek[weekKey] = [];
        stanfordByWeek[weekKey].push(e);
      }
    });

    // Calculate Stanford hours per week
    const stanfordWeeks = {};
    Object.entries(stanfordByWeek).forEach(([week, events]) => {
      stanfordWeeks[week] = getStanfordHoursForWeek(events);
    });

    const events = [];
    let totalEarnings = 0, stanfordEarnings = 0, stanfordHours = 0, stanfordNetEarnings = 0, lessonEarnings = 0;
    const processedStanfordWeeks = new Set();

    for (const event of allCalEvents) {
      const category = categorizeEvent(event.summary, event.location);
      if (!category) continue;

      const startDT = event.start.dateTime || event.start.date;
      const endDT = event.end.dateTime || event.end.date;

      // Only count completed events
      if (new Date(endDT) > new Date()) continue;

      const isStanford = category.type === 'stanford_rec' || category.type === 'stanford_open';

      if (isStanford) {
        // For Stanford, calculate by week not by individual event
        const weekKey = getWeekKey(startDT.substring(0, 10));
        if (!processedStanfordWeeks.has(weekKey) && stanfordWeeks[weekKey]) {
          processedStanfordWeeks.add(weekKey);
          const { hours, isRecQuarter } = stanfordWeeks[weekKey];
          const gross = Math.round(hours * STANFORD_HOURLY * 100) / 100;
          const net = Math.round(gross * (1 - STANFORD_TAX_RATE) * 100) / 100;
          stanfordHours += hours;
          stanfordEarnings += gross;
          stanfordNetEarnings += net;
          if (includeStanford === 'true') totalEarnings += gross;
          events.push({
            date: weekKey,
            summary: 'Stanford Week (' + (isRecQuarter ? 'Rec Quarter' : 'Open Play') + ')',
            category: isRecQuarter ? 'Stanford Rec Quarter' : 'Stanford Open Play',
            type: 'stanford_week',
            hours: Math.round(hours * 100) / 100,
            earnings: gross,
            netEarnings: net,
            isStanford: true,
            isRecQuarter,
            location: 'Stanford Redwood City',
          });
        }
      } else {
        const hrs = getDurationHrs(startDT, endDT);
        let earnings = 0;
        if (category.rateType === 'per60' || category.rateType === 'hourly') {
          earnings = Math.round(category.rate * hrs * 100) / 100;
        } else {
          earnings = category.rate;
        }
        lessonEarnings += earnings;
        totalEarnings += earnings;
        events.push({
          date: startDT.substring(0, 10),
          summary: event.summary,
          category: category.label,
          type: category.type,
          hours: Math.round(hrs * 100) / 100,
          earnings,
          isStanford: false,
          location: event.location || '',
        });
      }
    }

    // Sort by date
    events.sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      events,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      lessonEarnings: Math.round(lessonEarnings * 100) / 100,
      stanfordEarnings: Math.round(stanfordEarnings * 100) / 100,
      stanfordNetEarnings: Math.round(stanfordNetEarnings * 100) / 100,
      stanfordHours: Math.round(stanfordHours * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
