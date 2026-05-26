#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getAccessToken,
  parseArgs,
  readCredentials,
  resolveDates,
  toCsv
} from './google-auth.mjs';

const GSC_ROOT = 'https://www.googleapis.com/webmasters/v3';
const GA_ROOT = 'https://analyticsdata.googleapis.com/v1beta';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const DEFAULT_SITE = 'sc-domain:mojimoon.com';
const DEFAULT_GA_PROPERTY = '503343497';
const DEFAULT_ORIGIN = 'https://mojimoon.com';
const DEFAULT_CREDENTIALS = path.join('.secrets', 'google-oauth-client.json');
const DEFAULT_GSC_TOKEN = path.join('.secrets', 'google-oauth-token.json');
const DEFAULT_GA_TOKEN = path.join('.secrets', 'google-analytics-token.json');

const DEFAULT_PAGES = [
  { path: '/emoji-copy/heart/', label: 'Heart emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/kawaii/', label: 'Kawaii emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/sparkle/', label: 'Sparkle emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/tear/', label: 'Tear emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/smile/', label: 'Smile emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/hand-sign/', label: 'Hand sign emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/flower/', label: 'Flower emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/star/', label: 'Star emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/thank-you/', label: 'Thank you emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/sorry/', label: 'Sorry emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/warning/', label: 'Warning emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/birthday/', label: 'Birthday emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/emoji-copy/good-night/', label: 'Good night emoji', locale: 'ja', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/heart/', label: 'Heart emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/kawaii/', label: 'Cute emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/sparkle/', label: 'Sparkle emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/tear/', label: 'Tear emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/smile/', label: 'Smile emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/hand-sign/', label: 'Hand sign emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/flower/', label: 'Flower emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/star/', label: 'Star emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/thank-you/', label: 'Thank you emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/sorry/', label: 'Sorry emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/warning/', label: 'Warning emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/birthday/', label: 'Birthday emoji', locale: 'en', group: 'emoji-copy-topic' },
  { path: '/en/emoji-copy/good-night/', label: 'Good night emoji', locale: 'en', group: 'emoji-copy-topic' }
];

function printHelp() {
  console.log(`Recent page monitor for GA4 + Google Search Console

Usage:
  npm run monitor:recent-pages -- --days 28
  npm run monitor:recent-pages -- --pages /emoji-copy/tear/,/en/emoji-copy/tear/
  npm run monitor:recent-pages -- --page-file docs/recent-pages.json

Options:
  --credentials <path>      OAuth desktop client JSON. Default: .secrets/google-oauth-client.json
  --site <property>         GSC property. Default: sc-domain:mojimoon.com
  --ga-property <id>        GA4 property id. Default: 503343497
  --origin <url>            Canonical origin. Default: https://mojimoon.com
  --start <YYYY-MM-DD>      Start date. Default: 28 days before end date
  --end <YYYY-MM-DD>        End date. Default: 3 days before today, to align with GSC delay
  --days <number>           Alternative to --start. Counts back from --end/default end date
  --pages <csv>             Comma-separated page paths or absolute URLs
  --page-file <path>        JSON file with [{ path, label, locale, group }]
  --top-queries <number>    Top GSC queries per page. Default: 5
  --out-dir <path>          Default: reports/recent-pages/<end-date>
`);
}

function normalizePath(value) {
  if (!value) return '/';
  try {
    if (/^https?:\/\//i.test(value)) return new URL(value).pathname || '/';
  } catch {
    // Fall through to path cleanup.
  }
  const withSlash = value.startsWith('/') ? value : `/${value}`;
  return withSlash.endsWith('/') || /\.[a-z0-9]+$/i.test(withSlash) ? withSlash : `${withSlash}/`;
}

function pageUrl(origin, pagePath) {
  return new URL(normalizePath(pagePath), origin).toString();
}

function sitePath(siteUrl) {
  return encodeURIComponent(siteUrl);
}

function metricValue(row, index) {
  const value = row.metricValues?.[index]?.value ?? '0';
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function formatGaRows(rows, dimensions, metrics) {
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

function formatGscRows(rows, dimensions) {
  return (rows || []).map((row) => {
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

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function weightedPosition(rows) {
  const impressions = sum(rows, 'impressions');
  if (!impressions) return 0;
  return rows.reduce((total, row) => total + Number(row.position || 0) * Number(row.impressions || 0), 0) / impressions;
}

function pct(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function num(value, digits = 0) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(digits) : String(value || '');
}

function duration(seconds) {
  const value = Number(seconds || 0);
  if (!value) return '0s';
  if (value < 60) return `${value.toFixed(1)}s`;
  return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
}

function engagementRate(row) {
  const sessions = Number(row.sessions || 0);
  if (!sessions) return 0;
  return Number(row.engagedSessions || 0) / sessions;
}

function rowForPath(rows, pathName, dimension) {
  return rows.find((row) => normalizePath(row[dimension]) === normalizePath(pathName));
}

function csvRow(page, gsc, gaPage, gaLanding) {
  return {
    path: page.path,
    label: page.label,
    locale: page.locale,
    group: page.group,
    gscClicks: gsc.clicks || 0,
    gscImpressions: gsc.impressions || 0,
    gscCtr: gsc.ctr || 0,
    gscPosition: gsc.position || 0,
    gaPageViews: gaPage.screenPageViews || 0,
    gaActiveUsers: gaPage.activeUsers || 0,
    gaSessions: gaPage.sessions || 0,
    gaEngagedSessions: gaPage.engagedSessions || 0,
    gaEngagementRate: engagementRate(gaPage),
    gaAverageSessionDuration: gaPage.averageSessionDuration || 0,
    gaLandingSessions: gaLanding.sessions || 0,
    gaLandingActiveUsers: gaLanding.activeUsers || 0,
    gaLandingEngagedSessions: gaLanding.engagedSessions || 0
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderMarkdown({ pages, summaryRows, queryRowsByPath, totals, startDate, endDate }) {
  const byLocale = new Map();
  for (const row of summaryRows) {
    const bucket = byLocale.get(row.locale) || [];
    bucket.push(row);
    byLocale.set(row.locale, bucket);
  }

  const lines = [
    `# Recent Page Monitor - ${endDate}`,
    '',
    `Date range: ${startDate} to ${endDate}`,
    '',
    '## Summary',
    '',
    markdownTable(
      ['Metric', 'Value'],
      [
        ['Pages tracked', String(pages.length)],
        ['GSC clicks', num(totals.gscClicks)],
        ['GSC impressions', num(totals.gscImpressions)],
        ['GSC CTR', pct(totals.gscCtr)],
        ['GSC avg position', totals.gscPosition ? num(totals.gscPosition, 2) : '0'],
        ['GA page views', num(totals.gaPageViews)],
        ['GA active users', num(totals.gaActiveUsers)],
        ['GA sessions', num(totals.gaSessions)],
        ['GA engagement rate', pct(totals.gaEngagementRate)]
      ]
    ),
    '',
    '## Page Performance',
    '',
    markdownTable(
      ['Page', 'Locale', 'GSC Clicks', 'Impressions', 'CTR', 'Position', 'GA PV', 'Users', 'Sessions', 'Engaged', 'Eng. Rate', 'Avg Session'],
      summaryRows.map((row) => [
        row.path,
        row.locale || '',
        num(row.gscClicks),
        num(row.gscImpressions),
        pct(row.gscCtr),
        row.gscPosition ? num(row.gscPosition, 2) : '0',
        num(row.gaPageViews),
        num(row.gaActiveUsers),
        num(row.gaSessions),
        num(row.gaEngagedSessions),
        pct(row.gaEngagementRate),
        duration(row.gaAverageSessionDuration)
      ])
    )
  ];

  for (const [locale, rows] of byLocale) {
    lines.push('', `## ${locale || 'unknown'} Pages`, '');
    lines.push(markdownTable(
      ['Page', 'Impressions', 'Clicks', 'GA PV'],
      rows.map((row) => [row.path, num(row.gscImpressions), num(row.gscClicks), num(row.gaPageViews)])
    ));
  }

  lines.push('', '## Top GSC Queries By Page');
  for (const page of pages) {
    const queries = queryRowsByPath[page.path] || [];
    lines.push('', `### ${page.path}`);
    if (!queries.length) {
      lines.push('', 'No visible queries in this date range.');
      continue;
    }
    lines.push('', markdownTable(
      ['Query', 'Clicks', 'Impressions', 'CTR', 'Position'],
      queries.map((row) => [
        row.query,
        num(row.clicks),
        num(row.impressions),
        pct(row.ctr),
        row.position ? num(row.position, 2) : '0'
      ])
    ));
  }

  lines.push(
    '',
    '## Reading Notes',
    '',
    '- GSC data is delayed. New pages may show GA activity before Search Console impressions appear.',
    '- GSC query rows are privacy-filtered, so query totals may not equal page totals.',
    '- GA page metrics include all traffic sources. Use GSC metrics for organic Google search visibility.'
  );

  return `${lines.join('\n')}\n`;
}

async function queryGsc({ token, site, body }) {
  const response = await fetch(`${GSC_ROOT}/sites/${sitePath(site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GSC request failed: ${JSON.stringify(data)}`);
  return data.rows || [];
}

async function queryGa({ token, property, body }) {
  const response = await fetch(`${GA_ROOT}/properties/${property}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GA request failed: ${JSON.stringify(data)}`);
  return data.rows || [];
}

async function loadPages(args) {
  if (args['page-file']) {
    const rows = JSON.parse(await fs.readFile(args['page-file'], 'utf8'));
    return rows.map((row) => ({
      path: normalizePath(row.path || row.url),
      label: row.label || normalizePath(row.path || row.url),
      locale: row.locale || '',
      group: row.group || 'custom'
    }));
  }
  if (args.pages) {
    return args.pages.split(',').map((item) => {
      const pathName = normalizePath(item.trim());
      return { path: pathName, label: pathName, locale: '', group: 'custom' };
    });
  }
  return DEFAULT_PAGES;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const credentialsPath = args.credentials || DEFAULT_CREDENTIALS;
  const credentials = await readCredentials(credentialsPath);
  const site = args.site || DEFAULT_SITE;
  const property = args['ga-property'] || process.env.GA4_PROPERTY_ID || DEFAULT_GA_PROPERTY;
  const origin = args.origin || DEFAULT_ORIGIN;
  const topQueryLimit = Number(args['top-queries'] || 5);
  const { startDate, endDate } = resolveDates(args, { lagDays: 3, spanDays: 28 });
  const outDir = args['out-dir'] || path.join('reports', 'recent-pages', endDate);
  const pages = await loadPages(args);
  const pageSet = new Set(pages.map((page) => normalizePath(page.path)));

  const [gscToken, gaToken] = await Promise.all([
    getAccessToken({
      args: { ...args, auth: args.auth || 'oauth', token: args['gsc-token'] },
      credentials,
      scope: GSC_SCOPE,
      tokenPath: DEFAULT_GSC_TOKEN,
      label: 'Google Search Console'
    }),
    getAccessToken({
      args: { ...args, auth: args.auth || 'oauth', token: args['ga-token'] },
      credentials,
      scope: GA_SCOPE,
      tokenPath: DEFAULT_GA_TOKEN,
      label: 'Google Analytics'
    })
  ]);

  const gscPageRows = formatGscRows(await queryGsc({
    token: gscToken,
    site,
    body: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 25000,
      type: 'web'
    }
  }), ['page']).filter((row) => pageSet.has(normalizePath(row.page)));

  const gaPageRows = formatGaRows(await queryGa({
    token: gaToken,
    property,
    body: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: ['screenPageViews', 'activeUsers', 'sessions', 'engagedSessions', 'averageSessionDuration', 'eventCount'].map((name) => ({ name })),
      limit: '10000',
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
    }
  }), ['pagePath'], ['screenPageViews', 'activeUsers', 'sessions', 'engagedSessions', 'averageSessionDuration', 'eventCount'])
    .filter((row) => pageSet.has(normalizePath(row.pagePath)));

  const gaLandingRows = formatGaRows(await queryGa({
    token: gaToken,
    property,
    body: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: ['sessions', 'activeUsers', 'engagedSessions', 'averageSessionDuration', 'conversions'].map((name) => ({ name })),
      limit: '10000',
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    }
  }), ['landingPagePlusQueryString'], ['sessions', 'activeUsers', 'engagedSessions', 'averageSessionDuration', 'conversions'])
    .filter((row) => pageSet.has(normalizePath(row.landingPagePlusQueryString.split('?')[0])));

  const queryRowsByPath = {};
  for (const page of pages) {
    const rows = formatGscRows(await queryGsc({
      token: gscToken,
      site,
      body: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: topQueryLimit,
        type: 'web',
        dimensionFilterGroups: [{
          groupType: 'and',
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: pageUrl(origin, page.path)
          }]
        }]
      }
    }), ['query']);
    queryRowsByPath[page.path] = rows;
  }

  const summaryRows = pages.map((page) => {
    const gsc = rowForPath(gscPageRows, page.path, 'page') || {};
    const gaPage = rowForPath(gaPageRows, page.path, 'pagePath') || {};
    const gaLanding = rowForPath(gaLandingRows, page.path, 'landingPagePlusQueryString') || {};
    return csvRow(page, gsc, gaPage, gaLanding);
  });

  const totals = {
    gscClicks: sum(summaryRows, 'gscClicks'),
    gscImpressions: sum(summaryRows, 'gscImpressions'),
    gscCtr: sum(summaryRows, 'gscImpressions') ? sum(summaryRows, 'gscClicks') / sum(summaryRows, 'gscImpressions') : 0,
    gscPosition: weightedPosition(summaryRows.map((row) => ({
      impressions: row.gscImpressions,
      position: row.gscPosition
    }))),
    gaPageViews: sum(summaryRows, 'gaPageViews'),
    gaActiveUsers: sum(summaryRows, 'gaActiveUsers'),
    gaSessions: sum(summaryRows, 'gaSessions'),
    gaEngagedSessions: sum(summaryRows, 'gaEngagedSessions'),
    gaEngagementRate: sum(summaryRows, 'gaSessions') ? sum(summaryRows, 'gaEngagedSessions') / sum(summaryRows, 'gaSessions') : 0
  };

  await fs.mkdir(outDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    startDate,
    endDate,
    site,
    property,
    pages,
    totals,
    summaryRows,
    queryRowsByPath
  };
  const jsonPath = path.join(outDir, `recent-pages_${startDate}_${endDate}.json`);
  const csvPath = path.join(outDir, `recent-pages_${startDate}_${endDate}.csv`);
  const mdPath = path.join(outDir, `recent-pages_${startDate}_${endDate}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(csvPath, toCsv(summaryRows));
  await fs.writeFile(mdPath, renderMarkdown({ pages, summaryRows, queryRowsByPath, totals, startDate, endDate }));

  console.log(`Tracked ${pages.length} pages from ${startDate} to ${endDate}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${csvPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
