/* Shared, reusable UI behaviours. Exposed on window.UI for page scripts. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Digit by digit, so leading zeros (phone numbers, codes) are kept
  function toPersianDigits(value) {
    return String(value).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }

  // Converts Persian/Arabic-Indic digits typed by users into ASCII digits.
  function toLatinDigits(value) {
    return String(value)
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  }

  /* Accordion: [data-accordion] > .accordion__trigger[aria-controls] */
  function initAccordions(root) {
    root.querySelectorAll('[data-accordion]').forEach(function (accordion) {
      accordion.addEventListener('click', function (event) {
        var trigger = event.target.closest('.accordion__trigger');
        if (!trigger || !accordion.contains(trigger)) return;
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        var open = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!open));
        if (panel) panel.hidden = open;
      });
    });
  }

  /* Fade-in on scroll; everything is visible without JS or with reduced motion */
  function initReveal(root) {
    var items = root.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* Count-up numbers: [data-count] with optional [data-suffix] */
  function initCounters(root) {
    var items = root.querySelectorAll('[data-count]');
    if (!items.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    function run(el) {
      var target = Number(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1200;
      var start = null;
      function frame(time) {
        if (start === null) start = time;
        var progress = Math.min((time - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = toPersianDigits(Math.round(target * eased)) + suffix;
        if (progress < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* Horizontal rails: [data-scroller=id] with [data-scroll-prev=id] / [data-scroll-next=id] */
  function initScrollers(root) {
  root.querySelectorAll('[data-scroller]').forEach(function (scroller) {
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
      track.scrollBy({ left: -track.clientWidth * 0.9 * dir, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  }

  window.UI = {
    toPersianDigits: toPersianDigits,
    toLatinDigits: toLatinDigits,
    initAccordions: initAccordions,
    initReveal: initReveal,
    initCounters: initCounters,
    initScrollers: initScrollers
  };
})();
