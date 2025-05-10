const fs = require('fs');
const ical = require('node-ical');
const { DateTime } = require('luxon');

(async () => {
  const data = await ical.parseFile('calendar.ics');
  const events = [];

  for (const k in data) {
    const ev = data[k];
    if (ev.type === 'VEVENT') {
      // Assume event.start is in local time (America/Chicago)
      const dtUTC = DateTime.fromJSDate(ev.start, { zone: 'America/Chicago' }).toUTC().toISO();

      events.push({
        title: ev.summary,
        description: ev.description || '',
        location: ev.location || '',
        dateTime: dtUTC,
        eventUrl: ev.url || ''
      });
    }
  }

  fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
})();
