/* Shared, reusable UI behaviours. Exposed on window.UI for page scripts. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var faDigits = new Intl.NumberFormat('fa-IR', { useGrouping: false });

  function toPersianDigits(value) {
    return String(value).replace(/\d+/g, function (n) {
      return faDigits.format(Number(n));
    });
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

  /* Filter chips: [data-filter-group=X] buttons filter [data-filter-list=X] items */
  function initFilters(root) {
    root.querySelectorAll('[data-filter-group]').forEach(function (group) {
      var name = group.getAttribute('data-filter-group');
      var list = root.querySelector('[data-filter-list="' + name + '"]');
      var empty = root.querySelector('[data-filter-empty="' + name + '"]');
      var status = root.querySelector('[data-filter-status="' + name + '"]');
      if (!list) return;

      group.addEventListener('click', function (event) {
        var button = event.target.closest('[data-filter]');
        if (!button) return;
        var value = button.getAttribute('data-filter');
        group.querySelectorAll('[data-filter]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === button));
        });
        var shown = 0;
        Array.prototype.forEach.call(list.children, function (item) {
          var match = value === 'all' || item.getAttribute('data-category') === value;
          item.hidden = !match;
          if (match) shown += 1;
        });
        if (empty) empty.hidden = shown > 0;
        if (status) status.textContent = toPersianDigits(shown) + ' مورد نمایش داده شد';
      });
    });
  }

  window.UI = {
    toPersianDigits: toPersianDigits,
    toLatinDigits: toLatinDigits,
    initAccordions: initAccordions,
    initReveal: initReveal,
    initCounters: initCounters,
    initFilters: initFilters
  };
})();
