#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const API_ROOT = 'https://www.googleapis.com/webmasters/v3';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const DEFAULT_TOKEN_PATH = path.join('.secrets', 'google-oauth-token.json');

const MODES = {
  queries: ['query'],
  pages: ['page'],
  pageQueries: ['page', 'query'],
  daily: ['date'],
  countries: ['country'],
  devices: ['device']
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Google Search Console report tool

Usage:
  node scripts/gsc-report.mjs --site https://mojimoon.com/ --mode queries
  node scripts/gsc-report.mjs --site https://mojimoon.com/ --mode pageQueries --page /emoji-copy/
  node scripts/gsc-report.mjs --auth oauth --credentials .secrets/google-oauth-client.json --site sc-domain:mojimoon.com --mode queries

Options:
  --auth <service|oauth>       Auth mode. Default: auto-detect from credentials JSON
  --site <url>                 Search Console property URL, e.g. https://mojimoon.com/ or sc-domain:mojimoon.com
  --mode <mode>                queries, pages, pageQueries, daily, countries, devices
  --start <YYYY-MM-DD>         Start date. Default: 30 days before end date
  --end <YYYY-MM-DD>           End date. Default: 3 days before today
  --row-limit <number>         Rows per request. Default: 25000
  --page <path-or-url>         Filter by page containing this value
  --query <text>               Filter by query containing this value
  --output <json|csv|both>     Default: both
  --out-dir <path>             Default: reports/gsc/<date>
  --credentials <path>         Service account JSON or OAuth desktop client JSON path
  --token <path>               OAuth token cache path. Default: .secrets/google-oauth-token.json

Required setup:
  1. Enable Google Search Console API in Google Cloud.
  2. Recommended: create an OAuth Desktop client and download its JSON file.
  3. Run this script with --auth oauth and follow the browser authorization link.
`);
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function defaultDates() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { startDate: toDateString(start), endDate: toDateString(end) };
}

function base64url(input) {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return source
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function readCredentials(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const credentials = JSON.parse(raw);
  return credentials;
}

function createJwt(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const claim = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(credentials.private_key);
  return `${unsigned}.${base64url(signature)}`;
}

async function getServiceAccountAccessToken(credentials) {
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account JSON must include client_email and private_key.');
  }
  const assertion = createJwt(credentials);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function getOAuthClient(credentials) {
  const source = credentials.installed || credentials.web || credentials;
  if (!source.client_id || !source.client_secret) {
    throw new Error('OAuth credentials must include installed.client_id and installed.client_secret.');
  }
  return {
    clientId: source.client_id,
    clientSecret: source.client_secret
  };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  await fs.chmod(filePath, 0o600).catch(() => {});
}

function startOAuthCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url, 'http://127.0.0.1');
      const code = requestUrl.searchParams.get('code');
      const error = requestUrl.searchParams.get('error');
      response.writeHead(error ? 400 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(error
        ? `<h1>Authorization failed</h1><p>${error}</p>`
        : '<h1>Authorization complete</h1><p>You can close this tab and return to Codex.</p>');
      server.close();
      if (error) reject(new Error(`OAuth authorization failed: ${error}`));
      else resolve(code);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        redirectUri: `http://127.0.0.1:${address.port}/oauth2callback`,
        waitForCode: new Promise((codeResolve, codeReject) => {
          server.removeAllListeners('request');
          server.on('request', (request, response) => {
            const requestUrl = new URL(request.url, 'http://127.0.0.1');
            const code = requestUrl.searchParams.get('code');
            const error = requestUrl.searchParams.get('error');
            response.writeHead(error ? 400 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
            response.end(error
              ? `<h1>Authorization failed</h1><p>${error}</p>`
              : '<h1>Authorization complete</h1><p>You can close this tab and return to Codex.</p>');
            server.close();
            if (error) codeReject(new Error(`OAuth authorization failed: ${error}`));
            else codeResolve(code);
          });
        })
      });
    });
    server.on('error', reject);
  });
}

async function exchangeOAuthCode({ clientId, clientSecret, code, redirectUri }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth code exchange failed: ${JSON.stringify(data)}`);
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000
  };
}

async function refreshOAuthToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth refresh failed: ${JSON.stringify(data)}`);
  }
  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000
  };
}

