#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  defaultDates,
  getAccessToken,
  parseArgs,
  readCredentials,
  resolveDates,
  toCsv
} from './google-auth.mjs';

const DATA_API_ROOT = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API_ROOT = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const DEFAULT_TOKEN_PATH = path.join('.secrets', 'google-analytics-token.json');

const MODES = {
  pages: {
    dimensions: ['pagePath'],
    metrics: ['screenPageViews', 'activeUsers', 'sessions', 'engagedSessions', 'averageSessionDuration', 'eventCount']
  },
  landingPages: {
    dimensions: ['landingPagePlusQueryString'],
    metrics: ['sessions', 'activeUsers', 'engagedSessions', 'averageSessionDuration', 'conversions']
  },
  devices: {
    dimensions: ['deviceCategory'],
    metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagedSessions']
  },
  sources: {
    dimensions: ['sessionDefaultChannelGroup', 'sessionSourceMedium'],
    metrics: ['sessions', 'activeUsers', 'engagedSessions', 'screenPageViews']
  },
  countries: {
    dimensions: ['country'],
    metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagedSessions']
  },
  daily: {
    dimensions: ['date'],
    metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagedSessions']
  },
  pageSources: {
    dimensions: ['pagePath', 'sessionDefaultChannelGroup'],
    metrics: ['screenPageViews', 'activeUsers', 'sessions', 'engagedSessions']
  },
  events: {
    dimensions: ['eventName'],
    metrics: ['eventCount', 'activeUsers']
  }
};

function printHelp() {
  console.log(`Google Analytics 4 report tool

Usage:
  node scripts/ga-report.mjs --list-properties --credentials .secrets/google-oauth-client.json
  node scripts/ga-report.mjs --property 123456789 --mode pages
  node scripts/ga-report.mjs --property 123456789 --mode pageSources --page /kaomoji/

Options:
  --auth <service|oauth>       Auth mode. Default: auto-detect from credentials JSON
  --property <id>              GA4 property id, e.g. 123456789
  --list-properties            List visible GA4 account summaries and properties
  --mode <mode>                pages, landingPages, devices, sources, countries, daily, pageSources, events
  --start <YYYY-MM-DD>         Start date. Default: 28 days before end date
  --end <YYYY-MM-DD>           End date. Default: 2 days before today
  --days <number>              Alternative to --start. Counts back from --end/default end date
  --row-limit <number>         Rows per request. Default: 10000
  --page <path-or-url>         Filter by page path containing this value
  --output <json|csv|both>     Default: both
  --out-dir <path>             Default: reports/ga/<date>
  --credentials <path>         OAuth desktop client JSON or service account JSON path
  --token <path>               OAuth token cache path. Default: .secrets/google-analytics-token.json

Required setup:
  1. Enable Google Analytics Data API in Google Cloud.
  2. Enable Google Analytics Admin API if you want --list-properties.
  3. Use an OAuth Desktop client JSON with --auth oauth, or a service account with GA property access.
`);
}

function metricValue(row, index) {
  const value = row.metricValues?.[index]?.value ?? '0';
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function formatRows(rows, dimensions, metrics) {
  return (rows || []).map((row) => {
    const item = {};
    dimensions.forEach((dimension, index) => {
      item[dimension] = row.dimensionValues?.[index]?.value || '';
    });
    metrics.forEach((metric, index) => {
      item[metric] = metricValue(row, index);
    });
    return item;
  });
}

function buildDimensionFilter(args) {
  if (!args.page) return undefined;
  return {
    filter: {
      fieldName: 'pagePath',
      stringFilter: {
        matchType: 'CONTAINS',
        value: args.page
      }
    }
  };
}

async function listProperties(token) {
  const response = await fetch(`${ADMIN_API_ROOT}/accountSummaries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    if (data.error?.details?.some((detail) => detail.reason === 'SERVICE_DISABLED')) {
      throw new Error('GA Admin API is disabled for this OAuth project. Enable Google Analytics Admin API, or pass --property <GA4_PROPERTY_ID> directly and use report modes.');
    }
    throw new Error(`GA Admin API request failed: ${JSON.stringify(data)}`);
  }
  const rows = [];
  for (const account of data.accountSummaries || []) {
    for (const property of account.propertySummaries || []) {
      rows.push({
        account: account.displayName,
        accountId: account.account?.replace('accounts/', '') || '',
        property: property.displayName,
        propertyId: property.property?.replace('properties/', '') || '',
        propertyType: property.propertyType || ''
      });
    }
  }
  return rows;
}

async function runReport({ token, property, body }) {
  const response = await fetch(`${DATA_API_ROOT}/properties/${property}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`GA Data API request failed: ${JSON.stringify(data)}`);
  }
  return data.rows || [];
}

async function writeReports({ rows, args, mode, startDate, endDate }) {
  const output = args.output || 'both';
  const outDir = args['out-dir'] || path.join('reports', 'ga', endDate);
  await fs.mkdir(outDir, { recursive: true });
  const suffix = [args.property || 'properties', mode, startDate, endDate].join('_');
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

  const credentialsPath = args.credentials || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('Missing credentials. Pass --credentials <path> or set GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const credentials = await readCredentials(credentialsPath);
  const token = await getAccessToken({
    args,
    credentials,
    scope: SCOPE,
    tokenPath: DEFAULT_TOKEN_PATH,
    label: 'Google Analytics'
  });

  if (args['list-properties']) {
    const rows = await listProperties(token);
    if (!rows.length) {
      console.log('No GA4 properties were visible to this credential.');
      return;
    }
    for (const row of rows) {
      console.log(`${row.propertyId}\t${row.property}\t${row.account}`);
    }
    return;
  }

  const property = args.property || process.env.GA4_PROPERTY_ID;
  if (!property) throw new Error('Missing --property <GA4_PROPERTY_ID> or GA4_PROPERTY_ID env var.');

  const mode = args.mode || 'pages';
  const config = MODES[mode];
  if (!config) throw new Error(`Unknown --mode "${mode}". Use one of: ${Object.keys(MODES).join(', ')}`);

  const { startDate, endDate } = resolveDates(args, { lagDays: 2, spanDays: 28 });
  const rowLimit = Number(args['row-limit'] || 10000);
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: config.dimensions.map((name) => ({ name })),
    metrics: config.metrics.map((name) => ({ name })),
    limit: String(rowLimit),
    orderBys: [{
      metric: { metricName: config.metrics[0] },
      desc: true
    }]
  };
  const dimensionFilter = buildDimensionFilter(args);
  if (dimensionFilter) body.dimensionFilter = dimensionFilter;

  const rawRows = await runReport({ token, property, body });
  const rows = formatRows(rawRows, config.dimensions, config.metrics);
  const written = await writeReports({ rows, args, mode, startDate, endDate });

  console.log(`Fetched ${rows.length} rows from GA4 property ${property}`);
  console.log(`Mode: ${mode}, date range: ${startDate} to ${endDate}`);
  for (const file of written) console.log(`Wrote ${file}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
