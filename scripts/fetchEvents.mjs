import { writeFile, readFile } from 'fs/promises';
import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { existsSync } from 'fs';

const FEED_URL = 'https://www.meetup.com/st-louis-game-developers/events/rss/';
const EVENTS_FILE = 'data/events.json';

const parser = new Parser();

function hash(content) {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

const parseEvent = (item) => ({
  id: item.guid,
  title: item.title,
  description: item.contentSnippet,
  dateTime: new Date(item.isoDate).toISOString(),
  eventUrl: item.link,
});

try {
  const feed = await parser.parseURL(FEED_URL);
  const newEvents = feed.items.map(parseEvent);

  let oldHash = null;
  if (existsSync(EVENTS_FILE)) {
    const existing = JSON.parse(await readFile(EVENTS_FILE, 'utf-8'));
    oldHash = hash(existing);
  }

  const newHash = hash(newEvents);

  if (oldHash !== newHash) {
    await writeFile(EVENTS_FILE, JSON.stringify(newEvents, null, 2));
    console.log('✅ events.json updated');
  } else {
    console.log('ℹ️ No changes in RSS feed');
  }
} catch (err) {
  console.error('❌ Failed to fetch or parse RSS feed:', err);
  process.exit(1);
}
