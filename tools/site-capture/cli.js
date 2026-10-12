#!/usr/bin/env node
/* Command-line capture, no UI needed:
     node cli.js https://example.com --max 60 --mobile-only --png
     node cli.js https://example.com --login      (sign in, open your panel pages, close the window)
     node cli.js https://example.com --auth       (captures those panel pages signed in, then the rest)
     node cli.js https://example.com --seed https://example.com/profile/orders --seed ... */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { capture, recordLogin } from './server/crawler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const seeds = args.flatMap((a, i) => (a === '--seed' && args[i + 1] ? [args[i + 1]] : []));
const url = args.find((a, i) => /^https?:\/\//.test(a) && args[i - 1] !== '--seed');
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : fallback;
};

if (!url) {
  console.log('Usage: node cli.js <https://site> [--max 40] [--visits 150] [--per-pattern 3] [--depth 4] [--slice 2000]\n' +
    '                    [--desktop-only | --mobile-only] [--png] [--keep-query] [--no-dedupe]\n' +
    '                    [--seed <url> ...] [--login] [--auth]');
  process.exit(1);
}

const outDir = path.resolve(process.env.CAPTURE_DIR || path.join(here, 'captures'));

if (flag('--login')) {
  await recordLogin(url, outDir, (e) => console.log(e.message));
  process.exit(0);
}

const viewports = flag('--desktop-only') ? ['desktop'] : flag('--mobile-only') ? ['mobile'] : ['desktop', 'mobile'];
await capture({
  url,
  outDir,
  maxPages: value('--max', 40),
  maxVisits: value('--visits', 150),
  perPattern: value('--per-pattern', 3),
  dedupe: !flag('--no-dedupe'),
  seeds,
  maxDepth: value('--depth', 4),
  sliceHeight: value('--slice', 2000),
  delay: value('--delay', 800),
  viewports,
  keepQuery: flag('--keep-query'),
  format: flag('--png') ? 'png' : 'jpeg',
  useAuth: flag('--auth')
}, (e) => {
  if (e.type === 'start') console.log(`saving to ${e.outDir}${e.auth ? ' (signed in, ' + e.seeds + ' panel pages)' : ''}`);
  if (e.type === 'page') console.log(`[${e.index}] ${e.url}  (${e.pattern})`);
  if (e.type === 'shot') console.log(`    ${e.viewport}: ${e.files.length} file(s), ${e.height}px tall`);
  if (e.type === 'skip') console.log(`    - skipped ${e.url} (same layout as #${e.sameAs})`);
  if (e.type === 'visited') console.log(`    + ${e.url}`);
  if (e.type === 'log') console.log(e.message);
  if (e.type === 'error') console.log(`    ! ${e.viewport}: ${e.message}`);
  if (e.type === 'done') console.log(`done: ${e.pages} pages captured, ${e.skipped} duplicates skipped -> ${e.outDir}`);
});
