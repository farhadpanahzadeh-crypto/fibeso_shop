/* HAPEEC home page: renders the demo catalogue and wires carousels, mega menu, stories, countdown and cart. */
(function () {
  "use strict";

  const D = window.HAPEEC;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fa = (n) => Number(n).toLocaleString("fa-IR");
  const pad = (n) => String(n).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- templates ---------- */
  // a photo when the item has one, otherwise a brand-coloured icon tile
  const media = (x, attrs = 'loading="lazy" decoding="async"') =>
    x.img ? `<img src="${x.img}" alt="" ${attrs}>` : `<span class="ph-tile"><i class="ph ${x.icon}" aria-hidden="true"></i></span>`;

  const finalPrice = (p) => Math.round((p.price * (100 - p.off)) / 100 / 1000) * 1000;

  function cardHTML(p, opts = {}) {
    const sold = opts.progress ? 30 + ((p.id * 37) % 60) : 0;
    return `
      <article class="p-card">
        <a class="p-card__media" href="#" aria-label="${esc(p.title)}">
          ${media(p, 'loading="lazy" decoding="async" width="300" height="300"')}
          ${p.flag ? `<span class="p-card__flag"><i class="ph-fill ph-seal-check" aria-hidden="true"></i>${esc(p.flag)}</span>` : ""}
        </a>
        <h3 class="p-card__title"><a href="#">${esc(p.title)}</a></h3>
        <div class="p-card__meta">
          ${p.stock ? `<span class="p-card__stock">تنها ${fa(p.stock)} عدد باقی مانده</span>` : `<span>ارسال هپییک</span>`}
          <span class="rate"><i class="ph-fill ph-star" aria-hidden="true"></i>${fa(p.rate)}</span>
        </div>
        <div class="p-card__price">
          <div class="price-row">
            ${p.off ? `<span class="off num">٪${fa(p.off)}</span>` : "<span></span>"}
            <span class="price num">${fa(finalPrice(p))}<small>تومان</small></span>
          </div>
          ${p.off ? `<span class="old-price num">${fa(p.price)}</span>` : ""}
        </div>
        ${opts.progress ? `<div class="p-card__progress" role="img" aria-label="${fa(sold)} درصد فروخته شده"><span style="width:${sold}%"></span></div>` : ""}
        <button class="p-card__add" type="button" data-add="${p.id}"><i class="ph ph-plus" aria-hidden="true"></i>افزودن به سبد</button>
      </article>`;
  }

  const navBtns = `
    <button class="nav-btn nav-btn--prev" type="button" aria-label="قبلی"><i class="ph ph-caret-right" aria-hidden="true"></i></button>
    <button class="nav-btn nav-btn--next" type="button" aria-label="بعدی"><i class="ph ph-caret-left" aria-hidden="true"></i></button>`;

  /* ---------- render ---------- */
  function render() {
    $("[data-hero-slides]").innerHTML = D.heroSlides.map((s, i) => `
      <div class="swiper-slide">
        <img class="hero__img" src="${s.img}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">
        <div class="hero__shade"></div>
        <div class="hero__content">
          <h2>${s.title}</h2>
          <p>${esc(s.text)}</p>
          <a class="btn btn--primary" href="#">${esc(s.cta)}<i class="ph ph-arrow-left" aria-hidden="true"></i></a>
        </div>
      </div>`).join("");

    $("[data-stories-list]").innerHTML = D.stories.map((s, i) => `
      <div class="swiper-slide">
        <button class="story" type="button" data-story="${i}">
          <span class="story__ring"><img src="${s.cover}" alt="" loading="lazy"><i class="ph-fill ph-play-circle" aria-hidden="true"></i></span>
          <span>${esc(s.label)}</span>
        </button>
      </div>`).join("");

    $("[data-services]").innerHTML = D.services.map((s) => `
      <a class="service" href="#"><span class="service__icon"><i class="ph ${s.icon}" aria-hidden="true"></i></span>${esc(s.label)}</a>`).join("");

    $("[data-amazing-list]").innerHTML =
      D.amazing.map((p) => `<div class="swiper-slide">${cardHTML(p, { progress: true })}</div>`).join("") +
      `<div class="swiper-slide is-more"><a class="amazing__more" href="#"><i class="ph ph-arrow-left" aria-hidden="true"></i>مشاهده همه</a></div>`;

    $("[data-banners4]").innerHTML = D.banners4.map((b) => `
      <a class="banner" href="#">
        <img src="${b.img}" alt="" loading="lazy">
        <span class="banner__body"><strong>${esc(b.title)}</strong><span>${esc(b.text)}</span></span>
      </a>`).join("");

    $("[data-express]").innerHTML = D.express.map((p) => `
      <a class="express__item" href="#" aria-label="${esc(p.title)}">
        ${media(p)}
        ${p.off ? `<span class="off num">٪${fa(p.off)}</span>` : ""}
      </a>`).join("");

    $("[data-cats]").innerHTML = D.cats.map((c) => `
      <a class="cat" href="#"><span class="cat__img">${media(c)}</span><span>${esc(c.label)}</span></a>`).join("");

    $("[data-banners2]").innerHTML = D.banners2.map((b) => `
      <a class="banner" href="#">
        <img src="${b.img}" alt="" loading="lazy">
        <span class="banner__body"><strong>${esc(b.title)}</strong><span class="btn btn--light">${esc(b.cta)}</span></span>
      </a>`).join("");

    $("[data-picks]").innerHTML = D.picks.map((k) => `
      <div class="pick">
        <h3>${esc(k.title)}</h3>
        <p>${esc(k.text)}</p>
        <div class="pick__grid">${k.items.map((p) => `<a href="#" aria-label="${esc(p.title)}">${media(p)}</a>`).join("")}</div>
        <a class="link-more" href="#">مشاهده<i class="ph ph-caret-left" aria-hidden="true"></i></a>
      </div>`).join("");

    $("[data-rails]").innerHTML = D.rails.map((r) => `
      <section class="section reveal" id="${r.id}" aria-labelledby="${r.id}Title">
        <div class="section-head">
          <div>
            <h2 id="${r.id}Title"><i class="ph ${r.icon}" aria-hidden="true"></i>${esc(r.title)}</h2>
            <p>${esc(r.text)}</p>
          </div>
          <a class="link-more" href="#">مشاهده همه<i class="ph ph-caret-left" aria-hidden="true"></i></a>
        </div>
        <div class="carousel rail">
          <div class="swiper" data-rail>
            <div class="swiper-wrapper">${r.items.map((p) => `<div class="swiper-slide">${cardHTML(p)}</div>`).join("")}</div>
          </div>
          ${navBtns}
        </div>
      </section>`).join("");

    $("[data-brands]").innerHTML = D.brands.map((b) => `
      <div class="swiper-slide"><a class="brand" href="#" aria-label="${esc(D.brandNames[b])}"><img src="assets/img/brands/${b}.svg" alt="${esc(D.brandNames[b])}" loading="lazy"></a></div>`).join("");

    const cols = [];
    for (let i = 0; i < D.bestsellers.length; i += 3) cols.push(D.bestsellers.slice(i, i + 3));
    $("[data-ranked]").innerHTML = cols.map((col, c) => `
      <div class="swiper-slide"><div class="ranked__col">${col.map((p, i) => `
        <a class="rank-item" href="#"><span class="rank-item__img">${media(p)}</span><b class="num">${fa(c * 3 + i + 1)}</b><span>${esc(p.title)}</span></a>`).join("")}
      </div></div>`).join("");

    $("[data-videos]").innerHTML = D.videos.map((v, i) => `
      <div class="swiper-slide">
        <button class="reel" type="button" data-video="${i}">
          <img src="${v.img}" alt="" loading="lazy">
          <span class="reel__play"><i class="ph-fill ph-play" aria-hidden="true"></i></span>
          <span class="reel__dur num">${v.dur}</span>
          <span class="reel__body"><strong>${esc(v.title)}</strong><span><i class="ph ph-eye" aria-hidden="true"></i>${v.views} بازدید</span></span>
        </button>
      </div>`).join("");

    $("[data-posts]").innerHTML = D.posts.map((p) => `
      <a class="post" href="#">
        <span class="post__img"><img src="${p.img}" alt="" loading="lazy"></span>
        <span class="post__tag">${esc(p.tag)}</span>
        <h3>${esc(p.title)}</h3>
        <time><i class="ph ph-calendar-blank" aria-hidden="true"></i>${p.date}</time>
      </a>`).join("");
  }

  /* ---------- carousels ---------- */
  function initSwipers() {
    if (!window.Swiper) return;
    new Swiper("[data-hero]", {
      loop: true,
      speed: 700,
      autoplay: reduceMotion ? false : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: "[data-hero-pager]", clickable: true },
      navigation: { prevEl: "[data-hero-prev]", nextEl: "[data-hero-next]" },
      a11y: { prevSlideMessage: "اسلاید قبلی", nextSlideMessage: "اسلاید بعدی", paginationBulletMessage: "رفتن به اسلاید {{index}}" }
    });

    new Swiper("[data-stories]", { slidesPerView: "auto", spaceBetween: 8, freeMode: true });

    $$("[data-rail]").forEach((el) => {
      const wrap = el.closest(".carousel");
      new Swiper(el, {
        slidesPerView: "auto",
        spaceBetween: el.closest(".amazing") ? 2 : 12,
        freeMode: { enabled: true, sticky: false },
        watchOverflow: true,
        navigation: wrap ? { prevEl: $(".nav-btn--prev", wrap), nextEl: $(".nav-btn--next", wrap) } : false,
        breakpoints: { 1024: { slidesPerGroup: 3, freeMode: false } }
      });
    });
  }

  /* ---------- mega menu ---------- */
  function initMega() {
    const mega = $("#mega");
    const trigger = $(".mega-trigger", mega);
    const cats = $("[data-mega-cats]");
    const body = $("[data-mega-body]");

    cats.innerHTML = D.mega.map((m, i) => `
      <button type="button" role="tab" id="mtab${i}" aria-controls="megaBody" aria-selected="${i === 0}" data-mega="${i}">
        <i class="ph ${m.icon}" aria-hidden="true"></i>${esc(m.label)}
      </button>`).join("");
    body.id = "megaBody";
    body.setAttribute("role", "tabpanel");

    const show = (i) => {
      const m = D.mega[i];
      $$("[data-mega]", cats).forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.mega === i)));
      body.setAttribute("aria-labelledby", `mtab${i}`);
      body.innerHTML = `
        <a class="link-more" href="#">همه‌ی محصولات ${esc(m.label)}<i class="ph ph-caret-left" aria-hidden="true"></i></a>
        <div class="mega__cols">${m.groups.map((g) => `
          <div class="mega__group"><h4>${esc(g.title)}</h4>${g.links.map((l) => `<a href="#">${esc(l)}</a>`).join("")}</div>`).join("")}
        </div>`;
    };
    show(0);

    cats.addEventListener("mouseover", (e) => { const b = e.target.closest("[data-mega]"); if (b) show(+b.dataset.mega); });
    cats.addEventListener("focusin", (e) => { const b = e.target.closest("[data-mega]"); if (b) show(+b.dataset.mega); });

    const setOpen = (open) => { mega.classList.toggle("is-open", open); trigger.setAttribute("aria-expanded", String(open)); };
    trigger.addEventListener("click", () => setOpen(!mega.classList.contains("is-open")));
    mega.addEventListener("mouseleave", () => setOpen(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mega.classList.contains("is-open")) { setOpen(false); trigger.focus(); } });
    document.addEventListener("click", (e) => { if (!mega.contains(e.target)) setOpen(false); });
  }

  /* ---------- countdown (resets at midnight) ---------- */
  function initCountdown() {
    const el = $("[data-countdown]");
    const h = $("[data-h]", el), m = $("[data-m]", el), s = $("[data-s]", el);
    const tick = () => {
      const now = new Date();
      const end = new Date(now); end.setHours(24, 0, 0, 0);
      const left = Math.max(0, Math.floor((end - now) / 1000));
      h.textContent = pad(Math.floor(left / 3600));
      m.textContent = pad(Math.floor((left % 3600) / 60));
      s.textContent = pad(left % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- cart ---------- */
  function initCart() {
    let count = 0;
    try { count = +localStorage.getItem("hapeec-cart") || 0; } catch (e) {}
    const paint = () => $$("[data-cart-count]").forEach((b) => { b.textContent = fa(count); b.hidden = count === 0; });
    paint();
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      count += 1;
      try { localStorage.setItem("hapeec-cart", String(count)); } catch (err) {}
      paint();
      btn.classList.add("is-added");
      btn.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>به سبد اضافه شد';
      toast("کالا به سبد خرید اضافه شد");
      setTimeout(() => { btn.classList.remove("is-added"); btn.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>افزودن به سبد'; }, 1800);
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    $("span", t).textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
  }

  /* ---------- story / video viewer ---------- */
  function initViewer() {
    const v = $("[data-viewer]");
    const media = $("[data-v-media]", v);
    const bars = $("[data-v-bars]", v);
    const pauseBtn = $("[data-v-pause]", v);
    const DURATION = 6000;
    let groups = [], g = 0, i = 0, anim = null, lastFocus = null, paused = false;

    // video cards play as single-item groups, stories as multi-item groups
    const videoGroups = D.videos.map((x) => ({ label: x.title, cover: x.img, items: [{ img: x.img, video: x.video, caption: x.title, cta: "مشاهده محصولات مرتبط" }] }));

    function open(list, groupIndex, opener) {
      groups = list; g = groupIndex; i = 0; lastFocus = opener;
      v.hidden = false;
      requestAnimationFrame(() => v.classList.add("is-open"));
      document.body.style.overflow = "hidden";
      show();
      $("[data-v-close]", v).focus();
    }
    function close() {
      stop();
      v.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { v.hidden = true; media.innerHTML = ""; }, 260);
      if (lastFocus) lastFocus.focus();
    }
    function stop() { if (anim) { anim.cancel(); anim = null; } const vid = $("video", media); if (vid) vid.pause(); }

    function show() {
      stop();
      const grp = groups[g], item = grp.items[i];
      if (groups === D.stories) $$(".story")[g]?.classList.add("is-seen");
      $("[data-v-avatar]", v).src = grp.cover;
      $("[data-v-title]", v).textContent = grp.label;
      $("[data-v-caption]", v).textContent = item.caption;
      const cta = $("[data-v-cta]", v);
      cta.innerHTML = `${esc(item.cta)}<i class="ph ph-arrow-left" aria-hidden="true"></i>`;

      bars.innerHTML = grp.items.map((_, k) => `<span class="${k < i ? "is-done" : ""}"><i></i></span>`).join("");
      const bar = $$("i", bars)[i];

      if (item.video) {
        media.innerHTML = `<video src="${item.video}" poster="${item.img}" playsinline autoplay ${reduceMotion ? "" : ""}></video>`;
        const vid = $("video", media);
        vid.muted = true;
        vid.addEventListener("loadedmetadata", () => run(bar, (vid.duration || 6) * 1000));
        vid.addEventListener("error", () => run(bar, DURATION));
      } else {
        media.innerHTML = `<img src="${item.img}" alt="" class="${reduceMotion ? "" : "kb"}">`;
        run(bar, DURATION);
      }
    }
    function run(bar, ms) {
      anim = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: ms, easing: "linear", fill: "forwards" });
      anim.onfinish = next;
      setPaused(false);
    }
    function setPaused(p) {
      paused = p;
      if (anim) p ? anim.pause() : anim.play();
      const vid = $("video", media); if (vid) p ? vid.pause() : vid.play().catch(() => {});
      const img = $("img.kb", media); if (img) img.style.animationPlayState = p ? "paused" : "running";
      pauseBtn.innerHTML = p ? '<i class="ph-fill ph-play" aria-hidden="true"></i>' : '<i class="ph-fill ph-pause" aria-hidden="true"></i>';
      pauseBtn.setAttribute("aria-label", p ? "ادامه" : "توقف");
    }
    function next() {
      if (i < groups[g].items.length - 1) { i++; show(); }
      else if (g < groups.length - 1) { g++; i = 0; show(); }
      else close();
    }
    function prev() {
      if (i > 0) { i--; show(); }
      else if (g > 0) { g--; i = 0; show(); }
      else show();
    }

    document.addEventListener("click", (e) => {
      const s = e.target.closest("[data-story]");
      if (s) return open(D.stories, +s.dataset.story, s);
      const r = e.target.closest("[data-video]");
      if (r) return open(videoGroups, +r.dataset.video, r);
    });
    $("[data-v-close]", v).addEventListener("click", close);
    $("[data-v-fwd]", v).addEventListener("click", next);
    $("[data-v-back]", v).addEventListener("click", prev);
    $("[data-v-next-group]", v).addEventListener("click", () => { if (g < groups.length - 1) { g++; i = 0; show(); } else close(); });
    $("[data-v-prev-group]", v).addEventListener("click", () => { if (g > 0) { g--; i = 0; show(); } });
    pauseBtn.addEventListener("click", () => setPaused(!paused));
    v.addEventListener("click", (e) => { if (e.target === v) close(); });

    // press and hold to pause, like other story players
    const tap = $(".viewer__tap", v);
    let holdTimer, held = false;
    tap.addEventListener("pointerdown", () => { held = false; holdTimer = setTimeout(() => { held = true; setPaused(true); }, 250); });
    tap.addEventListener("pointerup", () => { clearTimeout(holdTimer); if (held) setPaused(false); });
    tap.addEventListener("click", (e) => { if (held) { e.stopImmediatePropagation(); e.preventDefault(); held = false; } }, true);

    document.addEventListener("keydown", (e) => {
      if (v.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") next();       // RTL: left moves forward
      else if (e.key === "ArrowRight") prev();
      else if (e.key === " ") { e.preventDefault(); setPaused(!paused); }
      else if (e.key === "Tab") {                    // keep focus inside the dialog
        const f = $$("button, a[href]", v).filter((x) => x.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- newsletter ---------- */
  function initNewsletter() {
    const form = $("[data-newsletter]");
    const input = $("input", form), msg = $(".newsletter__msg", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      msg.className = "newsletter__msg " + (ok ? "is-ok" : "is-error");
      msg.textContent = ok ? "عضویت انجام شد. اولین خبرنامه را این هفته دریافت می‌کنید." : "لطفا یک ایمیل معتبر وارد کنید، مثلا name@gmail.com";
      input.setAttribute("aria-invalid", String(!ok));
      if (ok) input.value = "";
    });
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const btn = $("#themeToggle");
    const isDark = () => document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    const paint = () => { $("i", btn).className = "ph " + (isDark() ? "ph-sun" : "ph-moon"); };
    paint();
    btn.addEventListener("click", () => {
      const t = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem("hapeec-theme", t); } catch (e) {}
      paint();
    });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- mobile: category tab opens the mega menu ---------- */
  function initTabbar() {
    const link = $("[data-open-mega]");
    link.addEventListener("click", (e) => {
      e.preventDefault();
      $("#catsTitle").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  }

  render();
  initSwipers();
  initMega();
  initCountdown();
  initCart();
  initViewer();
  initNewsletter();
  initTheme();
  initReveal();
  initTabbar();
})();
