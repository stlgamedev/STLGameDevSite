const fs = require('fs');
const ical = require('node-ical');
const { DateTime } = require('luxon');

(async () => {
  const data = await ical.parseFile('calendar.ics');
  const events = [];

  for (const k in data) {
    const ev = data[k];
    if (ev.type === 'VEVENT') {
      // Assume the intended timezone is America/Chicago
      const dt = DateTime.fromJSDate(ev.start, { zone: 'utc' }).setZone('America/Chicago');

      events.push({
        title: ev.summary,
        description: ev.description || '',
        location: ev.location || '',
        // This is now correctly localized to Central Time
        dateTime: dt.toISO(), // e.g., 2025-05-23T17:00:00.000-05:00
        eventUrl: ev.url || ''
      });
    }
  }

  fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
})();
