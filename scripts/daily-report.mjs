#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken, parseArgs, readCredentials, toDateString } from './google-auth.mjs';

const rootDir = path.normalize(path.join(fileURLToPath(import.meta.url), '..', '..'));
const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GA_ROOT = 'https://analyticsdata.googleapis.com/v1beta';
const GSC_ROOT = 'https://www.googleapis.com/webmasters/v3';

const DEFAULT_SITE = 'sc-domain:mojimoon.com';
const DEFAULT_GA_PROPERTY = '503343497';
const TOOL_GROUPS = [
  { id: 'emoji-combinations', label: '絵文字組み合わせ', prefixes: ['/emoji-combinations/'] },
  { id: 'special-characters', label: '特殊文字', prefixes: ['/special-characters/'] },
  { id: 'emoji-copy', label: '絵文字コピペ', prefixes: ['/emoji-copy/'] },
  { id: 'kaomoji', label: '顔文字', prefixes: ['/kaomoji/'] },
  { id: 'english', label: 'English pages', exact: ['/index_en.html', '/guide_en.html', '/artemis_en.html'] },
  { id: 'moon', label: '月文字', exact: ['/', '/index.html', '/line_input.html', '/line.html'] },
  { id: 'beads', label: 'Beads subdomain', contains: ['beads.mojimoon.com'] }
];
const COUNTRY_CODE_TO_NAME = {
  jpn: 'Japan',
  usa: 'United States',
  chn: 'China',
  kor: 'South Korea',
  twn: 'Taiwan',
  ind: 'India',
  phl: 'Philippines',
  pak: 'Pakistan',
  aus: 'Australia',
  can: 'Canada',
  gbr: 'United Kingdom',
  deu: 'Germany',
  fra: 'France',
  bra: 'Brazil',
  mex: 'Mexico'
};

function printHelp() {
  console.log(`Daily Mojimoon report

Usage:
  npm run daily:report
  npm run daily:report -- --send

Options:
  --ga-property <id>           GA4 property id. Default: env GA4_PROPERTY_ID or 503343497
  --site <property>            GSC property. Default: env GSC_SITE or sc-domain:mojimoon.com
  --credentials <path>         Local OAuth client JSON. Default: .secrets/google-oauth-client.json
  --ga-token <path>            Local GA OAuth token JSON. Default: .secrets/google-analytics-token.json
  --gsc-token <path>           Local GSC OAuth token JSON. Default: .secrets/google-oauth-token.json
  --send                       Send email through AgentMail
  --out-dir <path>             Default: reports/daily

Vercel env:
  GOOGLE_OAUTH_CLIENT_JSON     OAuth desktop/client JSON string
  GOOGLE_GA_TOKEN_JSON         GA OAuth token JSON string
  GOOGLE_GSC_TOKEN_JSON        GSC OAuth token JSON string
  AGENTMAIL_API_KEY            AgentMail API key
  AGENTMAIL_INBOX_ID           AgentMail inbox id or inbox email address
  REPORT_EMAIL_TO              Recipient email
  CRON_SECRET                  Optional bearer secret for /api/daily-report
`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function makeDate(daysAgo) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return toDateString(date);
}

function pct(value) {
  if (!Number.isFinite(value)) return '-';
  return `${(value * 100).toFixed(1)}%`;
}

function num(value, digits = 0) {
  const number = Number(value || 0);
  return number.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

function duration(seconds) {
  const value = Number(seconds || 0);
  if (!value) return '0s';
  if (value < 60) return `${value.toFixed(0)}s`;
  return `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`;
}

function delta(current, previous, digits = 1) {
  const a = Number(current || 0);
  const b = Number(previous || 0);
  if (!b) return a ? '+new' : '0.0%';
  const change = (a - b) / b;
  const sign = change > 0 ? '+' : '';
  return `${sign}${(change * 100).toFixed(digits)}%`;
}

function safeJson(value, label) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function cleanSecretValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[A-Z0-9_]+=/i.test(trimmed)) return trimmed.split('=').slice(1).join('=').trim();
  if (/^[A-Z0-9_]+:/i.test(trimmed)) return trimmed.split(':').slice(1).join(':').trim();
  return trimmed.replace(/^Bearer\s+/i, '').trim();
}

