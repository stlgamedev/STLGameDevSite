const fs = require('fs');
const ical = require('node-ical');
const icalDate = require('ical-date-parser');

(async () => {
  const data = ical.sync.parseFile('calendar.ics');
  const events = [];

  for (const event of Object.values(data)) {
  

    
      events.push({
        ...event
      });

      
    



    // if (ev.type === 'VEVENT') {
    //   // Assume the intended timezone is America/Chicago
    //   const dt = DateTime.fromJSDate(ev.start, { zone: 'utc' }).setZone('America/Chicago');

    //   events.push({
    //     title: ev.summary,
    //     description: ev.description || '',
    //     location: ev.location || '',
    //     // This is now correctly localized to Central Time
    //     dateTime: dt.toISO(), // e.g., 2025-05-23T17:00:00.000-05:00
    //     eventUrl: ev.url || ''
    //   });
    // }
  }

  fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
})();
