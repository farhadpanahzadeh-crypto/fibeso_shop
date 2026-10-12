/* Crawls a site (same origin only) and saves desktop + mobile screenshots of
   every page type. Shared by the web server (server/index.js) and the CLI (cli.js). */
import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

/* Paths sent to the UI / stored in the manifest always use '/', also on Windows */
const rel = (slug, file) => path.posix.join('pages', slug, file);

const VIEWPORTS = {
  // A normal desktop Chrome user agent: the headless default says "HeadlessChrome"
  // and some sites (bot protection) refuse or challenge it.
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: devices['Desktop Chrome'].userAgent },
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

// Bot-protection screens: generic words only count in the title, strong markers anywhere
const CHALLENGE_TITLE = /(just a moment|checking your browser|attention required|verify you are human|captcha|arvancloud|ddos|در حال بررسی|لطفا صبر کنید|لطفاً صبر کنید)/i;
const CHALLENGE_BODY = /(checking your browser|verify you are human|arvancloud|ddos-guard|cf-challenge|captcha)/i;

/* Open a URL robustly: two attempts, wait for the network to settle and for
   bot-protection / "checking your browser" screens to pass (up to 30s). */
async function openPage(page, url, emit) {
  let res = null;
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      emit({ type: 'log', message: `بارگذاری ${url} ناموفق بود (تلاش ${attempt} از ۲)` });
    }
  }
  if (lastErr) throw lastErr;
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  for (let i = 0; i < 30; i++) {
    const blocked = await page.evaluate(([t, b]) => new RegExp(t, 'i').test(document.title) ||
      new RegExp(b, 'i').test(document.body ? document.body.innerText.slice(0, 600) : ''), [CHALLENGE_TITLE.source, CHALLENGE_BODY.source]).catch(() => false);
    if (!blocked) break;
    if (i === 0) emit({ type: 'log', message: 'سایت در حال بررسی مرورگر است؛ صبر می‌کنم…' });
    if (i === 29) { emit({ type: 'log', message: 'صفحه بررسی امنیتی رد نشد؛ اگر عکس‌ها صفحه بررسی را نشان می‌دهند، «نمایش مرورگر» را روشن کنید.' }); break; }
    await sleep(1000);
  }
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  return res;
}

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

const readJSON = (file, fallback) => fs.readFile(file, 'utf8').then(JSON.parse, () => fallback);
const MAX_LINKS_KEPT = 400;

/* Capture memory: every run reads captures/<host>/manifest.json from the previous
   run and continues from it. Pages and page templates already photographed are
   not photographed again, the crawl resumes from the saved queue (or from the
   links recorded on earlier pages), and only views that are still missing (for
   example mobile after a desktop-only run) are added. opts.fresh starts over. */
