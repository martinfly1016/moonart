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
  --days <number>              Alternative to --start. Counts back from --end/default end date
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

  const { startDate, endDate } = resolveDates(args, { lagDays: 3, spanDays: 30 });
  const rowLimit = Number(args['row-limit'] || 25000);
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
    label: 'Google Search Console'
  });
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
