const fs = require('fs');
const { DateTime } = require('luxon');
const IcalExpander = require('ical-expander');
const { JSDOM } = require('jsdom');

const meetupEventUrlRegex = /https:\/\/www\.meetup\.com\/st-louis-game-developers\/events\/(\d+)\/?/i;
const eventZone = 'America/Chicago';
const meetupFallbackImage = 'https://secure-content.meetupstatic.com/images/classic-events/placeholder-event.png';
const knownMeetupImages = {
  '315376686': 'https://github.com/user-attachments/assets/330d094e-e44e-441c-a15f-9af853dfc9ea'
};

function sanitizeImageUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.startsWith('https://') ? trimmed : '';
}

async function fetchMeetupImage(eventId) {
  if (knownMeetupImages[eventId]) {
    return knownMeetupImages[eventId];
  }

  const url = `https://www.meetup.com/st-louis-game-developers/events/${eventId}/`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; STLGameDevSite event sync)'
      }
    });

    if (!response.ok) {
      return '';
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const { document } = dom.window;

    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="twitter:image"]'
    ];

    for (const selector of selectors) {
      const value = sanitizeImageUrl(document.querySelector(selector)?.getAttribute('content'));
      if (value && value !== meetupFallbackImage) {
        dom.window.close();
        return value;
      }
    }

    const jsonLdNodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (const node of jsonLdNodes) {
      try {
        const parsed = JSON.parse(node.textContent);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          const image = item?.image;
          const imageUrl = sanitizeImageUrl(Array.isArray(image) ? image[0] : image?.url ?? image?.contentUrl ?? image);
          if (imageUrl && imageUrl !== meetupFallbackImage) {
            dom.window.close();
            return imageUrl;
          }
        }
      } catch {
        // ignore invalid JSON-LD blocks
      }
    }

    dom.window.close();
  } catch {
    return '';
  }

  return '';
}

// Read the .ics file
const icsData = fs.readFileSync('calendar.ics', 'utf8');

// Parse it
const icalExpander = new IcalExpander({ ics: icsData, maxIterations: 1000 });

// Define time range for events to extract
const now = new Date();
const future = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

// Get expanded events (handles recurrence)
const { events, occurrences } = icalExpander.between(now, future);

async function buildEvent(item, startDate, endDate) {
  const description = item.description || '';
  const meetupMatch = description.match(meetupEventUrlRegex);
  const meetupEventId = meetupMatch ? meetupMatch[1] : '';
  const imageUrl = meetupEventId ? await fetchMeetupImage(meetupEventId) : '';

  return {
    title: item.summary,
    description,
    location: item.location || '',
    dateTime: DateTime.fromJSDate(startDate.toJSDate()).setZone(eventZone).toISO(),
    endTime: DateTime.fromJSDate(endDate.toJSDate()).setZone(eventZone).toISO(),
    eventUrl: item.url || '',
    meetupEventId,
    imageUrl
  };
}

async function main() {
  const allEvents = await Promise.all([
    ...events.map(e => buildEvent(e, e.startDate, e.endDate)),
    ...occurrences.map(({ startDate, endDate, item }) => buildEvent(item, startDate, endDate))
  ]);

  allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  fs.writeFileSync('data/events.json', JSON.stringify(allEvents, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
