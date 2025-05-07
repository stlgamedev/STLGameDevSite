// scripts/fetchEvents.mjs

import fs from 'fs';
import { GraphQLClient, gql } from 'graphql-request';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import process from 'process';

const CLIENT_ID = process.env.MEETUP_CLIENT_ID;
const CLIENT_SECRET = process.env.MEETUP_CLIENT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.MEETUP_REFRESH_TOKEN;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENC_FILE = path.resolve('.github/.refresh_token.enc');

const decryptToken = () => {
  if (!fs.existsSync(ENC_FILE)) return null;
  try {
    const output = execSync(`openssl enc -aes-256-cbc -d -in ${ENC_FILE} -k ${ENCRYPTION_KEY}`).toString();
    return output.trim();
  } catch (err) {
    console.warn('⚠️ Failed to decrypt refresh token. Falling back to secret.');
    return null;
  }
};

const encryptAndStoreToken = (token) => {
  try {
    execSync(`echo "${token}" | openssl enc -aes-256-cbc -e -out ${ENC_FILE} -k ${ENCRYPTION_KEY}`);
  } catch (err) {
    console.warn('⚠️ Failed to encrypt and store refresh token:', err);
  }
};

const refreshAccessToken = async (refreshToken) => {
  const res = await fetch('https://secure.meetup.com/oauth2/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    console.error('❌ Failed to refresh token');
    return null;
  }
  const json = await res.json();
  if (json.refresh_token) encryptAndStoreToken(json.refresh_token);
  return json.access_token;
};

const fetchMeetupEvents = async (accessToken) => {
  const client = new GraphQLClient('https://api.meetup.com/gql', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const now = new Date().toISOString().replace('Z', '-06:00');

  const query = gql`
    query ($urlname: String!, $afterDateTime: DateTime!) {
      groupByUrlname(urlname: $urlname) {
        events(filter: {afterDateTime: $afterDateTime, status: ACTIVE}) {
          edges {
            node {
              id
              title
              status
              dateTime
              description
              endTime
              featuredEventPhoto {
                standardUrl
              }
              eventUrl
            }
          }
        }
      }
    }
  `;

  const variables = {
    urlname: 'st-louis-game-developers',
    afterDateTime: now,
  };

  try {
    const data = await client.request(query, variables);
    return data.groupByUrlname.events.edges.map(edge => edge.node);
  } catch (err) {
    console.error('❌ Error: GraphQL Error (Code: 400):', err);
    throw err;
  }
};

const run = async () => {
  let refreshToken = decryptToken() || REFRESH_TOKEN_SECRET;

  const accessToken = await refreshAccessToken(refreshToken);
  if (!accessToken) {
    console.error('❌ Could not obtain access token');
    process.exit(1);
  }

  const events = await fetchMeetupEvents(accessToken);

  // Write events to data/events.json
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
  console.log('✅ Events saved to data/events.json');
};

run();
