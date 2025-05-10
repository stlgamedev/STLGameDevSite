const fs = require('fs');
const ical = require('node-ical');

(async () => {
  const data = await ical.parseFile('calendar.ics');
  const events = [];

  for (const k in data) {
    const ev = data[k];
    if (ev.type === 'VEVENT') {
      events.push({
        title: ev.summary,
        description: ev.description || '',
        location: ev.location || '',
        dateTime: ev.start.toISOString(),
        eventUrl: ev.url || ''
      });
    }
  }

  fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
})();
