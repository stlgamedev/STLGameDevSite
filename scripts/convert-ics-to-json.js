const fs = require('fs');
const { DateTime } = require('luxon');
const IcalExpander = require('ical-expander');

// Read the .ics file
const icsData = fs.readFileSync('calendar.ics', 'utf8');

// Parse it
const icalExpander = new IcalExpander({ ics: icsData, maxIterations: 1000 });

// Define time range for events to extract
const now = new Date();
const future = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

// Get expanded events (handles recurrence)
const { events, occurrences } = icalExpander.between(now, future);

// Combine single and recurring events
const allEvents = [
  ...events.map(e => ({
    title: e.summary,
    description: e.description || '',
    location: e.location || '',
    dateTime: DateTime.fromJSDate(e.startDate.toJSDate(), { zone: e.startDate.zoneName }).toISO(),
    endTime: DateTime.fromJSDate(e.endDate.toJSDate(), { zone: e.endDate.zoneName }).toISO(),
    eventUrl: e.url || ''
  })),
  ...occurrences.map(({ startDate, endDate, item }) => ({
    title: item.summary,
    description: item.description || '',
    location: item.location || '',
    dateTime: DateTime.fromJSDate(startDate.toJSDate(), { zone: startDate.zoneName }).toISO(),
    endTime: DateTime.fromJSDate(endDate.toJSDate(), { zone: endDate.zoneName }).toISO(),
    eventUrl: item.url || ''
  }))
];

// Optional: sort by start time
allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

// Write to events.json
fs.writeFileSync('data/events.json', JSON.stringify(allEvents, null, 2));
