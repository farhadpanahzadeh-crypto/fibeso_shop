/* FAQ: vertical category tabs (deep-linkable with #faq-order, #faq-shipping, ...) and question search. */
(function () {
  'use strict';

  var tablist = document.querySelector('[data-faq-tabs]');
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var input = document.querySelector('[data-faq-q]');
  var status = document.querySelector('[data-faq-status]');
  var wide = window.matchMedia('(min-width: 64rem)');
  var current = 0;

  function select(i, opts) {
    opts = opts || {};
    current = i;
    if (input && input.value) { input.value = ''; filter(''); }
    tabs.forEach(function (t, k) {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      panels[k].hidden = k !== i;
    });
    if (opts.focus) tabs[i].focus();
    if (opts.hash) history.replaceState(null, '', '#' + panels[i].id);
    // On phones the list sits above the questions: bring the answers into view
    if (opts.reveal && !wide.matches) panels[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fromHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return false;
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var target = document.getElementById(id);
      if (p.id === id || (target && p.contains(target))) {
        select(i);
        if (target && target.classList.contains('accordion__panel')) {
          var trigger = document.getElementById(target.getAttribute('aria-labelledby'));
          if (trigger) { trigger.setAttribute('aria-expanded', 'true'); target.hidden = false; }
        }
        window.requestAnimationFrame(function () { p.scrollIntoView({ block: 'start' }); });
        return true;
      }
    }
    return false;
  }

  tablist.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) select(tabs.indexOf(t), { hash: true, reveal: true });
  });

  tablist.addEventListener('keydown', function (e) {
    var keys = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' };
    if (!(e.key in keys)) return;
    e.preventDefault();
    var k = keys[e.key];
    var i = k === 'first' ? 0 : k === 'last' ? tabs.length - 1 : (current + k + tabs.length) % tabs.length;
    select(i, { focus: true, hash: true });
  });

  window.addEventListener('hashchange', fromHash);

  /* Search across every category; clearing restores the selected tab */
  function norm(s) { return String(s).toLowerCase().replace(/[‌\s]+/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک').trim(); }

  function filter(q) {
    var needle = norm(q);
    var hits = 0;
    panels.forEach(function (p, k) {
      var any = false;
      p.querySelectorAll('.accordion__item').forEach(function (item) {
        var match = !needle || norm(item.textContent).indexOf(needle) !== -1;
        item.hidden = !match;
        if (match) { any = true; hits += 1; }
      });
      p.hidden = needle ? !any : k !== current;
      p.classList.toggle('is-search', !!needle);
    });
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(!needle && k === current)); });
    status.textContent = !needle ? '' : hits ? hits.toLocaleString('fa-IR') + ' سوال پیدا شد' : 'سوالی با این عبارت پیدا نشد. عبارت کوتاه‌تری بنویسید یا از فهرست موضوع‌ها کمک بگیرید.';
  }

  if (input) {
    input.addEventListener('input', function () { filter(input.value); });
    input.form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  if (!fromHash()) select(0);
})();
