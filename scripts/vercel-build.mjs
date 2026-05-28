#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.normalize(path.join(fileURLToPath(import.meta.url), '..', '..'));
const outDir = path.join(rootDir, 'dist');

const skipNames = new Set([
  '.git',
  '.github',
  '.idea',
  '.secret',
  '.secrets',
  '.vercel',
  '_content',
  'api',
  'dist',
  'docs',
  'node_modules',
  'package-lock.json',
  'package.json',
  'README.md',
  'reports',
  'scripts',
  'tsconfig.json',
  'vercel.json'
]);

async function copyStatic() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipNames.has(entry.name)) continue;
    if (entry.name.startsWith('.') || entry.name.endsWith('.local')) continue;
    const source = path.join(rootDir, entry.name);
    const target = path.join(outDir, entry.name);
    await fs.cp(source, target, { recursive: true });
  }
}

copyStatic()
  .then(() => console.log(`Static site copied to ${path.relative(rootDir, outDir)}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
