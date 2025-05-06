// scripts/fetchEvents.mjs
import fs from 'fs';
import path from 'path';
import { GraphQLClient, gql } from 'graphql-request';
import fetch from 'node-fetch';

const CLIENT_ID = process.env.MEETUP_CLIENT_ID;
const CLIENT_SECRET = process.env.MEETUP_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.MEETUP_REFRESH_TOKEN;

async function refreshAccessToken() {
  const res = await fetch('https://secure.meetup.com/oauth2/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });

  console.log(res.ok);
  if (!res.ok) throw new Error('Failed to refresh token');
  const data = await res.json();
  return data.access_token;
}

async function fetchMeetupEvents(accessToken) {
  const client = new GraphQLClient('https://api.meetup.com/gql', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

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
              }
            }
          }
        }
      }
    }
  `;

  const variables = { urlname: 'st-louis-game-developers' };
  const data = await client.request(query, variables);
  return data.groupByUrlname.upcomingEvents.edges.map(e => e.node);
}

async function run() {
  try {
    const accessToken = await refreshAccessToken();
    const events = await fetchMeetupEvents(accessToken);

    const filePath = path.join('data', 'events.json');
    const newJson = JSON.stringify(events, null, 2);
    const oldJson = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

    if (newJson !== oldJson) {
      fs.writeFileSync(filePath, newJson);
      console.log('✅ Events updated.');
    } else {
      console.log('No changes to events.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
