/* Home page: product rails and the hero slider. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function parse(json) {
    try { return JSON.parse(json); } catch (e) { return {}; }
  }

  /* ---------- Rails ---------- */
  if (Shop) {
    document.querySelectorAll('[data-rail]').forEach(function (track) {
      var f = parse(track.getAttribute('data-rail'));
      f.limit = 10;
      Shop.render(track, Shop.query(f), 'li');
    });
  }
  if (window.UI) window.UI.initScrollers(document);

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
