/* Crawls a site (same origin only) and saves desktop + mobile screenshots of
   every page type. Shared by the web server (server/index.js) and the CLI (cli.js). */
import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent
  }
};

const SKIP_EXT = /\.(pdf|zip|rar|jpe?g|png|gif|webp|svg|mp4|mp3|xml|json|txt|docx?|xlsx?|apk|exe)$/i;
const SKIP_WORDS = /(logout|log-out|signout|sign-out|add-to-cart|addtocart|remove|delete|wp-admin|wp-login|\/cdn-cgi\/)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Pages that only differ by an ID share a "pattern" (e.g. every product page).
   From the first segment that looks like an ID (3+ digits, a hash/UUID, or a very
   long slug), the rest of the path is collapsed. */
const ID_LIKE = /(\d{3,}|^[0-9a-f]{8,}$|^[0-9a-f-]{20,}$)/i;
export function patternOf(u) {
  const segs = decodeURIComponent(u.pathname).split('/').filter(Boolean);
  const out = [];
  for (const s of segs) {
    if (ID_LIKE.test(s) || s.length > 60) { out.push(':*'); break; }
    out.push(s);
  }
  return '/' + out.join('/');
}

function normalise(href, origin, keepQuery) {
  let u;
  try { u = new URL(href, origin); } catch { return null; }
  if (u.origin !== origin) return null;
  if (!/^https?:$/.test(u.protocol)) return null;
  u.hash = '';
  if (!keepQuery) u.search = '';
  if (SKIP_EXT.test(u.pathname) || SKIP_WORDS.test(u.pathname + u.search)) return null;
  u.pathname = u.pathname.replace(/\/index\.(html?|php|aspx?)$/i, '/');
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
  return u;
}

function slugFor(index, u) {
  const p = decodeURIComponent(u.pathname).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return String(index).padStart(3, '0') + '-' + (p || 'home');
}

/* Scroll through the page so lazy-loaded images and sections render. */
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
}

async function shoot(page, dir, name, opts) {
  const ext = opts.format === 'png' ? 'png' : 'jpg';
  const shotOpts = opts.format === 'png' ? { type: 'png' } : { type: 'jpeg', quality: opts.quality };
  const height = await page.evaluate(() => Math.min(document.documentElement.scrollHeight, 60000));
  const width = page.viewportSize().width;
  const files = [];
  // One full-page image when it is not absurdly tall...
  if (height <= 14000) {
    const f = `${name}-full.${ext}`;
    await page.screenshot({ path: path.join(dir, f), fullPage: true, ...shotOpts });
    files.push(f);
  }
  // ...and always readable slices, top to bottom.
  let part = 1;
  for (let y = 0; y < height; y += opts.sliceHeight) {
    const f = `${name}-part${String(part++).padStart(2, '0')}.${ext}`;
    await page.screenshot({
      path: path.join(dir, f), fullPage: true, ...shotOpts,
      clip: { x: 0, y, width, height: Math.min(opts.sliceHeight, height - y) }
    });
    files.push(f);
  }
  return { files, height };
}

/* Structure notes that make the screenshots easier to rebuild from. */
async function pageNotes(page) {
  return page.evaluate(() => {
    const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const cs = getComputedStyle(document.body);
    const sections = [...document.querySelectorAll('header, nav, main > *, section, footer')]
      .filter((el) => el.getBoundingClientRect().height > 40)
      .slice(0, 60)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : undefined,
        heading: txt(el.querySelector('h1, h2, h3') || { textContent: '' }) || undefined,
        top: Math.round(el.getBoundingClientRect().top + window.scrollY),
        height: Math.round(el.getBoundingClientRect().height)
      }));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir || cs.direction,
      font: cs.fontFamily,
      background: cs.backgroundColor,
      headings: [...document.querySelectorAll('h1, h2, h3')].slice(0, 80).map((h) => ({ level: h.tagName, text: txt(h) })),
      sections
    };
  });
}

