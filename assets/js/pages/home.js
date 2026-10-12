/* Home page: product rails, category/brand/price filters, search results,
   category mega menu, hero slider, back-to-top. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scrollBehavior = function () { return reducedMotion.matches ? 'auto' : 'smooth'; };

  /* ---------- Filtering ----------
     filter: { tag, cat, sub ("a|b"), condition, grade, q ("a|b", matched against titles), min, max } */
  function matches(p, f) {
    if (f.tag && p.tags.indexOf(f.tag) === -1) return false;
    if (f.cat && p.cat !== f.cat) return false;
    if (f.sub && f.sub.split('|').indexOf(p.sub) === -1) return false;
    if (f.condition && p.condition !== f.condition) return false;
    if (f.grade && p.grade !== f.grade) return false;
    if (f.min && p.price < f.min) return false;
    if (f.max && p.price > f.max) return false;
    if (f.q) {
      var hay = (p.title + ' ' + p.catLabel).toLowerCase();
      var any = f.q.toLowerCase().split('|').some(function (alt) {
        return alt.split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) !== -1; });
      });
      if (!any) return false;
    }
    return true;
  }

  function find(f) {
    return Shop ? Shop.products.filter(function (p) { return matches(p, f); }) : [];
  }

  function parse(json) {
    try { return JSON.parse(json); } catch (e) { return {}; }
  }

  /* ---------- Rails ---------- */
  if (Shop) {
    document.querySelectorAll('[data-rail]').forEach(function (track) {
      Shop.render(track, find(parse(track.getAttribute('data-rail'))).slice(0, 10), 'li');
    });
  }

  document.querySelectorAll('[data-scroller]').forEach(function (scroller) {
    var track = scroller.querySelector('.scroller__track');
    var id = scroller.getAttribute('data-scroller');
    var prev = document.querySelector('[data-scroll-prev="' + id + '"]');
    var next = document.querySelector('[data-scroll-next="' + id + '"]');
    if (!track || !prev || !next) return;

    // In RTL, scrollLeft runs from 0 towards negative values
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var pos = Math.abs(track.scrollLeft);
      prev.disabled = pos <= 2;
      next.disabled = pos >= max - 2;
    }

    function step(dir) {
      track.scrollBy({ left: -track.clientWidth * 0.9 * dir, behavior: scrollBehavior() });
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- Results panel (stands in for category/search pages until they exist) ---------- */
  var results = document.getElementById('results');
  var resultsTitle = document.getElementById('results-title');
  var resultsList = document.querySelector('[data-results-list]');
  var resultsStatus = document.querySelector('[data-results-status]');

  function showResults(title, list, emptyMessage) {
    if (!results || !Shop) return;
    results.hidden = false;
    resultsTitle.textContent = title;
    if (list.length) {
      Shop.render(resultsList, list, 'li');
      resultsStatus.textContent = UI.toPersianDigits(list.length) + ' کالا پیدا شد';
    } else {
      resultsList.innerHTML = '';
      resultsStatus.textContent = emptyMessage || 'کالایی با این مشخصات پیدا نشد.';
    }
    results.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    resultsTitle.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-filter]');
    if (!trigger) return;
    event.preventDefault();
    closeCatMenu();
    showResults(trigger.getAttribute('data-filter-label') || 'نتایج', find(parse(trigger.getAttribute('data-filter'))));
  });

  var resultsClose = document.querySelector('[data-results-close]');
  if (resultsClose) {
    resultsClose.addEventListener('click', function () {
      results.hidden = true;
      document.getElementById('search-q').focus();
    });
  }

  var search = document.querySelector('[data-search]');
  if (search) {
    search.addEventListener('submit', function (event) {
      event.preventDefault();
      var q = search.elements.q.value.trim();
      if (!q) {
        search.elements.q.focus();
        return;
      }
      showResults('نتایج جستجو برای «' + q + '»', find({ q: q }),
        'نتیجه‌ای برای «' + q + '» پیدا نشد. عبارت دیگری مثل «روتر» یا «ThinkPad» را امتحان کنید.');
    });
  }

  var wishTrigger = document.querySelector('[data-wish-trigger]');
  if (wishTrigger && Shop) {
    wishTrigger.addEventListener('click', function () {
      var ids = Shop.wishlist();
      showResults('علاقه‌مندی‌های شما', Shop.products.filter(function (p) { return ids.indexOf(p.id) !== -1; }),
        'فهرست علاقه‌مندی‌ها خالی است. با دکمه قلب روی هر کالا آن را اضافه کنید.');
    });
  }

  var account = document.querySelector('[data-account]');
  if (account && Shop) {
    account.addEventListener('click', function () {
      Shop.toast('صفحه ورود و ثبت‌نام در مرحله بعد ساخته می‌شود');
    });
  }

  /* ---------- Category mega menu (disclosure) ---------- */
  var catMenu = document.querySelector('[data-cat-menu]');
  var catTrigger = document.querySelector('[data-cat-menu-trigger]');
  var catPanel = catTrigger && document.getElementById(catTrigger.getAttribute('aria-controls'));

  function closeCatMenu() {
    if (!catTrigger || catTrigger.getAttribute('aria-expanded') !== 'true') return;
    catTrigger.setAttribute('aria-expanded', 'false');
    catPanel.hidden = true;
  }

  if (catTrigger && catPanel) {
    catTrigger.addEventListener('click', function () {
      var open = catTrigger.getAttribute('aria-expanded') === 'true';
      catTrigger.setAttribute('aria-expanded', String(!open));
      catPanel.hidden = open;
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && catTrigger.getAttribute('aria-expanded') === 'true') {
        closeCatMenu();
        catTrigger.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (!catMenu.contains(event.target)) closeCatMenu();
    });
    catMenu.addEventListener('focusout', function (event) {
      if (event.relatedTarget && !catMenu.contains(event.relatedTarget)) closeCatMenu();
    });
  }

  /* ---------- Hero slider ---------- */
  var slider = document.querySelector('[data-slider]');
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-slide-to]'));
    var pauseBtn = slider.querySelector('[data-slider-pause]');
    var current = 0;
    var timer = null;
    var userPaused = reducedMotion.matches;

    var show = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.hidden = i !== current; });
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === current ? 'true' : 'false'); });
    };
    var stop = function () {
      window.clearInterval(timer);
      timer = null;
    };
    var start = function () {
      if (userPaused || timer) return;
      timer = window.setInterval(function () { show(current + 1); }, 6000);
    };
    var setPaused = function (paused) {
      userPaused = paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'پخش خودکار اسلایدها' : 'توقف اسلایدها');
      if (paused) stop(); else start();
    };

    slider.querySelector('[data-slide-prev]').addEventListener('click', function () { show(current - 1); });
    slider.querySelector('[data-slide-next]').addEventListener('click', function () { show(current + 1); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(Number(d.getAttribute('data-slide-to'))); });
    });
    pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

    // Never move content while the user is reading or interacting with it
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', function (e) {
      if (!slider.contains(e.relatedTarget)) start();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    show(0);
    setPaused(userPaused);
  }

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    var onScroll = function () { toTop.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
