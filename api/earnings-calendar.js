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

function fmtTime(dt) {
  if (!dt || !dt.includes('T')) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
}

const STANFORD_TAX_RATE = 0.1441;
const STANFORD_HOURLY = 68;

// MCC per-person rates (from contract: David gets 70% of gross)
// 60 min: Private=$115, S/P(2)=$60pp, S/P(3)=$50pp, S/P(4)=$40pp, Clinic=$35pp
// 90 min: Private=$170, S/P(2)=$90pp, S/P(3)=$55pp, Clinic=$35pp

// Parse participant names from calendar event notes.
// Handles structured labels (Participants:, Group:, Student:, Partner:),
// plain comma-separated lists, and one-name-per-line formats.
function parseNamesFromNotes(description) {
  if (!description) return [];

  // Structured: "Participants: Name1, Name2" or "Group: Name1, Name2"
  const pgMatch = description.match(/^(?:Participants|Group):\s*(.+)$/im);
  if (pgMatch) {
    return pgMatch[1].split(',').map(n => n.split('(')[0].trim()).filter(Boolean);
  }

  // Structured: "Student: Name" and/or "Partner: Name" (portal format)
  const studentMatch = description.match(/^Student:\s*(.+)$/im);
  const partnerMatch = description.match(/^Partner:\s*(.+)$/im);
  if (studentMatch || partnerMatch) {
    const names = [];
    if (studentMatch) names.push(studentMatch[1].split('(')[0].trim());
    if (partnerMatch) names.push(partnerMatch[1].split('(')[0].trim());
    return names.filter(Boolean);
  }

  // Unstructured: scan all lines for a comma-separated name list first
  // (no length cap here — 4+ full names can easily exceed 60 chars)
  const allLines = description.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of allLines) {
    if (!line.includes(':') && line.includes(',')) {
      const parts = line.split(',').map(n => n.trim()).filter(n => n.length > 0 && n.length < 50);
      if (parts.length > 1) return parts;
    }
  }
  // Fall back: one-name-per-line (lines without colons, reasonable single-name length)
  const nameLines = allLines.filter(l => !l.includes(':') && l.length < 50);
  if (nameLines.length > 0) return nameLines;

  return [];
}

