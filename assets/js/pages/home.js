/* Home page: hero slider, timed-offer panel, product rails, blog rail and the
   "show more" toggle of the store introduction. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement.getAttribute('data-root') || '';

  function parse(json) {
    try { return JSON.parse(json); } catch (e) { return {}; }
  }

  function sortBy(list, key) {
    var copy = list.slice();
    if (key === 'discount') copy.sort(function (a, b) { return Shop.discountOf(b) - Shop.discountOf(a); });
    else if (key === 'price') copy.sort(function (a, b) { return b.price - a.price; });
    return copy;
  }

  if (Shop) {
    /* ---------- Timed offers: biggest discounts that are in stock ---------- */
    var offerTrack = document.querySelector('[data-offer-track]');
    if (offerTrack) {
      var offers = sortBy(Shop.products.filter(function (p) {
        return Shop.discountOf(p) > 0 && p.stock !== 0;
      }), 'discount').slice(0, 10);
      Shop.render(offerTrack, offers, 'li', null, { timer: true });
    }

    /* ---------- Product rails: data-rail holds the query (+ sort, timer) ---------- */
    document.querySelectorAll('[data-rail]').forEach(function (track) {
      var f = parse(track.getAttribute('data-rail'));
      var opts = { timer: !!f.timer };
      var sort = f.sort;
      delete f.timer;
      delete f.sort;
      var list = sortBy(Shop.query(f), sort).slice(0, 10);
      Shop.render(track, list, 'li', null, opts);
      // Cards without a countdown keep their image level with the timed ones
      if (opts.timer && track.querySelector('.product-card--timer')) track.classList.add('has-timers');
    });
  }

  /* ---------- Blog rail (newest first, whatever posts exist) ---------- */
  var blogTrack = document.querySelector('[data-blog-track]');
  var posts = (window.SHOP_POSTS || []).slice().sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date));
  }).slice(0, 10);
  if (blogTrack) {
    if (!posts.length) {
      document.querySelector('[data-blog-section]').hidden = true;
    } else {
      var esc = Shop ? Shop.escapeHtml : function (s) { return String(s); };
      blogTrack.innerHTML = posts.map(function (p) {
        return '<li><article class="blog-card">' +
          '<div class="blog-card__media"><img src="' + root + 'assets/images/products/' + esc(p.img) + '.svg" alt="" width="400" height="400" loading="lazy"></div>' +
          '<h3 class="blog-card__title"><a href="' + root + 'pages/post.html?slug=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + '</a></h3>' +
        '</article></li>';
      }).join('');
    }
  }

  if (window.UI) window.UI.initScrollers(document);

  /* ---------- Store introduction: collapsed until the visitor asks ---------- */
  var seoBtn = document.querySelector('[data-seo-toggle]');
  if (seoBtn) {
    var more = document.getElementById(seoBtn.getAttribute('aria-controls'));
    var label = seoBtn.querySelector('[data-seo-label]');
    var setOpen = function (open) {
      more.hidden = !open;
      seoBtn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'نمایش کمتر' : 'نمایش بیشتر';
    };
    seoBtn.hidden = false;
    setOpen(false);
    seoBtn.addEventListener('click', function () {
      setOpen(seoBtn.getAttribute('aria-expanded') !== 'true');
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
})();
