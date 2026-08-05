const fs = require('fs');
const { DateTime } = require('luxon');
const IcalExpander = require('ical-expander');

const meetupEventUrlRegex = /https:\/\/www\.meetup\.com\/st-louis-game-developers\/events\/(\d+)\/?/i;
const meetupImageByEventId = {
  '315376686': 'https://github.com/user-attachments/assets/330d094e-e44e-441c-a15f-9af853dfc9ea'
};

const eventZone = 'America/Chicago';

// Read the .ics file
const icsData = fs.readFileSync('calendar.ics', 'utf8');

// Parse it
const icalExpander = new IcalExpander({ ics: icsData, maxIterations: 1000 });

// Define time range for events to extract
const now = new Date();
const future = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

// Get expanded events (handles recurrence)
const { events, occurrences } = icalExpander.between(now, future);

function buildEvent(item, startDate, endDate) {
  const description = item.description || '';
  const meetupMatch = description.match(meetupEventUrlRegex);
  const meetupEventId = meetupMatch ? meetupMatch[1] : '';

  return {
    title: item.summary,
    description,
    location: item.location || '',
    dateTime: DateTime.fromJSDate(startDate.toJSDate()).setZone(eventZone).toISO(),
    endTime: DateTime.fromJSDate(endDate.toJSDate()).setZone(eventZone).toISO(),
    eventUrl: item.url || '',
    meetupEventId,
    imageUrl: meetupEventId ? meetupImageByEventId[meetupEventId] || '' : ''
  };
}

// Combine single and recurring events
const allEvents = [
  ...events.map(e => buildEvent(e, e.startDate, e.endDate)),
  ...occurrences.map(({ startDate, endDate, item }) => buildEvent(item, startDate, endDate))
];

// Optional: sort by start time
allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

// Write to events.json
fs.writeFileSync('data/events.json', JSON.stringify(allEvents, null, 2));