export async function capture(options, emit = () => {}) {
  const opts = {
    maxPages: 40,          // NEW pages photographed in this run
    maxVisits: 150,        // pages opened in this run (including skipped duplicates)
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
    fresh: false,          // ignore (and delete) the previous captures of this site
    ...options
  };
  const start = new URL(opts.url);
  const origin = start.origin;
  const outDir = path.resolve(opts.outDir, start.hostname);
  const manifestFile = path.join(outDir, 'manifest.json');
  await fs.mkdir(outDir, { recursive: true });

  if (opts.fresh) {
    await fs.rm(path.join(outDir, 'pages'), { recursive: true, force: true });
    await fs.rm(manifestFile, { force: true });
  }
  const prev = await readJSON(manifestFile, null);

  const authFile = path.join(outDir, 'auth.json');
  const hasAuth = opts.useAuth && await fs.access(authFile).then(() => true, () => false);

  // Panel pages the user opened while recording the login are crawled first
  let seeds = [...opts.seeds];
  if (hasAuth) seeds = [...seeds, ...await readJSON(path.join(outDir, 'visited.json'), [])];

  /* ---------- Restore memory ---------- */
  const manifest = prev || { site: origin, pages: [], skipped: [] };
  manifest.site = origin;
  manifest.pages = manifest.pages || [];
  manifest.skipped = manifest.skipped || [];
  manifest.runs = manifest.runs || [];
  const run = { startedAt: new Date().toISOString(), options: { ...opts, url: undefined, signal: undefined, seeds: seeds.length }, captured: 0, skipped: 0, filled: 0, failed: 0 };
  // Pages that failed to load last time are retried first
  const retry = manifest.failed || [];
  manifest.failed = [];
  manifest.runs.push(run);

  const templates = manifest.pages.filter((p) => p.fingerprint).map((p) => ({ ...p.fingerprint, index: p.index, slug: p.slug }));
  const captured = new Set(manifest.pages.map((p) => p.url));
  const seen = new Set([...captured, ...manifest.skipped.map((s) => s.url)]);
  const patternCount = {};
  for (const u of seen) { try { const k = patternOf(new URL(u)); patternCount[k] = (patternCount[k] || 0) + 1; } catch { /* ignore */ } }
  let index = manifest.pages.reduce((m, p) => Math.max(m, p.index), 0);

  const queue = [];
  // Signed in: user-panel links jump the queue (still subject to template dedupe)
  const PANEL = /(profile|account|panel|dashboard|my-|\/my\b|orders?|address|wishlist|favou?rites?|wallet|tickets?|notifications?|user)/i;
  const enqueue = (u, depth, forced) => {
    if (!u || seen.has(u.href)) return;
    seen.add(u.href);
    const item = { url: u, depth, forced };
    if (forced || (hasAuth && PANEL.test(u.pathname))) queue.unshift(item); else queue.push(item);
  };
  // Seeds keep their query string: panel pages often need it
  for (const s of [...seeds].reverse()) enqueue(normalise(s, origin, true), 0, true);
  enqueue(normalise(start.href, origin, true), 0, true);
  for (const f of retry) { try { enqueue(new URL(f.url), f.depth || 0, !!f.forced); } catch { /* skip */ } }
  // Continue where the last run stopped...
  for (const q of manifest.pending || []) {
    let u = null;
    try { u = new URL(q.url); } catch { /* skip */ }
    enqueue(u, q.depth, !!q.forced);
  }
  // ...and follow links found on earlier pages that were never opened (this also
  // brings back pages whose capture was deleted from the list)
  for (const p of [...manifest.pages, ...manifest.skipped]) {
    for (const href of p.links || []) enqueue(normalise(href, origin, opts.keepQuery), (p.depth || 0) + 1, false);
  }

  emit({
    type: 'start', outDir, auth: hasAuth, seeds: seeds.length,
    resumed: !!prev, previous: manifest.pages.map((p) => ({ index: p.index, url: p.url, pattern: p.pattern, slug: p.slug, shots: Object.fromEntries(Object.entries(p.shots || {}).map(([vp, sh]) => [vp, { files: sh.files.map((f) => rel(p.slug, f)), height: sh.height }])) })),
    previousSkipped: manifest.skipped.length, queued: queue.length
  });

  const save = async () => {
    manifest.pending = queue.map((q) => ({ url: q.url.href, depth: q.depth, forced: q.forced || undefined }));
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: !opts.headed, executablePath: process.env.CHROMIUM_PATH || undefined });
  } catch (err) {
    const msg = String(err.message || err);
    throw new Error(/Executable doesn't exist|browserType.launch/i.test(msg)
      ? 'مرورگر Chromium نصب نیست. یک بار دستور npx playwright install chromium را اجرا کنید.'
      : msg.split('\n')[0]);
  }
  const contexts = {};
  for (const vp of opts.viewports) {
    contexts[vp] = await browser.newContext({
      ...VIEWPORTS[vp],
      locale: 'fa-IR',
      ignoreHTTPSErrors: true,
      ...(hasAuth ? { storageState: authFile } : {})
    });
  }

  const harvestLinks = async (page, depth) => {
    const raw = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    const kept = [];
    for (const href of raw) {
      const u = normalise(href, origin, opts.keepQuery);
      if (!u) continue;
      if (kept.length < MAX_LINKS_KEPT && !kept.includes(u.href)) kept.push(u.href);
      if (depth < opts.maxDepth) enqueue(u, depth + 1, false);
    }
    return kept;
  };

  const shootViewport = async (vp, entry, dir) => {
    const p2 = await contexts[vp].newPage();
    try {
      await openPage(p2, entry.url, emit);
      await autoScroll(p2);
      await p2.waitForTimeout(600);
      entry.shots[vp] = await shoot(p2, dir, vp, opts);
      emit({ type: 'shot', index: entry.index, viewport: vp, files: entry.shots[vp].files.map((f) => rel(entry.slug, f)), height: entry.shots[vp].height });
      return true;
    } catch (err) {
      emit({ type: 'error', index: entry.index, url: entry.url, viewport: vp, message: String(err.message || err).split('\n')[0] });
      return false;
    } finally {
      await p2.close();
    }
  };

  let visits = 0;
  let fresh = 0;
  try {
    /* ---------- 1. Complete earlier pages that miss a requested view ---------- */
    for (const entry of manifest.pages) {
      if (opts.signal?.aborted) break;
      entry.shots = entry.shots || {};
      const missing = opts.viewports.filter((vp) => !entry.shots[vp]);
      if (!missing.length) continue;
      emit({ type: 'fill', index: entry.index, url: entry.url, viewports: missing });
      const dir = path.join(outDir, 'pages', entry.slug);
      await fs.mkdir(dir, { recursive: true });
      for (const vp of missing) if (await shootViewport(vp, entry, dir)) run.filled += 1;
      await save();
    }

    /* ---------- 2. Discover and capture new page types ---------- */
    while (queue.length && fresh < opts.maxPages && visits < opts.maxVisits) {
      if (opts.signal?.aborted) { emit({ type: 'log', message: 'متوقف شد؛ دفعه بعد از همین‌جا ادامه می‌دهد.' }); break; }
      const { url, depth, forced } = queue.shift();
      const pattern = patternOf(url);
      patternCount[pattern] = (patternCount[pattern] || 0) + 1;
      if (!forced && patternCount[pattern] > opts.perPattern) continue;

      visits += 1;
      const first = opts.viewports[0];
      const page = await contexts[first].newPage();
      let entry = null;
      try {
        emit({ type: 'visit', url: url.href, queued: queue.length });
        const res = await openPage(page, url.href, emit);
        const finalUrl = new URL(page.url());
        if (finalUrl.origin !== origin) throw new Error('redirected off-site to ' + finalUrl.origin);

        const fp = await fingerprint(page);
        const match = opts.dedupe ? sameTemplate(fp, templates, opts.threshold) : null;
        if (match && !(forced && hasAuth)) {
          const links = await harvestLinks(page, depth);
          manifest.skipped.push({ url: url.href, sameAs: match.index, depth, links });
          run.skipped += 1;
          emit({ type: 'skip', url: url.href, sameAs: match.index, slug: match.slug });
          continue;
        }

        index += 1;
        fresh += 1;
        const slug = slugFor(index, url);
        const dir = path.join(outDir, 'pages', slug);
        await fs.mkdir(dir, { recursive: true });
        templates.push({ ...fp, index, slug });
        entry = { index, url: url.href, finalUrl: page.url(), status: res ? res.status() : null, pattern, slug, depth, capturedAt: new Date().toISOString(), shots: {}, error: null, fingerprint: fp };
        captured.add(url.href);
        emit({ type: 'page', index, url: url.href, pattern, queued: queue.length });

        await autoScroll(page);
        await page.waitForTimeout(600);
        entry.shots[first] = await shoot(page, dir, first, opts);
        emit({ type: 'shot', index, viewport: first, files: entry.shots[first].files.map((f) => rel(slug, f)), height: entry.shots[first].height });
        entry.notes = await pageNotes(page);
        if (opts.saveHtml) await fs.writeFile(path.join(dir, 'page.html'), await page.content(), 'utf8');
        entry.links = await harvestLinks(page, depth);

        for (const vp of opts.viewports.slice(1)) await shootViewport(vp, entry, dir);
      } catch (err) {
        const message = String(err.message || err).split('\n')[0];
        if (entry) entry.error = message;
        else { manifest.failed.push({ url: url.href, depth, forced: forced || undefined, error: message }); run.failed += 1; }
        emit({ type: 'error', index: entry ? entry.index : null, url: url.href, viewport: opts.viewports[0], message });
      } finally {
        await page.close();
      }
      if (entry) { manifest.pages.push(entry); run.captured += 1; }
      await save();
      await sleep(opts.delay);
    }
  } finally {
    await browser.close();
  }

  run.finishedAt = new Date().toISOString();
  run.visits = visits;
  await save();
  if (!run.captured && !run.filled) {
    emit({ type: 'log', message: run.failed
      ? `${run.failed} صفحه باز نشد (خطاها بالا آمده‌اند). اتصال اینترنت و باز شدن سایت در مرورگر را بررسی کنید، یا «نمایش مرورگر» را روشن کنید؛ این صفحه‌ها دفعه بعد دوباره امتحان می‌شوند.`
      : manifest.pages.length
        ? 'صفحه جدیدی پیدا نشد؛ همه نوع صفحه‌ها قبلاً گرفته شده‌اند. برای گرفتن دوباره، تیک «از اول» را بزنید یا صفحه‌ای را حذف کنید.'
        : 'هیچ صفحه‌ای گرفته نشد.' });
  }
  emit({
    type: 'done', outDir,
    pages: run.captured, skipped: run.skipped, filled: run.filled, failed: run.failed,
    total: manifest.pages.length, pending: queue.length
  });
  return manifest;
}

