import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULTS = {
  url: '',
  maxPages: 40,
  perPattern: 2,
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

  const pages = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      if (e.type === 'page') map.set(e.index, { ...e, shots: {}, errors: [] });
      if (e.type === 'shot' && map.has(e.index)) map.get(e.index).shots[e.viewport] = e;
      if (e.type === 'error' && map.has(e.index)) map.get(e.index).errors.push(e);
    }
    return [...map.values()];
  }, [events]);

  const start = events.find((e) => e.type === 'start');
  const done = events.find((e) => e.type === 'done');
  const fatal = events.find((e) => e.type === 'fatal');
  const formHost = (() => { try { return new URL(form.url).hostname; } catch { return ''; } })();
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
            <label className="field"><span>از هر نوع صفحه</span>
              <input type="number" min="1" max="50" value={form.perPattern} onChange={set('perPattern')} />
              <small>مثلاً فقط ۲ صفحه محصول، نه هزاران</small></label>
          </div>

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
            <label className="check"><input type="checkbox" checked={form.useAuth} onChange={set('useAuth')} /> با حساب واردشده عکس بگیر (برای پنل کاربری)</label>
            <button type="button" className="btn ghost" disabled={!formHost || running}
              onClick={() => post('/api/login', { url: form.url }).catch((err) => setError(err.message))}>
              ورود دستی به سایت و ذخیره ورود
            </button>
          </details>

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
          {done && <p className="ok">تمام شد. فایل‌ها در <code dir="ltr">{done.outDir}</code> ذخیره شد. این پوشه را کامیت و پوش کنید.</p>}
          {!pages.length && !running && <p className="muted">هنوز چیزی گرفته نشده است.</p>}
          {running && !pages.length && <p className="muted">در حال باز کردن سایت…</p>}
          <ul className="pages">
            {pages.map((p) => (
              <li key={p.index} className="page">
                <div className="page__meta">
                  <span className="num">{fa(p.index)}</span>
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
