const fs = require('fs');
const { DateTime } = require('luxon');
const IcalExpander = require('ical-expander');
const { JSDOM } = require('jsdom');

const meetupEventUrlRegex = /https:\/\/www\.meetup\.com\/st-louis-game-developers\/events\/(\d+)\/?/gi;
const meetupRsvpUrlRegex = /For full details, including the address, and to RSVP see:[\s\S]*https:\/\/www\.meetup\.com\/st-louis-game-developers\/events\/(\d+)/i;

// Descriptions sometimes link to a different event before their own (a work
// session pointing at the jam it belongs to, say), so the first link in the text
// is not reliably this event. The RSVP line always is. If that line is ever
// reworded, fall back to the last link rather than the first.
function extractMeetupEventId(description) {
  const rsvpMatch = description.match(meetupRsvpUrlRegex);
  if (rsvpMatch) {
    return rsvpMatch[1];
  }

  const matches = [...description.matchAll(meetupEventUrlRegex)];
  return matches.length ? matches[matches.length - 1][1] : '';
}
const eventZone = 'America/Chicago';
const meetupFallbackImage = 'https://secure-content.meetupstatic.com/images/classic-events/placeholder-event.png';

function sanitizeImageUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.startsWith('https://') ? trimmed : '';
}

async function fetchMeetupImage(eventId) {
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
  const meetupEventId = extractMeetupEventId(description);
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
  const allEvents = [];
  for (const e of events) {
    allEvents.push(await buildEvent(e, e.startDate, e.endDate));
  }
  for (const { startDate, endDate, item } of occurrences) {
    allEvents.push(await buildEvent(item, startDate, endDate));
  }

  allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  fs.writeFileSync('data/events.json', JSON.stringify(allEvents, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