async function getOAuthAccessToken(credentials, tokenPath) {
  const { clientId, clientSecret } = getOAuthClient(credentials);
  const cached = await readJsonIfExists(tokenPath);
  if (cached?.access_token && cached?.expires_at && cached.expires_at > Date.now() + 60000) {
    return cached.access_token;
  }
  if (cached?.refresh_token) {
    const refreshed = await refreshOAuthToken({ clientId, clientSecret, refreshToken: cached.refresh_token });
    await writeJson(tokenPath, refreshed);
    return refreshed.access_token;
  }

  const { redirectUri, waitForCode } = await startOAuthCallbackServer();
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'consent select_account');
  if (process.env.GOOGLE_OAUTH_LOGIN_HINT) {
    authUrl.searchParams.set('login_hint', process.env.GOOGLE_OAUTH_LOGIN_HINT);
  }

  console.log('Open this URL in your browser to authorize Google Search Console access:');
  console.log(authUrl.toString());
  const code = await waitForCode;
  const token = await exchangeOAuthCode({ clientId, clientSecret, code, redirectUri });
  await writeJson(tokenPath, token);
  return token.access_token;
}

function inferAuthMode(args, credentials) {
  if (args.auth) return args.auth;
  if (credentials.type === 'service_account') return 'service';
  if (credentials.installed || credentials.web || credentials.client_id) return 'oauth';
  throw new Error('Unable to infer auth mode. Pass --auth oauth or --auth service.');
}

async function getAccessToken({ args, credentials }) {
  const authMode = inferAuthMode(args, credentials);
  if (authMode === 'service') return getServiceAccountAccessToken(credentials);
  if (authMode === 'oauth') {
    return getOAuthAccessToken(credentials, args.token || DEFAULT_TOKEN_PATH);
  }
  throw new Error(`Unknown auth mode "${authMode}". Use oauth or service.`);
}

function sitePath(siteUrl) {
  return encodeURIComponent(siteUrl);
}

function buildFilters(args) {
  const filters = [];
  if (args.page) {
    filters.push({
      dimension: 'page',
      operator: 'contains',
      expression: args.page
    });
  }
  if (args.query) {
    filters.push({
      dimension: 'query',
      operator: 'contains',
      expression: args.query
    });
  }
  if (!filters.length) return undefined;
  return [{ groupType: 'and', filters }];
}

async function querySearchAnalytics({ token, site, body }) {
  const response = await fetch(`${API_ROOT}/sites/${sitePath(site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Search Analytics request failed: ${JSON.stringify(data)}`);
  }
  return data.rows || [];
}

function formatRows(rows, dimensions) {
  return rows.map((row) => {
    const item = {};
    dimensions.forEach((dimension, index) => {
      item[dimension] = row.keys?.[index] || '';
    });
    item.clicks = row.clicks || 0;
    item.impressions = row.impressions || 0;
    item.ctr = row.ctr || 0;
    item.position = row.position || 0;
    return item;
  });
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function writeReports({ rows, args, mode, startDate, endDate }) {
  const output = args.output || 'both';
  const outDir = args['out-dir'] || path.join('reports', 'gsc', endDate);
  await fs.mkdir(outDir, { recursive: true });
  const safeSite = args.site.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const suffix = [safeSite, mode, startDate, endDate].join('_');
  const written = [];
  if (output === 'json' || output === 'both') {
    const jsonPath = path.join(outDir, `${suffix}.json`);
    await fs.writeFile(jsonPath, `${JSON.stringify(rows, null, 2)}\n`);
    written.push(jsonPath);
  }
  if (output === 'csv' || output === 'both') {
    const csvPath = path.join(outDir, `${suffix}.csv`);
    await fs.writeFile(csvPath, toCsv(rows));
    written.push(csvPath);
  }
  return written;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const site = args.site;
  const mode = args.mode || 'queries';
  const dimensions = MODES[mode];
  if (!site) throw new Error('Missing --site. Example: --site https://mojimoon.com/');
  if (!dimensions) throw new Error(`Unknown --mode "${mode}". Use one of: ${Object.keys(MODES).join(', ')}`);

  const defaults = defaultDates();
  const startDate = args.start || defaults.startDate;
  const endDate = args.end || defaults.endDate;
  const rowLimit = Number(args['row-limit'] || 25000);
  const credentialsPath = args.credentials || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('Missing credentials. Pass --credentials <path> or set GOOGLE_APPLICATION_CREDENTIALS.');
  }

  const credentials = await readCredentials(credentialsPath);
  const token = await getAccessToken({ args, credentials });
  const requestBody = {
    startDate,
    endDate,
    dimensions,
    rowLimit,
    type: 'web'
  };
  const filterGroups = buildFilters(args);
  if (filterGroups) requestBody.dimensionFilterGroups = filterGroups;

  const rawRows = await querySearchAnalytics({ token, site, body: requestBody });
  const rows = formatRows(rawRows, dimensions);
  const written = await writeReports({ rows, args, mode, startDate, endDate });

  console.log(`Fetched ${rows.length} rows from ${site}`);
  console.log(`Mode: ${mode}, date range: ${startDate} to ${endDate}`);
  for (const file of written) console.log(`Wrote ${file}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
