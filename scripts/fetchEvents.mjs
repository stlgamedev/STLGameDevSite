// scripts/fetchEvents.mjs
import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs-extra';
import path from 'path';
import dayjs from 'dayjs';
import fetch from 'node-fetch';

const TOKEN_URL = 'https://secure.meetup.com/oauth2/access';
const GROUP_URLNAME = 'your-meetup-group'; // <- change to your group name
const EVENTS_FILE = path.join('data', 'events.json');

const {
  MEETUP_CLIENT_ID,
  MEETUP_CLIENT_SECRET,
  MEETUP_REFRESH_TOKEN
} = process.env;

async function refreshAccessToken() {
  const params = new URLSearchParams();
  params.append('client_id', MEETUP_CLIENT_ID);
  params.append('client_secret', MEETUP_CLIENT_SECRET);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', MEETUP_REFRESH_TOKEN);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to refresh token');
  return data.access_token;
}

async function fetchMeetupEvents(token) {
  const client = new GraphQLClient('https://api.meetup.com/gql', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const today = dayjs();
  const twoMonths = today.add(2, 'month');

  const query = gql`
    query ($urlname: String!) {
      groupByUrlname(urlname: $urlname) {
        upcomingEvents(input: { first: 100 }) {
          edges {
            node {
              id
              title
              eventUrl
              dateTime
              description
              eventImage {
                baseUrl
                id
              }
            }
          }
        }
      }
    }
  `;

  const variables = { urlname: GROUP_URLNAME };
  const data = await client.request(query, variables);
  const events = data.groupByUrlname.upcomingEvents.edges
    .map(edge => edge.node)
    .filter(e => {
      const d = dayjs(e.dateTime);
      return d.isAfter(today) && d.isBefore(twoMonths);
    });

  return events;
}

async function run() {
  const token = await refreshAccessToken();
  const newEvents = await fetchMeetupEvents(token);

  const oldEvents = fs.existsSync(EVENTS_FILE)
    ? fs.readJsonSync(EVENTS_FILE)
    : [];

  const isEqual = JSON.stringify(oldEvents) === JSON.stringify(newEvents);

  if (!isEqual) {
    console.log('Events changed — updating file.');
    fs.ensureDirSync('data');
    fs.writeJsonSync(EVENTS_FILE, newEvents, { spaces: 2 });
    process.exit(0); // success — changed
  } else {
    console.log('No event changes — nothing to update.');
    process.exit(78); // custom exit code for "no changes"
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
