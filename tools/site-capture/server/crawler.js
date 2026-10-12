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
const SKIP_WORDS = /(logout|log-out|logoff|signout|sign-out|exit|add-to-cart|addtocart|remove|delete|wp-admin|wp-login|\/cdn-cgi\/)/i;

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

/* ---------------------------------------------------------------------------
   Template detection: pages built from the same layout (every category page,
   every product page...) get the same fingerprint, so only the first one is
   photographed. The fingerprint combines the page's building blocks (tag +
   cleaned class names inside <main>) with coarse features (filters, form
   fields, long text).
   ------------------------------------------------------------------------- */
async function fingerprint(page) {
  return page.evaluate(() => {
    const clean = (c) => String(c || '').toLowerCase()
      .replace(/[_-]{1,2}[a-z0-9]{5,}$/g, '')   // css-module / styled hashes
      .replace(/\d+/g, '')
      .replace(/[^a-z_-]/g, '')
      .slice(0, 30);
    const root = document.querySelector('main, [role="main"], #main, #content') || document.body;
    const tokens = new Set();
    const walk = (el, depth) => {
      if (depth > 4) return;
      for (const child of el.children) {
        const r = child.getBoundingClientRect();
        if (r.height < 24 || r.width < 40) continue;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'].includes(child.tagName)) continue;
        const cls = typeof child.className === 'string' ? child.className.trim().split(/\s+/)[0] : '';
        tokens.add(child.tagName.toLowerCase() + '.' + clean(cls) + '@' + depth);
        walk(child, depth + 1);
      }
    };
    walk(root, 0);

    // Coarse page-kind signals; the layout tokens above do most of the work.
    // (Price counts and buy buttons were tried and dropped: a 2-result search or an
    // out-of-stock product would wrongly look like a new page type.)
    const checkboxes = root.querySelectorAll('input[type="checkbox"], input[type="radio"]').length;
    const fields = [...root.querySelectorAll('input, select, textarea')]
      .filter((el) => !['hidden', 'checkbox', 'radio'].includes(el.type)).length;
    const prose = [...root.querySelectorAll('p')].reduce((n, p) => n + (p.textContent || '').trim().length, 0);
    const fieldKind = fields === 0 ? 0 : fields <= 3 ? 1 : 2;    // none / search box / real form
    const features = [checkboxes > 3 ? 1 : 0, fieldKind, prose > 1500 ? 1 : 0].join('|');
    return { tokens: [...tokens], features };
  });
}

function similarity(a, b) {
  const A = new Set(a);
  let inter = 0;
  for (const t of b) if (A.has(t)) inter += 1;
  const union = A.size + b.length - inter;
  return union ? inter / union : 1;
}

function sameTemplate(fp, templates, threshold) {
  for (const t of templates) {
    if (t.features === fp.features && similarity(t.tokens, fp.tokens) >= threshold) return t;
  }
  return null;
}