/* Opens a visible browser on the site so the user can sign in by hand.
   The tool watches for the session: as soon as a session-like cookie or
   storage entry appears AND the browser has left the login screen, it saves
   the session (auth.json), closes the window and returns, so the capture can
   start signed in. Closing the window by hand also works. Every same-site page
   visited meanwhile is saved to visited.json and captured first. */
const SESSION_KEY = /(sess|token|auth|jwt|sid|login|user|account|customer)/i;
const LOGIN_URL = /(login|log-in|signin|sign-in|signup|register|auth|otp|verify|password)/i;

function sessionSignal(state) {
  const cookies = (state.cookies || []).filter((c) => SESSION_KEY.test(c.name)).map((c) => c.name + '=' + c.value);
  const storage = (state.origins || []).flatMap((o) => (o.localStorage || []).filter((e) => SESSION_KEY.test(e.name)).map((e) => e.name + '=' + e.value));
  return [...cookies, ...storage].sort().join('|');
}

export async function recordLogin(url, outRoot, emit = () => {}, drive = null, { autoReturn = true, signal = null } = {}) {
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
    if (v && !visited.has(v.href) && !LOGIN_URL.test(v.pathname)) {
      visited.add(v.href);
      emit({ type: 'visited', url: v.href });
      fs.writeFile(visitedFile, JSON.stringify([...visited], null, 2), 'utf8').catch(() => {});
    }
  });
  context.on('page', track);
  if (signal) signal.addEventListener('abort', () => browser.close().catch(() => {}), { once: true });

  const page = await context.newPage();
  await page.goto(u.href, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  const baseline = sessionSignal(await context.storageState());
  emit({ type: 'login-open', message: autoReturn
    ? 'در پنجره باز شده وارد حساب شوید. بعد از ورود، ابزار خودش جلسه را ذخیره می‌کند و برمی‌گردد.'
    : 'وارد حساب شوید، صفحه‌های پنل را باز کنید و بعد پنجره را ببندید.' });

  let loggedIn = false;
  let finished = false;
  const closed = new Promise((resolve) => { browser.on('disconnected', resolve); context.on('close', resolve); page.on('close', resolve); });

  // Watch for a new session every 1.5s; also keeps auth.json fresh
  const watcher = (async () => {
    while (!finished) {
      await sleep(1500);
      if (finished) break;
      let state;
      try { state = await context.storageState({ path: authFile }); } catch { break; }
      const pages = context.pages();
      const current = pages.length ? pages[pages.length - 1].url() : '';
      const sig = sessionSignal(state);
      if (!loggedIn && sig && sig !== baseline && !LOGIN_URL.test(current)) {
        loggedIn = true;
        emit({ type: 'login-detected', message: 'ورود شناسایی شد.' });
        if (autoReturn) {
          await sleep(2500); // let the site finish its post-login redirect
          await context.storageState({ path: authFile }).catch(() => {});
          await browser.close().catch(() => {});
          break;
        }
      }
    }
  })();

  if (drive) await drive(page);
  await closed;
  finished = true;
  await watcher;
  await context.storageState({ path: authFile }).catch(() => {});
  await browser.close().catch(() => {});
  if (signal?.aborted) return { visited: [], loggedIn: false, saved: false };

  const list = [...visited].filter((v) => v !== normalise(u.href, u.origin, true).href);
  await fs.writeFile(visitedFile, JSON.stringify(list, null, 2), 'utf8');
  const saved = await fs.access(authFile).then(() => true, () => false);
  emit({ type: 'login-saved', loggedIn, pages: list.length, message: loggedIn
    ? `جلسه ورود ذخیره شد${list.length ? ` و ${list.length} صفحه پنل ثبت شد` : ''}.`
    : 'پنجره بسته شد ولی ورود شناسایی نشد؛ اگر وارد شده بودید، جلسه باز هم ذخیره شده است.' });
  return { visited: list, loggedIn, saved };
}

/* Removes one captured page: its folder (ignored if already gone) and its entry in
   manifest.json, plus the duplicates that were skipped because of it, so a later
   run may capture that page type again. */
export async function deletePage(outRoot, host, index) {
  if (!/^[a-z0-9.-]+$/i.test(host)) throw new Error('invalid host');
  const outDir = path.resolve(outRoot, host);
  const manifestFile = path.join(outDir, 'manifest.json');
  const manifest = await readJSON(manifestFile, null);
  if (!manifest) return { removed: false };
  const entry = (manifest.pages || []).find((p) => p.index === Number(index));
  if (!entry) return { removed: false };
  if (/^[a-z0-9-]+$/i.test(entry.slug)) {
    await fs.rm(path.join(outDir, 'pages', entry.slug), { recursive: true, force: true });
  }
  manifest.pages = manifest.pages.filter((p) => p !== entry);
  manifest.skipped = (manifest.skipped || []).filter((s) => s.sameAs !== entry.index);
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  return { removed: true, slug: entry.slug };
}
