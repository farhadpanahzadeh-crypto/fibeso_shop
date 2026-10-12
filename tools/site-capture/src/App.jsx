import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULTS = {
  url: '',
  maxPages: 40,
  perPattern: 3,
  dedupe: true,
  fresh: false,
  headed: false,
  seeds: '',
  loginUrl: '',
  maxDepth: 4,
  desktop: true,
  mobile: true,
  keepQuery: false,
  sliceHeight: 2000,
  delay: 800,
  format: 'jpeg',
  useAuth: false
};

const fa = (n) => Number(n).toLocaleString('fa-IR');

export default function App() {
  const [form, setForm] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('site-capture-form') || '{}') }; } catch { return DEFAULTS; }
  });
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [outRoot, setOutRoot] = useState('');
  const logEnd = useRef(null);
  const [saved, setSaved] = useState(null); // manifest.json of earlier runs for this site
  const [reload, setReload] = useState(0);   // bump to re-read manifest.json
  const [deleted, setDeleted] = useState(() => new Set()); // indexes removed in this session
  const [confirming, setConfirming] = useState(null);      // index awaiting a second click

  // Live progress from the local server (Server-Sent Events)
  useEffect(() => {
    fetch('/api/status').then((r) => r.json()).then((s) => { setRunning(s.running); setOutRoot(s.outRoot); }).catch(() => setError('سرور ابزار در حال اجرا نیست. دستور npm run dev را اجرا کنید.'));
    const es = new EventSource('/api/events');
    es.onmessage = (m) => {
      const e = JSON.parse(m.data);
      if (e.type === 'start') setEvents([e]);
      else setEvents((list) => [...list, e]);
      if (e.type === 'start') setRunning(true);
      if (e.type === 'done' || e.type === 'fatal') setRunning(false);
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('site-capture-form', JSON.stringify(form)); } catch { /* private mode */ }
  }, [form]);

  useEffect(() => { logEnd.current?.scrollIntoView({ block: 'nearest' }); }, [events]);

  const formHostEarly = (() => { try { return new URL(form.url).hostname; } catch { return ''; } })();
  useEffect(() => {
    if (!formHostEarly) { setSaved(null); return; }
    let cancelled = false;
    fetch(`/captures/${formHostEarly}/manifest.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => { if (!cancelled) setSaved(m); })
      .catch(() => { if (!cancelled) setSaved(null); });
    return () => { cancelled = true; };
  }, [formHostEarly, running, reload]);

  const pages = useMemo(() => {
    const map = new Map();
    // Earlier runs first (from disk, or from the start event of a resumed run)
    const startEv = [...events].reverse().find((e) => e.type === 'start');
    const previous = startEv ? startEv.previous || [] : (saved ? saved.pages.map((p) => ({
      index: p.index, url: p.url, pattern: p.pattern,
      shots: Object.fromEntries(Object.entries(p.shots || {}).map(([vp, sh]) => [vp, { files: sh.files.map((f) => `pages/${p.slug}/${f}`) }]))
    })) : []);
    for (const p of previous) map.set(p.index, { ...p, old: true, shots: { ...p.shots }, errors: [] });
    for (const e of events) {
      if (e.type === 'page') map.set(e.index, { ...e, shots: {}, errors: [] });
      if (e.type === 'fill' && map.has(e.index)) map.get(e.index).filling = e.viewports;
      if (e.type === 'shot' && map.has(e.index)) map.get(e.index).shots[e.viewport] = e;
      if (e.type === 'error' && map.has(e.index)) map.get(e.index).errors.push(e);
    }
    for (const i of deleted) map.delete(i);
    return [...map.values()];
  }, [events, saved, deleted]);

  const start = [...events].reverse().find((e) => e.type === 'start');
  const skipped = events.filter((e) => e.type === 'skip');
  const visited = events.filter((e) => e.type === 'visited');
  const logs = events.filter((e) => ['log', 'login-open', 'login-detected', 'login-saved'].includes(e.type));
  const generalErrors = events.filter((e) => e.type === 'error' && (e.index == null || !pages.some((p) => p.index === e.index)));
  const visiting = running ? [...events].reverse().find((e) => e.type === 'visit') : null;

  async function removePage(index) {
    if (confirming !== index) { setConfirming(index); return; }
    setConfirming(null);
    try {
      await post('/api/delete', { host, index });
      setDeleted((d) => new Set(d).add(index));
      setReload((n) => n + 1);
    } catch (err) { setError(err.message); }
  }
  const loginBusy = events.some((e) => e.type === 'login-open') && !events.some((e) => e.type === 'login-saved');
  const done = events.find((e) => e.type === 'done');
  const fatal = events.find((e) => e.type === 'fatal');
  const formHost = formHostEarly;
  // Image paths come from the folder the server actually wrote to, not the form field
  const host = start ? start.outDir.split(/[\\/]/).pop() : formHost;

  const set = (key) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
  };

  async function post(path, body) {
    setError('');
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'خطا در ارتباط با سرور');
    return data;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.desktop && !form.mobile) { setError('حداقل یکی از دسکتاپ یا موبایل را انتخاب کنید.'); return; }
    try {
      new URL(form.url);
    } catch { setError('آدرس کامل سایت را وارد کنید، مثلاً https://www.example.com'); return; }
    try {
      await post('/api/capture', {
        ...form,
        viewports: [form.desktop && 'desktop', form.mobile && 'mobile'].filter(Boolean)
      });
      setRunning(true);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="app">
      <header className="top">
        <h1>عکس‌برداری از صفحات سایت</h1>
        <p>آدرس سایت را بدهید؛ ابزار صفحه‌ها را پیدا می‌کند و از هر نوع صفحه، نسخه دسکتاپ و موبایل را تمام‌صفحه ذخیره می‌کند.</p>
      </header>

      <main className="layout">
        <form className="card form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span>آدرس سایت</span>
            <input dir="ltr" type="url" placeholder="https://www.example.com" value={form.url} onChange={set('url')} required />
          </label>

          <div className="row">
            <label className="field"><span>حداکثر صفحه</span>
              <input type="number" min="1" max="500" value={form.maxPages} onChange={set('maxPages')} /></label>
            <label className="field"><span>از هر الگوی آدرس</span>
              <input type="number" min="1" max="50" value={form.perPattern} onChange={set('perPattern')} />
              <small>چند صفحه با آدرس مشابه باز شود</small></label>
          </div>

          <label className="check">
            <input type="checkbox" checked={form.dedupe} onChange={set('dedupe')} />
            <span>از هر قالب فقط یک نمونه (اگر یک دسته‌بندی گرفته شد، بقیه دسته‌ها رد می‌شوند)</span>
          </label>

          <fieldset className="checks">
            <legend>نمایش</legend>
            <label><input type="checkbox" checked={form.desktop} onChange={set('desktop')} /> دسکتاپ (۱۴۴۰)</label>
            <label><input type="checkbox" checked={form.mobile} onChange={set('mobile')} /> موبایل (۳۹۰)</label>
          </fieldset>

          <details>
            <summary>تنظیمات بیشتر</summary>
            <div className="row">
              <label className="field"><span>عمق لینک‌ها</span>
                <input type="number" min="0" max="10" value={form.maxDepth} onChange={set('maxDepth')} /></label>
              <label className="field"><span>ارتفاع هر تکه (px)</span>
                <input type="number" min="600" max="6000" step="100" value={form.sliceHeight} onChange={set('sliceHeight')} /></label>
            </div>
            <div className="row">
              <label className="field"><span>مکث بین صفحه‌ها (ms)</span>
                <input type="number" min="0" max="10000" step="100" value={form.delay} onChange={set('delay')} /></label>
              <label className="field"><span>فرمت</span>
                <select value={form.format} onChange={set('format')}>
                  <option value="jpeg">JPG (حجم کم)</option>
                  <option value="png">PNG (کیفیت کامل)</option>
                </select></label>
            </div>
            <label className="check"><input type="checkbox" checked={form.keepQuery} onChange={set('keepQuery')} /> آدرس‌های با پارامتر (?page=2) جدا حساب شوند</label>
            <label className="check"><input type="checkbox" checked={form.headed} onChange={set('headed')} /> نمایش مرورگر هنگام عکس‌برداری (برای سایت‌هایی که مرورگر پنهان را مسدود می‌کنند)</label>
            <label className="field"><span>آدرس‌های اضافه (هر خط یک آدرس)</span>
              <textarea dir="ltr" rows="3" value={form.seeds} onChange={set('seeds')} placeholder="https://www.example.com/profile/orders" />
              <small>صفحه‌هایی که لینکشان در سایت پیدا نمی‌شود</small></label>
          </details>

          <fieldset className="panel-box">
            <legend>پنل کاربری</legend>
            <p className="muted">ابزار سایت را باز می‌کند؛ شما وارد حساب شوید. به محض ورود، جلسه را خودش می‌گیرد، پنجره را می‌بندد و با همان حساب عکس‌برداری را شروع می‌کند (صفحه‌های پنل اول).</p>
            <label className="field"><span>آدرس صفحه ورود (اختیاری)</span>
              <input dir="ltr" type="url" placeholder="https://www.example.com/login" value={form.loginUrl} onChange={set('loginUrl')} /></label>
            <button type="button" className="btn ghost" disabled={!formHost || running || loginBusy}
              onClick={() => post('/api/login', { ...form, viewports: [form.desktop && 'desktop', form.mobile && 'mobile'].filter(Boolean) })
                .then(() => setRunning(true)).catch((err) => setError(err.message))}>
              {loginBusy ? 'منتظر ورود شما…' : 'ورود به حساب و ادامه خودکار'}
            </button>
            {visited.length > 0 && <p className="muted">{fa(visited.length)} صفحه پنل ثبت شد.</p>}
            <label className="check"><input type="checkbox" checked={form.useAuth} onChange={set('useAuth')} /> از جلسه ذخیره‌شده قبلی استفاده کن</label>
          </fieldset>

          {saved && saved.pages && saved.pages.length > 0 && (
            <div className="memory">
              <p>از این سایت قبلاً <strong>{fa(saved.pages.length)}</strong> صفحه گرفته شده
                {saved.pending && saved.pending.length ? <> و <strong>{fa(saved.pending.length)}</strong> لینک برای ادامه مانده</> : null}.
                با «شروع» فقط صفحه‌های جدید گرفته می‌شود.</p>
              <label className="check"><input type="checkbox" checked={form.fresh} onChange={set('fresh')} /> از اول (عکس‌های قبلی این سایت پاک شود)</label>
            </div>
          )}

          {error && <p className="error" role="alert">{error}</p>}

          <div className="actions">
            <button className="btn" type="submit" disabled={running}>{running ? 'در حال عکس‌برداری…' : 'شروع'}</button>
            {running && <button className="btn ghost" type="button" onClick={() => post('/api/stop')}>توقف</button>}
          </div>
          {outRoot && <p className="muted">پوشه خروجی: <code dir="ltr">{outRoot}</code></p>}
        </form>

        <section className="card results" aria-live="polite">
          <div className="results__head">
            <h2>نتیجه</h2>
            <span className="muted">{fa(pages.length)} صفحه</span>
          </div>
          {fatal && <p className="error">{fatal.message}</p>}
          {done && <p className="ok">تمام شد: {fa(done.pages)} صفحه جدید، {fa(done.filled)} نمای جاافتاده تکمیل شد، {fa(done.skipped)} صفحه تکراری رد شد{done.failed ? `، ${fa(done.failed)} صفحه باز نشد` : ''}. در مجموع {fa(done.total)} صفحه در <code dir="ltr">{done.outDir}</code> است. این پوشه را کامیت و پوش کنید.</p>}
          {visiting && <p className="muted" dir="auto">در حال باز کردن: <span dir="ltr">{visiting.url}</span></p>}
          {logs.length > 0 && <p className="muted">{logs[logs.length - 1].message}</p>}
          {generalErrors.length > 0 && (
            <ul className="errors" role="alert">
              {generalErrors.slice(-5).map((e, i) => <li key={i}><span dir="ltr">{e.url}</span>: {e.message}</li>)}
            </ul>
          )}
          {skipped.length > 0 && (
            <details className="skipped">
              <summary>{fa(skipped.length)} صفحه با قالب تکراری رد شد</summary>
              <ul>{skipped.map((e) => <li key={e.url} dir="ltr">{e.url} <span className="muted">= #{e.sameAs}</span></li>)}</ul>
            </details>
          )}
          {!pages.length && !running && <p className="muted">هنوز چیزی گرفته نشده است.</p>}
          {running && !pages.length && <p className="muted">در حال باز کردن سایت…</p>}
          <ul className="pages">
            {pages.map((p) => (
              <li key={p.index} className="page">
                <div className="page__meta">
                  <span className="num">{fa(p.index)}</span>
                  {p.old && <span className="tag">قبلی</span>}
                  {p.filling && <span className="tag">تکمیل {p.filling.join('، ')}</span>}
                  {(p.old || done) && !running && (
                    <button type="button" className={'del' + (confirming === p.index ? ' del--confirm' : '')}
                      onClick={() => removePage(p.index)} onBlur={() => setConfirming(null)}
                      aria-label={`حذف صفحه ${p.index} و فولدر عکس‌هایش`}>
                      {confirming === p.index ? 'مطمئنید؟ دوباره بزنید' : 'حذف'}
                    </button>
                  )}
                  <a dir="ltr" href={p.url} target="_blank" rel="noreferrer">{p.url}</a>
                  <span className="tag" dir="ltr">{p.pattern}</span>
                </div>
                <div className="thumbs">
                  {['desktop', 'mobile'].map((vp) => p.shots[vp] && (
                    <a key={vp} className={'thumb ' + vp} href={`/captures/${host}/${p.shots[vp].files[0]}`} target="_blank" rel="noreferrer">
                      <img src={`/captures/${host}/${p.shots[vp].files[0]}`} alt={`${vp} ${p.url}`} loading="lazy" />
                      <span>{vp === 'desktop' ? 'دسکتاپ' : 'موبایل'} · {fa(p.shots[vp].files.length)} فایل</span>
                    </a>
                  ))}
                </div>
                {p.errors.map((er, i) => <p key={i} className="error small">{er.viewport}: {er.message}</p>)}
              </li>
            ))}
          </ul>
          <div ref={logEnd} />
        </section>
      </main>
    </div>
  );
}