function getMenloEarnings(summary, hrs, description) {
  const names = parseNamesFromNotes(description);
  // Use name count from notes if available; fall back to slash count in title
  const slashCount = (summary.match(/\//g) || []).length;
  const personCount = names.length > 0 ? names.length : slashCount + 1;
  const is90 = hrs >= 1.4;
  const isClinic = (summary || '').toLowerCase().includes('clinic');

  let gross = 0;
  if (isClinic) {
    gross = 35 * personCount;
  } else if (slashCount === 0) {
    // Private (1 person)
    gross = is90 ? 170 : 115;
  } else if (slashCount === 1) {
    // Semi-private (2 people)
    gross = is90 ? 90 * 2 : 60 * 2; // $180 or $120 total
  } else if (slashCount === 2) {
    // Group (3 people)
    gross = is90 ? 55 * 3 : 50 * 3; // $165 or $150 total
  } else {
    // Group (4+ people)
    gross = is90 ? 45 * personCount : 40 * personCount;
  }

  return {
    gross: Math.round(gross * 100) / 100,
    net: Math.round(gross * 0.7 * 100) / 100,
    personCount,
    names,
  };
}

function categorizeEvent(summary, location) {
  const s = (summary || '').toLowerCase();
  const l = (location || '').toLowerCase();
  const isMenlo = l.includes('190 park') || l.includes('190 park ln') || l.includes('menlo circus');

  if (s.includes('stanford rec')) {
    const level = s.includes('adv') ? 'Int-Adv' : s.includes('int') ? 'Beg-Int' : 'Beginner';
    return { type: 'stanford_rec', label: 'Stanford REC ('+level+')', rateType: 'stanford', rate: STANFORD_HOURLY };
  }
  if (s.includes('stanford pb lesson') || s.includes('stanford open play')) {
    return { type: 'stanford_open', label: 'Stanford Open Play', rateType: 'stanford', rate: STANFORD_HOURLY };
  }
  if (s.includes('stanford') && !s.includes('pb')) return null;

  // Clinic — check before 'pb lesson' to avoid misdetection
  if (s.includes('clinic')) {
    return { type: 'clinic', label: 'Pickleball Clinic', rateType: isMenlo ? 'menlo' : 'none', isMenlo };
  }
  if (s.includes('group pb lesson')) {
    return { type: 'group', label: 'Group Lesson', rateType: isMenlo ? 'menlo' : 'per60', rate: 140, isMenlo };
  }
  if (s.includes('pb lesson')) {
    const slashCount = (s.match(/\//g) || []).length;
    if (slashCount >= 2) return { type: 'group', label: 'Group Lesson', rateType: isMenlo ? 'menlo' : 'per60', rate: 140, isMenlo };
    if (slashCount === 1) return { type: 'semi', label: 'Semi-Private Lesson', rateType: isMenlo ? 'menlo' : 'per60', rate: 140, isMenlo };
    return { type: 'private', label: 'Private Lesson', rateType: isMenlo ? 'menlo' : 'per60', rate: 120, isMenlo };
  }
  if (s.includes('pickup')) {
    return { type: 'pickup', label: 'Pickup Buffer', rateType: 'none', rate: 0 };
  }
  if (isMenlo) return null;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { start, end, includeStanford, includeFuture } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });

  try {
    const calendar = google.calendar({ version: 'v3', auth: getAuth() });
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(start + 'T00:00:00-07:00').toISOString(),
      timeMax: new Date(end + 'T23:59:59-07:00').toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    });

    const allCalEvents = response.data.items || [];

    const events = [];
    let totalEarnings = 0, stanfordEarnings = 0, stanfordHours = 0, stanfordNetEarnings = 0, lessonEarnings = 0;
    let menloGrossEarnings = 0, menloNetEarnings = 0;

    for (const event of allCalEvents) {
      const category = categorizeEvent(event.summary, event.location);
      if (!category) continue;
      const startDT = event.start.dateTime || event.start.date;
      const endDT = event.end.dateTime || event.end.date;
      if (!includeFuture && new Date(endDT) > new Date()) continue;

      const description = event.description || '';

      // Pickup/buffer events — show on calendar, no earnings
      if (category.type === 'pickup') {
        const pickupAttendees = (event.attendees || [])
          .filter(a => { const em=(a.email||'').toLowerCase(); return em&&!em.includes('resource.calendar.google')&&!em.includes('serviceaccount')&&!a.organizer; })
          .map(a => ({ email:(a.email||'').toLowerCase(), status:a.responseStatus||'needsAction', displayName:a.displayName||'' }));
        events.push({
          date: startDT.substring(0, 10),
          summary: event.summary,
          category: 'Pickup Buffer',
          type: 'pickup',
          hours: Math.round(getDurationHrs(startDT, endDT) * 100) / 100,
          earnings: 0,
          isStanford: false,
          isPickup: true,
          gcalEventId: event.id,
          startTime: fmtTime(startDT),
          endTime: fmtTime(endDT),
          attendees: pickupAttendees,
          attendeeEmails: pickupAttendees.map(a => a.email),
          description,
        });
        continue;
      }

      // Extract attendees
      const attendees = (event.attendees || [])
        .filter(a => {
          const em = (a.email || '').toLowerCase();
          return em && !em.includes('resource.calendar.google') && !em.includes('serviceaccount') && !a.organizer;
        })
        .map(a => ({
          email: (a.email || '').toLowerCase(),
          status: a.responseStatus || 'needsAction',
          displayName: a.displayName || '',
        }));
      const attendeeEmails = attendees.map(a => a.email);

      const isStanford = category.type === 'stanford_rec' || category.type === 'stanford_open';
      const hrs = getDurationHrs(startDT, endDT);

      // Menlo lessons: calculate actual earnings (70% of per-person gross)
      if (category.isMenlo) {
        const { gross, net, personCount, names: parsedNames } = getMenloEarnings(event.summary, hrs, event.description || '');
        menloGrossEarnings += gross;
        menloNetEarnings += net;
        lessonEarnings += net;
        totalEarnings += net;
        events.push({
          date: startDT.substring(0, 10),
          summary: event.summary,
          category: category.label,
          type: category.type,
          hours: Math.round(hrs * 100) / 100,
          earnings: net,
          grossEarnings: gross,
          personCount,
          parsedNames,
          isStanford: false,
          isMenlo: true,
          gcalEventId: event.id,
          location: event.location || '',
          startTime: fmtTime(startDT),
          endTime: fmtTime(endDT),
          attendees,
          attendeeEmails,
          description,
        });
        continue;
      }

      if (isStanford) {
        const gross = Math.round(hrs * STANFORD_HOURLY * 100) / 100;
        const net = Math.round(gross * (1 - STANFORD_TAX_RATE) * 100) / 100;
        stanfordHours += hrs;
        stanfordEarnings += gross;
        stanfordNetEarnings += net;
        if (includeStanford === 'true') totalEarnings += gross;
        events.push({
          date: startDT.substring(0, 10),
          summary: event.summary,
          category: category.label,
          type: category.type,
          hours: Math.round(hrs * 100) / 100,
          earnings: gross,
          netEarnings: net,
          isStanford: true,
          gcalEventId: event.id,
          startTime: fmtTime(startDT),
          endTime: fmtTime(endDT),
          attendees,
          attendeeEmails,
          description,
        });
      } else {
        let earnings = 0;
        if (category.rateType === 'per60' || category.rateType === 'hourly') {
          earnings = Math.round(category.rate * hrs * 100) / 100;
        } else {
          earnings = category.rate || 0;
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
          gcalEventId: event.id,
          location: event.location || '',
          startTime: fmtTime(startDT),
          endTime: fmtTime(endDT),
          attendees,
          attendeeEmails,
          description,
        });
      }
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      events,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      lessonEarnings: Math.round(lessonEarnings * 100) / 100,
      stanfordEarnings: Math.round(stanfordEarnings * 100) / 100,
      stanfordNetEarnings: Math.round(stanfordNetEarnings * 100) / 100,
      stanfordHours: Math.round(stanfordHours * 100) / 100,
      menloGrossEarnings: Math.round(menloGrossEarnings * 100) / 100,
      menloNetEarnings: Math.round(menloNetEarnings * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