async function readOptionalSecretFile(filePath) {
  try {
    return cleanSecretValue(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function credentialsFromEnvOrFile(args, label) {
  if (process.env.GOOGLE_OAUTH_CLIENT_JSON) {
    return safeJson(process.env.GOOGLE_OAUTH_CLIENT_JSON, 'GOOGLE_OAUTH_CLIENT_JSON');
  }
  const credentialsPath = args.credentials || path.join('.secrets', 'google-oauth-client.json');
  return readCredentials(credentialsPath);
}

async function tokenFileFromEnvOrFile({ envKey, fallbackPath }) {
  if (process.env[envKey]) {
    const tokenPath = path.join('/tmp', `${envKey.toLowerCase()}.json`);
    await fs.writeFile(tokenPath, `${process.env[envKey]}\n`, { mode: 0o600 });
    return tokenPath;
  }
  return fallbackPath;
}

async function tokenFor({ args, credentials, scope, envTokenKey, tokenPath, label }) {
  const resolvedTokenPath = await tokenFileFromEnvOrFile({
    envKey: envTokenKey,
    fallbackPath: tokenPath
  });
  return getAccessToken({
    args: { ...args, auth: args.auth || 'oauth', token: resolvedTokenPath },
    credentials,
    scope,
    tokenPath: resolvedTokenPath,
    label
  });
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

async function runGaReport({ token, property, startDate, endDate, dimensions, metrics, limit = 1000 }) {
  const response = await fetch(`${GA_ROOT}/properties/${property}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit: String(limit),
      orderBys: [{ metric: { metricName: metrics[0] }, desc: true }]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GA Data API request failed: ${JSON.stringify(data)}`);
  return formatGaRows(data.rows || [], dimensions, metrics);
}

function sitePath(siteUrl) {
  return encodeURIComponent(siteUrl);
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

async function runGscReport({ token, site, startDate, endDate, dimensions, rowLimit = 1000 }) {
  const response = await fetch(`${GSC_ROOT}/sites/${sitePath(site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
      type: 'web'
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`GSC request failed: ${JSON.stringify(data)}`);
  return formatGscRows(data.rows || [], dimensions);
}

function compactDate(date) {
  return String(date || '').replace(/-/g, '');
}

function rowByDate(rows, date) {
  const target = compactDate(date);
  return rows.find((row) => compactDate(row.date) === target) || {};
}

function sum(rows, metric) {
  return rows.reduce((total, row) => total + Number(row[metric] || 0), 0);
}

function weightedPosition(rows) {
  const impressions = sum(rows, 'impressions');
  if (!impressions) return 0;
  return rows.reduce((total, row) => total + Number(row.position || 0) * Number(row.impressions || 0), 0) / impressions;
}

function normalizePath(value) {
  if (!value) return '';
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function groupForPage(pagePath) {
  const target = normalizePath(pagePath);
  const source = String(pagePath || '');
  return TOOL_GROUPS.find((group) => {
    if (group.exact?.includes(target)) return true;
    if (group.prefixes?.some((prefix) => target.startsWith(prefix))) return true;
    if (group.contains?.some((needle) => source.includes(needle))) return true;
    return false;
  }) || {
    id: 'other',
    label: 'Other',
    prefixes: []
  };
}

function toolDistribution(pageRows) {
  const groups = new Map();
  for (const row of pageRows) {
    const group = groupForPage(row.pagePath);
    const current = groups.get(group.id) || {
      tool: group.label,
      screenPageViews: 0,
      activeUsers: 0,
      sessions: 0,
      averageSessionDuration: 0,
      durationWeight: 0
    };
    current.screenPageViews += Number(row.screenPageViews || 0);
    current.activeUsers += Number(row.activeUsers || 0);
    current.sessions += Number(row.sessions || 0);
    current.averageSessionDuration += Number(row.averageSessionDuration || 0) * Number(row.sessions || 0);
    current.durationWeight += Number(row.sessions || 0);
    groups.set(group.id, current);
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      averageSessionDuration: row.durationWeight ? row.averageSessionDuration / row.durationWeight : 0
    }))
    .sort((a, b) => b.screenPageViews - a.screenPageViews);
}

function topRows(rows, metric, limit = 10) {
  return [...rows].sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0)).slice(0, limit);
}

function sourceText(row) {
  return `${row.sessionDefaultChannelGroup || ''} ${row.sessionSourceMedium || ''}`.toLowerCase();
}

function isGoogleSource(row) {
  return sourceText(row).includes('google');
}

function isGoogleOrganicSource(row) {
  const text = sourceText(row);
  return text.includes('organic') && text.includes('google');
}

function markdownTable(headers, rows) {
  const table = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`
  ];
  for (const row of rows) table.push(`| ${row.join(' | ')} |`);
  return table.join('\n');
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function changeClass(value) {
  const text = String(value || '');
  if (text.startsWith('+')) return 'positive';
  if (text.startsWith('-')) return 'negative';
  return 'neutral';
}

function htmlTable(headers, rows) {
  return `
    <table class="report-table">
      <thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell, index) => {
          const cls = index > 0 && /%$/.test(String(cell)) ? ` class="${changeClass(cell)}"` : '';
          return `<td${cls}>${htmlEscape(cell)}</td>`;
        }).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;
}

function buildReportParts(data) {
  const {
    gaDate,
    gaPrevDate,
    gaWeekDate,
    gscDate,
    gscPrevDate,
    gscWeekDate,
    gaDaily,
    gaPages,
    gaSources,
    gaCountries,
    gscQueries,
    gscSources,
    gscCountries,
    gscDaily
  } = data;
  const current = rowByDate(gaDaily, gaDate);
  const prev = rowByDate(gaDaily, gaPrevDate);
  const week = rowByDate(gaDaily, gaWeekDate);
  const seoCurrent = rowByDate(gscDaily, gscDate);
  const seoPrev = rowByDate(gscDaily, gscPrevDate);
  const seoWeek = rowByDate(gscDaily, gscWeekDate);
  const tools = toolDistribution(gaPages);
  const totalToolPv = Math.max(1, sum(tools, 'screenPageViews'));
  const totalSourceSessions = Math.max(1, sum(gaSources, 'sessions'));
  const gaGoogleSources = gaSources.filter(isGoogleSource);
  const gaGoogleOrganicSources = gaSources.filter(isGoogleOrganicSource);
  const gscTotalClicks = Number(seoCurrent.clicks || 0);
  const visibleQueryClicks = sum(gscQueries, 'clicks');
  const hiddenQueryClicks = Math.max(0, gscTotalClicks - visibleQueryClicks);
  const queryCoverage = gscTotalClicks ? visibleQueryClicks / gscTotalClicks : 0;

  return {
    gaDate,
    gscDate,
    summary: [
      { label: 'UV', value: num(current.activeUsers), dod: delta(current.activeUsers, prev.activeUsers), wow: delta(current.activeUsers, week.activeUsers) },
      { label: 'PV', value: num(current.screenPageViews), dod: delta(current.screenPageViews, prev.screenPageViews), wow: delta(current.screenPageViews, week.screenPageViews) },
      { label: 'Sessions', value: num(current.sessions), dod: delta(current.sessions, prev.sessions), wow: delta(current.sessions, week.sessions) },
      { label: '平均时长', value: duration(current.averageSessionDuration), dod: delta(current.averageSessionDuration, prev.averageSessionDuration), wow: delta(current.averageSessionDuration, week.averageSessionDuration) }
    ],
    coreRows: [
      ['UV / Active Users', num(current.activeUsers), delta(current.activeUsers, prev.activeUsers), delta(current.activeUsers, week.activeUsers)],
      ['PV / Page Views', num(current.screenPageViews), delta(current.screenPageViews, prev.screenPageViews), delta(current.screenPageViews, week.screenPageViews)],
      ['Sessions', num(current.sessions), delta(current.sessions, prev.sessions), delta(current.sessions, week.sessions)],
      ['平均时长', duration(current.averageSessionDuration), delta(current.averageSessionDuration, prev.averageSessionDuration), delta(current.averageSessionDuration, week.averageSessionDuration)]
    ],
    toolRows: tools.slice(0, 8).map((row) => [
      row.tool,
      num(row.screenPageViews),
      num(row.activeUsers),
      num(row.sessions),
      pct(row.screenPageViews / totalToolPv),
      duration(row.averageSessionDuration)
    ]),
    seoRows: [
      ['Clicks', num(seoCurrent.clicks), delta(seoCurrent.clicks, seoPrev.clicks), delta(seoCurrent.clicks, seoWeek.clicks)],
      ['Impressions', num(seoCurrent.impressions), delta(seoCurrent.impressions, seoPrev.impressions), delta(seoCurrent.impressions, seoWeek.impressions)],
      ['CTR', pct(seoCurrent.ctr || 0), delta(seoCurrent.ctr, seoPrev.ctr), delta(seoCurrent.ctr, seoWeek.ctr)],
      ['Avg position', num(seoCurrent.position, 2), delta(seoPrev.position, seoCurrent.position), delta(seoWeek.position, seoCurrent.position)]
    ],
    googleSearchRows: [
      ['GA Google Organic UV', num(sum(gaGoogleOrganicSources, 'activeUsers')), '到站用户数', `GA ${gaDate}`],
      ['GA Google Organic Sessions', num(sum(gaGoogleOrganicSources, 'sessions')), '到站会话数', `GA ${gaDate}`],
      ['GA All Google UV', num(sum(gaGoogleSources, 'activeUsers')), '包含 Google 相关来源，不等同自然搜索', `GA ${gaDate}`],
      ['GSC Total Clicks', num(gscTotalClicks), 'Google 搜索结果点击总量', `GSC ${gscDate}`],
      ['Visible Query Clicks', num(visibleQueryClicks), '当前可见关键词点击汇总', `GSC ${gscDate}`],
      ['Hidden / Filtered Clicks', num(hiddenQueryClicks), 'GSC 未展示的低频或隐私过滤查询', `GSC ${gscDate}`],
      ['Visible Query Coverage', pct(queryCoverage), '可见关键词点击 / GSC 总点击', `GSC ${gscDate}`]
    ],
    keywordRows: topRows(gscQueries, 'impressions', 12).map((row) => [
      row.query || '(not set)',
      num(row.clicks),
      num(row.impressions),
      pct(row.ctr),
      num(row.position, 2)
    ]),
    sourceRows: topRows(gaSources, 'sessions', 10).map((row) => [
      `${row.sessionDefaultChannelGroup} / ${row.sessionSourceMedium}`,
      num(row.sessions),
      num(row.activeUsers),
      num(row.screenPageViews),
      pct(row.sessions / totalSourceSessions)
    ]),
    searchAppearanceRows: gscSources.length ? topRows(gscSources, 'impressions', 8).map((row) => [
      row.searchAppearance || '(default)',
      num(row.clicks),
      num(row.impressions),
      pct(row.ctr),
      num(row.position, 2)
    ]) : [['暂无 searchAppearance 数据', '-', '-', '-', '-']],
    countryRows: topRows(gaCountries, 'activeUsers', 12).map((row) => {
      const seo = gscCountries.find((item) => (COUNTRY_CODE_TO_NAME[item.country] || item.country) === row.country) || {};
      return [
        row.country,
        num(row.activeUsers),
        num(row.sessions),
        num(row.screenPageViews),
        num(seo.clicks),
        num(seo.impressions)
      ];
    }),
    seoCountryRows: topRows(gscCountries, 'impressions', 12).map((row) => [
      COUNTRY_CODE_TO_NAME[row.country] || row.country,
      num(row.clicks),
      num(row.impressions),
      pct(row.ctr),
      num(row.position, 2)
    ])
  };
}

function buildHtmlReport(data) {
  const parts = buildReportParts(data);
  const cards = parts.summary.map((item) => `
    <td class="metric-card">
      <div class="metric-label">${htmlEscape(item.label)}</div>
      <div class="metric-value">${htmlEscape(item.value)}</div>
      <div class="metric-delta"><span class="${changeClass(item.dod)}">日 ${htmlEscape(item.dod)}</span><span class="${changeClass(item.wow)}">周 ${htmlEscape(item.wow)}</span></div>
    </td>
  `).join('');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f5f7fb; color:#172033; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; }
    .wrap { max-width:920px; margin:0 auto; padding:24px 14px; }
    .header { background:#111827; color:#fff; border-radius:14px; padding:22px 24px; }
    .header h1 { margin:0; font-size:24px; letter-spacing:0; }
    .header p { margin:8px 0 0; color:#cbd5e1; font-size:14px; }
    .metric-grid { width:100%; border-spacing:10px; margin:16px -10px 8px; }
    .metric-card { background:#fff; border:1px solid #e5eaf3; border-radius:12px; padding:14px; width:25%; vertical-align:top; }
    .metric-label { color:#657083; font-size:12px; font-weight:700; text-transform:uppercase; }
    .metric-value { margin-top:5px; font-size:26px; font-weight:800; color:#111827; }
    .metric-delta { margin-top:8px; display:flex; gap:8px; font-size:12px; font-weight:700; }
    .section { background:#fff; border:1px solid #e5eaf3; border-radius:12px; margin-top:16px; padding:18px; }
    .section h2 { margin:0 0 12px; font-size:18px; color:#111827; }
    .note { color:#657083; font-size:13px; line-height:1.6; margin:0 0 12px; }
    .report-table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; overflow:hidden; border:1px solid #e5eaf3; border-radius:10px; }
    .report-table th { background:#f1f5fb; color:#3f4a5f; text-align:left; padding:9px 10px; border-bottom:1px solid #e5eaf3; white-space:nowrap; }
    .report-table td { padding:9px 10px; border-bottom:1px solid #eef2f7; color:#172033; vertical-align:top; }
    .report-table tr:last-child td { border-bottom:0; }
    .report-table tr:nth-child(even) td { background:#fafcff; }
    .positive { color:#059669 !important; font-weight:800; }
    .negative { color:#dc2626 !important; font-weight:800; }
    .neutral { color:#657083 !important; font-weight:700; }
    .footer { color:#657083; font-size:12px; line-height:1.6; padding:14px 2px 0; }
    @media (max-width: 640px) {
      .metric-grid, .metric-grid tbody, .metric-grid tr, .metric-card { display:block; width:auto; }
      .report-table { font-size:12px; }
      .report-table th, .report-table td { padding:8px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>MojiMoon 日报 ${htmlEscape(parts.gaDate)}</h1>
      <p>用户数据：GA ${htmlEscape(parts.gaDate)}；SEO 数据：GSC ${htmlEscape(parts.gscDate)}，因 Search Console 有延迟。</p>
    </div>
    <table class="metric-grid"><tr>${cards}</tr></table>
    <div class="section"><h2>核心用户数据</h2>${htmlTable(['指标', parts.gaDate, '环比', '同比'], parts.coreRows)}</div>
    <div class="section"><h2>不同工具分布</h2>${htmlTable(['工具', 'PV', 'UV', 'Sessions', 'PV占比', '平均时长'], parts.toolRows)}</div>
    <div class="section"><h2>SEO 总览</h2><p class="note">GSC 最新可用日：${htmlEscape(parts.gscDate)}。</p>${htmlTable(['指标', parts.gscDate, '环比', '同比'], parts.seoRows)}</div>
    <div class="section"><h2>Google 搜索口径对照</h2><p class="note">GA 看实际到站用户，GSC 看搜索结果点击；分关键词明细会被 Search Console 隐藏一部分长尾查询，所以不应与 Google 来源 UV 直接相加对比。</p>${htmlTable(['指标', '数值', '说明', '日期'], parts.googleSearchRows)}</div>
    <div class="section"><h2>SEO 分关键词</h2>${htmlTable(['关键词', 'Clicks', 'Impressions', 'CTR', 'Position'], parts.keywordRows)}</div>
    <div class="section"><h2>分 Refer / 来源</h2>${htmlTable(['来源', 'Sessions', 'UV', 'PV', '占比'], parts.sourceRows)}</div>
    <div class="section"><h2>SEO 分搜索外观/来源</h2>${htmlTable(['Search appearance', 'Clicks', 'Impressions', 'CTR', 'Position'], parts.searchAppearanceRows)}</div>
    <div class="section"><h2>分地域</h2>${htmlTable(['国家/地区', 'GA UV', 'GA Sessions', 'GA PV', 'GSC Clicks', 'GSC Impressions'], parts.countryRows)}</div>
    <div class="section"><h2>SEO 地域明细</h2>${htmlTable(['国家/地区', 'Clicks', 'Impressions', 'CTR', 'Position'], parts.seoCountryRows)}</div>
    <div class="footer">今日观察：优先关注高曝光低 CTR 的关键词，以及工具页 PV/UV 占比变化。如果某个工具页曝光上涨但 GA 入口没有同步上涨，下一步应优化 title、meta、首屏文案和内部链接。</div>
  </div>
</body>
</html>`;
}

function buildReport(data) {
  const parts = buildReportParts(data);

  return `# MojiMoon 日报 ${parts.gaDate}

## 核心用户数据
${markdownTable(
    ['指标', parts.gaDate, '环比', '同比'],
    parts.coreRows
  )}

## 不同工具分布
${markdownTable(
    ['工具', 'PV', 'UV', 'Sessions', 'PV占比', '平均时长'],
    parts.toolRows
  )}

## SEO 总览
GSC 最新可用日：${parts.gscDate}。Search Console 通常有延迟，所以 SEO 数据会比 GA 用户数据晚几天。

${markdownTable(
    ['指标', parts.gscDate, '环比', '同比'],
    parts.seoRows
  )}

## Google 搜索口径对照
GA 看实际到站用户，GSC 看搜索结果点击；分关键词明细会被 Search Console 隐藏一部分长尾查询，所以不应与 Google 来源 UV 直接相加对比。

${markdownTable(
    ['指标', '数值', '说明', '日期'],
    parts.googleSearchRows
  )}

## SEO 分关键词
${markdownTable(
    ['关键词', 'Clicks', 'Impressions', 'CTR', 'Position'],
    parts.keywordRows
  )}

## 分 Refer / 来源
${markdownTable(
    ['来源', 'Sessions', 'UV', 'PV', '占比'],
    parts.sourceRows
  )}

## SEO 分搜索外观/来源
${markdownTable(
    ['Search appearance', 'Clicks', 'Impressions', 'CTR', 'Position'],
    parts.searchAppearanceRows
  )}

## 分地域
${markdownTable(
    ['国家/地区', 'GA UV', 'GA Sessions', 'GA PV', 'GSC Clicks', 'GSC Impressions'],
    parts.countryRows
  )}

### SEO 地域明细
${markdownTable(
    ['国家/地区', 'Clicks', 'Impressions', 'CTR', 'Position'],
    parts.seoCountryRows
  )}

## 今日观察
- 用户侧以 GA 的 ${parts.gaDate} 为准，SEO 侧以 GSC 的 ${parts.gscDate} 为准。
- 优先关注高曝光低 CTR 的关键词，以及工具页 PV/UV 占比变化。
- 如果某个工具页曝光上涨但 GA 入口没有同步上涨，下一步应优先优化 title、meta、首屏文案和内部链接。
`;
}

async function sendEmail({ subject, markdown, html }) {
  const apiKey = cleanSecretValue(process.env.AGENTMAIL_API_KEY) || await readOptionalSecretFile(path.join(rootDir, '.secret'));
  const inboxId = process.env.AGENTMAIL_INBOX_ID;
  const to = process.env.REPORT_EMAIL_TO;
  if (!apiKey || !inboxId || !to) {
    throw new Error('Missing AGENTMAIL_API_KEY, AGENTMAIL_INBOX_ID, or REPORT_EMAIL_TO.');
  }
  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: to.split(',').map((item) => item.trim()).filter(Boolean),
      subject,
      text: markdown,
      html,
      labels: ['mojimoon-daily-report']
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Email send failed: ${JSON.stringify(data)}`);
  return data;
}

export async function generateDailyReport(options = {}) {
  const args = options.args || {};
  const credentials = options.credentials || await credentialsFromEnvOrFile(args);
  const property = args['ga-property'] || process.env.GA4_PROPERTY_ID || DEFAULT_GA_PROPERTY;
  const site = args.site || process.env.GSC_SITE || DEFAULT_SITE;
  const gaToken = options.gaToken || await tokenFor({
    args,
    credentials,
    scope: GA_SCOPE,
    envTokenKey: 'GOOGLE_GA_TOKEN_JSON',
    tokenPath: args['ga-token'] || path.join('.secrets', 'google-analytics-token.json'),
    label: 'Google Analytics'
  });
  const gscToken = options.gscToken || await tokenFor({
    args,
    credentials,
    scope: GSC_SCOPE,
    envTokenKey: 'GOOGLE_GSC_TOKEN_JSON',
    tokenPath: args['gsc-token'] || path.join('.secrets', 'google-oauth-token.json'),
    label: 'Google Search Console'
  });

  const gaDate = args.date || makeDate(1);
  const gaPrevDate = toDateString(addDays(new Date(`${gaDate}T00:00:00Z`), -1));
  const gaWeekDate = toDateString(addDays(new Date(`${gaDate}T00:00:00Z`), -7));
  const gscDate = args['gsc-date'] || makeDate(3);
  const gscPrevDate = toDateString(addDays(new Date(`${gscDate}T00:00:00Z`), -1));
  const gscWeekDate = toDateString(addDays(new Date(`${gscDate}T00:00:00Z`), -7));

  const [gaDaily, gaPages, gaSources, gaCountries, gscDaily, gscQueries, gscSources, gscCountries] = await Promise.all([
    runGaReport({
      token: gaToken,
      property,
      startDate: gaWeekDate,
      endDate: gaDate,
      dimensions: ['date'],
      metrics: ['activeUsers', 'screenPageViews', 'sessions', 'averageSessionDuration']
    }),
    runGaReport({
      token: gaToken,
      property,
      startDate: gaDate,
      endDate: gaDate,
      dimensions: ['pagePath'],
      metrics: ['screenPageViews', 'activeUsers', 'sessions', 'averageSessionDuration'],
      limit: 200
    }),
    runGaReport({
      token: gaToken,
      property,
      startDate: gaDate,
      endDate: gaDate,
      dimensions: ['sessionDefaultChannelGroup', 'sessionSourceMedium'],
      metrics: ['sessions', 'activeUsers', 'screenPageViews'],
      limit: 100
    }),
    runGaReport({
      token: gaToken,
      property,
      startDate: gaDate,
      endDate: gaDate,
      dimensions: ['country'],
      metrics: ['activeUsers', 'sessions', 'screenPageViews'],
      limit: 100
    }),
    runGscReport({
      token: gscToken,
      site,
      startDate: gscWeekDate,
      endDate: gscDate,
      dimensions: ['date'],
      rowLimit: 20
    }),
    runGscReport({
      token: gscToken,
      site,
      startDate: gscDate,
      endDate: gscDate,
      dimensions: ['query'],
      rowLimit: 200
    }),
    runGscReport({
      token: gscToken,
      site,
      startDate: gscDate,
      endDate: gscDate,
      dimensions: ['searchAppearance'],
      rowLimit: 50
    }).catch(() => []),
    runGscReport({
      token: gscToken,
      site,
      startDate: gscDate,
      endDate: gscDate,
      dimensions: ['country'],
      rowLimit: 100
    })
  ]);

  const markdown = buildReport({
    gaDate,
    gaPrevDate,
    gaWeekDate,
    gscDate,
    gscPrevDate,
    gscWeekDate,
    gaDaily,
    gaPages,
    gaSources,
    gaCountries,
    gscDaily,
    gscQueries,
    gscSources,
    gscCountries
  });
  const subject = `MojiMoon 日报 ${gaDate}`;
  const html = buildHtmlReport({
    gaDate,
    gaPrevDate,
    gaWeekDate,
    gscDate,
    gscPrevDate,
    gscWeekDate,
    gaDaily,
    gaPages,
    gaSources,
    gaCountries,
    gscDaily,
    gscQueries,
    gscSources,
    gscCountries
  });
  return { subject, markdown, html };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const report = await generateDailyReport({ args });
  const outDir = args['out-dir'] || path.join(rootDir, 'reports', 'daily');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${report.subject.replace(/[^0-9-]/g, '') || makeDate(1)}.md`);
  await fs.writeFile(outPath, `${report.markdown}\n`);
  console.log(report.markdown);
  console.log(`Wrote ${outPath}`);
  if (args.send) {
    const result = await sendEmail(report);
    console.log(`Sent email: ${JSON.stringify(result)}`);
  }
}

if (process.argv[1] && path.normalize(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