export async function capture(options, emit = () => {}) {
  const opts = {
    maxPages: 40,          // pages actually photographed
    maxVisits: 150,        // pages opened in total (including skipped duplicates)
    perPattern: 3,         // URL-level cap per pattern, before opening a page
    maxDepth: 4,
    viewports: ['desktop', 'mobile'],
    keepQuery: false,
    sliceHeight: 2000,
    delay: 800,
    format: 'jpeg',
    quality: 80,
    saveHtml: true,
    dedupe: true,          // skip pages whose layout matches one already captured
    threshold: 0.7,
    seeds: [],             // extra start URLs (e.g. user-panel pages)
    ...options
  };
  const start = new URL(opts.url);
  const origin = start.origin;
  const outDir = path.resolve(opts.outDir, start.hostname);
  await fs.mkdir(outDir, { recursive: true });

  const authFile = path.join(outDir, 'auth.json');
  const hasAuth = opts.useAuth && await fs.access(authFile).then(() => true, () => false);

  // Panel pages the user opened while recording the login are crawled first
  let seeds = [...opts.seeds];
  if (hasAuth) {
    const visited = await fs.readFile(path.join(outDir, 'visited.json'), 'utf8').then(JSON.parse, () => []);
    seeds = [...seeds, ...visited];
  }

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

  const queue = [];
  const seen = new Set();
  const enqueue = (u, depth, forced) => {
    if (!u || seen.has(u.href)) return;
    seen.add(u.href);
    const item = { url: u, depth, forced };
    if (forced) queue.unshift(item); else queue.push(item);
  };
  // Seeds keep their query string: panel pages often need it
  for (const s of seeds.reverse()) enqueue(normalise(s, origin, true), 0, true);
  enqueue(normalise(start.href, origin, true), 0, true);

  const patternCount = {};
  const templates = [];
  const manifest = { site: origin, startedAt: new Date().toISOString(), options: { ...opts, url: undefined, signal: undefined }, pages: [], skipped: [] };
  let index = 0;
  let visits = 0;
  emit({ type: 'start', outDir, auth: hasAuth, seeds: seeds.length });

  const harvestLinks = async (page, depth) => {
    if (depth >= opts.maxDepth) return;
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const href of links) enqueue(normalise(href, origin, opts.keepQuery), depth + 1, false);
  };

  try {
    while (queue.length && index < opts.maxPages && visits < opts.maxVisits) {
      if (opts.signal?.aborted) { emit({ type: 'log', message: 'متوقف شد' }); break; }
      const { url, depth, forced } = queue.shift();
      const pattern = patternOf(url);
      patternCount[pattern] = (patternCount[pattern] || 0) + 1;
      if (!forced && patternCount[pattern] > opts.perPattern) continue;

      visits += 1;
      const first = opts.viewports[0];
      const page = await contexts[first].newPage();
      let entry = null;
      try {
        const res = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
        // A panel page that bounced to the login screen is not worth a photo
        const finalUrl = new URL(page.url());
        if (finalUrl.origin !== origin) throw new Error('redirected off-site to ' + finalUrl.origin);

        const fp = await fingerprint(page);
        const match = opts.dedupe ? sameTemplate(fp, templates, opts.threshold) : null;
        if (match && !(forced && hasAuth)) {
          manifest.skipped.push({ url: url.href, sameAs: match.index });
          emit({ type: 'skip', url: url.href, sameAs: match.index, slug: match.slug });
          await harvestLinks(page, depth);
          continue;
        }

        index += 1;
        const slug = slugFor(index, url);
        const dir = path.join(outDir, 'pages', slug);
        await fs.mkdir(dir, { recursive: true });
        templates.push({ ...fp, index, slug });
        entry = { index, url: url.href, finalUrl: page.url(), status: res ? res.status() : null, pattern, slug, shots: {}, error: null };
        emit({ type: 'page', index, url: url.href, pattern, queued: queue.length });

        await autoScroll(page);
        await page.waitForTimeout(600);
        entry.shots[first] = await shoot(page, dir, first, opts);
        emit({ type: 'shot', index, viewport: first, files: entry.shots[first].files.map((f) => path.join('pages', slug, f)), height: entry.shots[first].height });
        entry.notes = await pageNotes(page);
        if (opts.saveHtml) await fs.writeFile(path.join(dir, 'page.html'), await page.content(), 'utf8');
        await harvestLinks(page, depth);

        for (const vp of opts.viewports.slice(1)) {
          const p2 = await contexts[vp].newPage();
          try {
            await p2.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await p2.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
            await autoScroll(p2);
            await p2.waitForTimeout(600);
            entry.shots[vp] = await shoot(p2, dir, vp, opts);
            emit({ type: 'shot', index, viewport: vp, files: entry.shots[vp].files.map((f) => path.join('pages', slug, f)), height: entry.shots[vp].height });
          } catch (err) {
            emit({ type: 'error', index, url: url.href, viewport: vp, message: String(err.message || err).split('\n')[0] });
          } finally {
            await p2.close();
          }
        }
      } catch (err) {
        const message = String(err.message || err).split('\n')[0];
        if (entry) entry.error = message;
        emit({ type: 'error', index: entry ? entry.index : null, url: url.href, viewport: first, message });
      } finally {
        await page.close();
      }
      if (entry) {
        manifest.pages.push(entry);
        await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
      }
      await sleep(opts.delay);
    }
  } finally {
    await browser.close();
  }

  manifest.finishedAt = new Date().toISOString();
  manifest.visits = visits;
  manifest.patterns = patternCount;
  manifest.unvisited = queue.length;
  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  emit({ type: 'done', outDir, pages: manifest.pages.length, skipped: manifest.skipped.length });
  return manifest;
}

/* Opens a visible browser so the user can sign in by hand and then open the
   user-panel pages they want photographed. The session (auth.json) and every
   same-site page they visited (visited.json) are saved for the next capture. */
export async function recordLogin(url, outRoot, emit = () => {}, drive = null) {
  const u = new URL(url);
  const outDir = path.resolve(outRoot, u.hostname);
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: false, executablePath: process.env.CHROMIUM_PATH || undefined });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'fa-IR' });
  const authFile = path.join(outDir, 'auth.json');
  const visitedFile = path.join(outDir, 'visited.json');
  const visited = new Set();

  const track = (p) => p.on('framenavigated', (frame) => {
    if (frame !== p.mainFrame()) return;
    const v = normalise(frame.url(), u.origin, true);
    if (v && !visited.has(v.href)) {
      visited.add(v.href);
      emit({ type: 'visited', url: v.href });
      fs.writeFile(visitedFile, JSON.stringify([...visited], null, 2), 'utf8').catch(() => {});
    }
  });
  context.on('page', track);

  const page = await context.newPage();
  await page.goto(u.href);
  emit({ type: 'log', message: 'وارد حساب شوید، صفحه‌های پنل کاربری (سفارش‌ها، آدرس‌ها، پروفایل…) را یکی‌یکی باز کنید و بعد پنجره را ببندید.' });

  // Save the session every 2s, so closing the window any way keeps the login
  const timer = setInterval(() => { context.storageState({ path: authFile }).catch(() => {}); }, 2000);
  const closed = new Promise((resolve) => { browser.on('disconnected', resolve); context.on('close', resolve); page.on('close', resolve); });
  if (drive) { await drive(page); await context.storageState({ path: authFile }); await page.close(); }
  await closed;
  clearInterval(timer);
  await context.storageState({ path: authFile }).catch(() => {});
  await browser.close().catch(() => {});
  // The landing page itself is captured anyway; keep only pages beyond it
  const list = [...visited].filter((v) => v !== normalise(u.href, u.origin, true).href);
  await fs.writeFile(visitedFile, JSON.stringify(list, null, 2), 'utf8');
  emit({ type: 'log', message: `ورود ذخیره شد و ${list.length} صفحه برای عکس‌برداری با حساب کاربری ثبت شد.` });
  return list;
}