export async function capture(options, emit = () => {}) {
  const opts = {
    maxPages: 40,
    perPattern: 2,
    maxDepth: 4,
    viewports: ['desktop', 'mobile'],
    keepQuery: false,
    sliceHeight: 2000,
    delay: 800,
    format: 'jpeg',
    quality: 80,
    saveHtml: true,
    ...options
  };
  const start = new URL(opts.url);
  const origin = start.origin;
  const outDir = path.resolve(opts.outDir, start.hostname);
  await fs.mkdir(outDir, { recursive: true });

  const authFile = path.join(outDir, 'auth.json');
  const hasAuth = opts.useAuth && await fs.access(authFile).then(() => true, () => false);

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const contexts = {};
  for (const vp of opts.viewports) {
    contexts[vp] = await browser.newContext({
      ...VIEWPORTS[vp],
      locale: 'fa-IR',
      ignoreHTTPSErrors: true,
      ...(hasAuth ? { storageState: authFile } : {})
    });
  }

  const queue = [{ url: normalise(start.href, origin, true), depth: 0 }];
  const seen = new Set([queue[0].url.href]);
  const patternCount = {};
  const manifest = { site: origin, startedAt: new Date().toISOString(), options: { ...opts, url: undefined }, pages: [] };
  let index = 0;
  emit({ type: 'start', outDir, auth: hasAuth });

  try {
    while (queue.length && index < opts.maxPages) {
      if (opts.signal?.aborted) { emit({ type: 'log', message: 'متوقف شد' }); break; }
      const { url, depth } = queue.shift();
      const pattern = patternOf(url);
      patternCount[pattern] = (patternCount[pattern] || 0) + 1;
      if (patternCount[pattern] > opts.perPattern && url.href !== start.href) continue;

      index += 1;
      const slug = slugFor(index, url);
      const dir = path.join(outDir, 'pages', slug);
      await fs.mkdir(dir, { recursive: true });
      const entry = { index, url: url.href, pattern, slug, shots: {}, error: null };
      emit({ type: 'page', index, url: url.href, pattern, queued: queue.length });

      for (const vp of opts.viewports) {
        const page = await contexts[vp].newPage();
        try {
          const res = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
          entry.status = res ? res.status() : null;
          await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
          await autoScroll(page);
          await page.waitForTimeout(600);
          const shot = await shoot(page, dir, vp, opts);
          entry.shots[vp] = shot;
          emit({ type: 'shot', index, viewport: vp, files: shot.files.map((f) => path.join('pages', slug, f)), height: shot.height });

          if (vp === opts.viewports[0]) {
            entry.notes = await pageNotes(page);
            if (opts.saveHtml) await fs.writeFile(path.join(dir, 'page.html'), await page.content(), 'utf8');
            if (depth < opts.maxDepth) {
              const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
              for (const href of links) {
                const u = normalise(href, origin, opts.keepQuery);
                if (u && !seen.has(u.href)) { seen.add(u.href); queue.push({ url: u, depth: depth + 1 }); }
              }
            }
          }
        } catch (err) {
          entry.error = String(err.message || err).split('\n')[0];
          emit({ type: 'error', index, url: url.href, viewport: vp, message: entry.error });
        } finally {
          await page.close();
        }
      }
      manifest.pages.push(entry);
      await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
      await sleep(opts.delay);
    }
  } finally {
    await browser.close();
  }

  manifest.finishedAt = new Date().toISOString();
  manifest.patterns = patternCount;
  manifest.skippedQueue = queue.length;
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  emit({ type: 'done', outDir, pages: manifest.pages.length });
  return manifest;
}

/* Opens a visible browser so the user can sign in by hand; when the window is
   closed the session is saved to auth.json and reused for logged-in pages. */
export async function recordLogin(url, outRoot, emit = () => {}) {
  const u = new URL(url);
  const outDir = path.resolve(outRoot, u.hostname);
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'fa-IR' });
  const page = await context.newPage();
  await page.goto(u.href);
  emit({ type: 'log', message: 'در پنجره باز شده وارد حساب شوید و سپس پنجره را ببندید.' });
  // Save the session every 2s while the window is open, so closing it any way keeps the login.
  const file = path.join(outDir, 'auth.json');
  const timer = setInterval(() => { context.storageState({ path: file }).catch(() => {}); }, 2000);
  await new Promise((resolve) => { page.on('close', resolve); browser.on('disconnected', resolve); });
  clearInterval(timer);
  await context.storageState({ path: file }).catch(() => {});
  await browser.close().catch(() => {});
  emit({ type: 'log', message: 'ورود ذخیره شد.' });
}
