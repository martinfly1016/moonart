#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { parseArgs } from './google-auth.mjs';

function printHelp() {
  console.log(`Combined GSC + GA report runner

Usage:
  node scripts/site-metrics.mjs --ga-property 123456789
  node scripts/site-metrics.mjs --ga-property 123456789 --page /kaomoji/

Options:
  --site <property>            GSC property. Default: sc-domain:mojimoon.com
  --ga-property <id>           GA4 property id, or set GA4_PROPERTY_ID
  --credentials <path>         OAuth desktop client JSON. Default: .secrets/google-oauth-client.json
  --start <YYYY-MM-DD>         Optional shared start date
  --end <YYYY-MM-DD>           Optional shared end date
  --days <number>              Optional shared lookback window
  --page <path>                Optional page filter for page-query and GA page-source reports
  --out-dir <path>             Base output dir. Default: reports/site-metrics/<end-or-latest>
`);
}

function runNodeScript(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

function compactArgs(items) {
  return items.filter((item) => item !== undefined && item !== null && item !== '');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    return;
  }

  const credentials = args.credentials || path.join('.secrets', 'google-oauth-client.json');
  const site = args.site || 'sc-domain:mojimoon.com';
  const gaProperty = args['ga-property'] || process.env.GA4_PROPERTY_ID;
  if (!gaProperty) throw new Error('Missing --ga-property <GA4_PROPERTY_ID> or GA4_PROPERTY_ID env var.');

  const endLabel = args.end || 'latest';
  const outBase = args['out-dir'] || path.join('reports', 'site-metrics', endLabel);
  const dateArgs = compactArgs([
    args.start ? '--start' : undefined,
    args.start,
    args.end ? '--end' : undefined,
    args.end,
    args.days ? '--days' : undefined,
    args.days
  ]);
  const pageArgs = compactArgs([
    args.page ? '--page' : undefined,
    args.page
  ]);

  const commonAuth = ['--auth', 'oauth', '--credentials', credentials];
  const jobs = [
    {
      script: 'scripts/gsc-report.mjs',
      args: compactArgs([...commonAuth, '--site', site, '--mode', 'queries', ...dateArgs, '--out-dir', path.join(outBase, 'gsc')])
    },
    {
      script: 'scripts/gsc-report.mjs',
      args: compactArgs([...commonAuth, '--site', site, '--mode', 'pages', ...dateArgs, '--out-dir', path.join(outBase, 'gsc')])
    },
    {
      script: 'scripts/gsc-report.mjs',
      args: compactArgs([...commonAuth, '--site', site, '--mode', 'pageQueries', ...dateArgs, ...pageArgs, '--out-dir', path.join(outBase, 'gsc')])
    },
    {
      script: 'scripts/ga-report.mjs',
      args: compactArgs([...commonAuth, '--property', gaProperty, '--mode', 'pages', ...dateArgs, '--out-dir', path.join(outBase, 'ga')])
    },
    {
      script: 'scripts/ga-report.mjs',
      args: compactArgs([...commonAuth, '--property', gaProperty, '--mode', 'sources', ...dateArgs, '--out-dir', path.join(outBase, 'ga')])
    },
    {
      script: 'scripts/ga-report.mjs',
      args: compactArgs([...commonAuth, '--property', gaProperty, '--mode', 'devices', ...dateArgs, '--out-dir', path.join(outBase, 'ga')])
    },
    {
      script: 'scripts/ga-report.mjs',
      args: compactArgs([...commonAuth, '--property', gaProperty, '--mode', 'pageSources', ...dateArgs, ...pageArgs, '--out-dir', path.join(outBase, 'ga')])
    }
  ];

  for (const job of jobs) {
    await runNodeScript(job.script, job.args);
  }
  console.log(`Combined reports written under ${outBase}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
