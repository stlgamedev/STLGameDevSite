import fs from 'fs/promises';
import path from 'path';
import { GraphQLClient, gql } from 'graphql-request';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

const CLIENT_ID = process.env.MEETUP_CLIENT_ID;
const CLIENT_SECRET = process.env.MEETUP_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const TOKEN_FILE_ENC = path.resolve('./.github/.refresh_token.enc');
const TOKEN_FILE_PLAIN = path.resolve('./.github/.refresh_token.txt');

async function decryptRefreshToken() {
  try {
    execSync(`openssl enc -aes-256-cbc -d -in ${TOKEN_FILE_ENC} -out ${TOKEN_FILE_PLAIN} -pass pass:${ENCRYPTION_KEY}`);
    const token = await fs.readFile(TOKEN_FILE_PLAIN, 'utf8');
    return token.trim();
  } catch {
    return process.env.MEETUP_REFRESH_TOKEN;
  }
}

async function encryptRefreshToken(token) {
  await fs.writeFile(TOKEN_FILE_PLAIN, token, 'utf8');
  execSync(`openssl enc -aes-256-cbc -salt -in ${TOKEN_FILE_PLAIN} -out ${TOKEN_FILE_ENC} -pass pass:${ENCRYPTION_KEY}`);
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://secure.meetup.com/oauth2/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await res.json();
  if (data.refresh_token) {
    await encryptRefreshToken(data.refresh_token);
  }
  return data.access_token;
}

async function fetchMeetupEvents(accessToken) {
  const graphQLClient = new GraphQLClient('https://api.meetup.com/gql', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

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
    afterDateTime: new Date().toISOString()
  };
  const data = await graphQLClient.request(query, variables);
  return data.groupByUrlname.upcomingEvents.edges.map(edge => edge.node);
}

async function saveEvents(events) {
  const fs = await import('fs/promises');
  await fs.writeFile('data/events.json', JSON.stringify(events, null, 2));
}

async function run() {
  try {
    const refreshToken = await decryptRefreshToken();
    const accessToken = await refreshAccessToken(refreshToken);
    const events = await fetchMeetupEvents(accessToken);
    await saveEvents(events);
    console.log('✅ Events updated successfully');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();