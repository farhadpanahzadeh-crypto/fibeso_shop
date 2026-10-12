/* Shop listing: URL-driven filters, sorting, pagination, mobile filter sheet. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var PER_PAGE = 12;
  var form = document.querySelector('[data-filter-form]');
  var grid = document.querySelector('[data-shop-grid]');
  var statusEl = document.querySelector('[data-shop-status]');
  var titleEl = document.querySelector('[data-shop-title]');
  var crumb = document.querySelector('[data-crumb]');
  var chipsEl = document.querySelector('[data-active-filters]');
  var pager = document.querySelector('[data-pagination]');
  var sortEl = document.querySelector('[data-sort]');
  var brandList = document.querySelector('[data-brand-list]');
  var resultCount = document.querySelector('[data-result-count]');
  var badge = document.querySelector('[data-filter-badge]');
  var panel = document.querySelector('[data-filters]');
  var openBtn = document.querySelector('[data-filters-open]');
  var backdrop = document.querySelector('[data-backdrop]');

  var LABELS = {
    cat: { laptop: 'لپ‌تاپ', network: 'تجهیزات شبکه', parts: 'قطعات و لوازم جانبی' },
    condition: { 'new': 'نو', used: 'استوک' },
    sub: { router: 'مودم و روتر', 'switch': 'سوییچ شبکه', ap: 'اکسس پوینت', nic: 'کارت شبکه', rack: 'رک', cable: 'کابل و پچ‌کورد', 'rack|cable': 'زیرساخت و اتصالات', 'rack|nic': 'رک و کارت شبکه' },
    use: { gaming: 'گیمینگ', engineering: 'مهندسی و طراحی', office: 'اداری و تجاری', student: 'دانشجویی', light: 'سبک و الترابوک' },
    tag: { offer: 'تخفیف‌دار' }
  };

  /* ---------- State <-> URL ---------- */
  var KEYS = ['q', 'cat', 'sub', 'condition', 'grade', 'brand', 'use', 'min', 'max', 'stock', 'tag', 'sort', 'page'];

  function readState() {
    var params = new URLSearchParams(window.location.search);
    var state = {};
    KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) state[k] = v;
    });
    if (state.brand) state.brand = state.brand.split(',');
    return state;
  }

  function writeState(state, push) {
    var params = new URLSearchParams();
    KEYS.forEach(function (k) {
      var v = state[k];
      if (v && (!Array.isArray(v) || v.length)) params.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    var url = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history[push ? 'pushState' : 'replaceState'](null, '', url);
  }

  var state = readState();

  /* ---------- Brand checkboxes from the catalogue ---------- */
  var brands = {};
  Shop.products.forEach(function (p) { brands[p.brand] = true; });
  brandList.innerHTML = Object.keys(brands).sort(function (a, b) { return a.localeCompare(b, 'fa'); }).map(function (b) {
    return '<label class="check"><input type="checkbox" name="brand" value="' + Shop.escapeHtml(b) + '"> ' + Shop.escapeHtml(b) +
      ' <span class="check__count" data-count-for="brand:' + Shop.escapeHtml(b) + '"></span></label>';
  }).join('');

  function syncForm() {
    form.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.checked = (state[r.name] || '') === r.value;
    });
    form.querySelectorAll('input[name="brand"]').forEach(function (c) {
      c.checked = (state.brand || []).indexOf(c.value) !== -1;
    });
    form.elements.stock.checked = !!state.stock;
    form.elements.tag.checked = state.tag === 'offer';
    form.elements.min.value = state.min || '';
    form.elements.max.value = state.max || '';
    sortEl.value = state.sort || '';
  }

  function readForm() {
    var next = { q: state.q, sub: state.sub, grade: state.grade, use: state.use, sort: state.sort };
    next.condition = form.querySelector('input[name="condition"]:checked') ? form.querySelector('input[name="condition"]:checked').value : '';
    next.cat = form.querySelector('input[name="cat"]:checked') ? form.querySelector('input[name="cat"]:checked').value : '';
    next.brand = Array.prototype.map.call(form.querySelectorAll('input[name="brand"]:checked'), function (c) { return c.value; });
    next.min = form.elements.min.value;
    next.max = form.elements.max.value;
    next.stock = form.elements.stock.checked ? '1' : '';
    next.tag = form.elements.tag.checked ? 'offer' : (state.tag && state.tag !== 'offer' ? state.tag : '');
    // A sub-category only makes sense inside its own category
    if (next.cat !== state.cat) next.sub = '';
    return next;
  }

  /* ---------- Rendering ---------- */
  function sortList(list, sort) {
    var copy = list.slice();
    if (sort === 'cheap') copy.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'expensive') copy.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'discount') copy.sort(function (a, b) { return Shop.discountOf(b) - Shop.discountOf(a); });
    else if (sort === 'popular') copy.sort(function (a, b) { return b.reviews - a.reviews; });
    // Out-of-stock items always sink to the end
    copy.sort(function (a, b) { return (a.stock === 0) - (b.stock === 0); });
    return copy;
  }

  function title() {
    if (state.q) return 'نتایج جستجو برای «' + state.q + '»';
    var parts = [];
    if (state.sub && LABELS.sub[state.sub]) parts.push(LABELS.sub[state.sub]);
    else if (state.cat) parts.push(LABELS.cat[state.cat]);
    if (state.condition) parts.push(LABELS.condition[state.condition]);
    if (state.use) parts.push(LABELS.use[state.use]);
    if (state.tag === 'offer' && !parts.length) return 'تخفیف‌های فیبسو';
    return parts.length ? parts.join(' ') : 'همه محصولات';
  }

  function activeChips() {
    var chips = [];
    function add(key, label, value) { chips.push({ key: key, label: label, value: value }); }
    if (state.q) add('q', 'جستجو: ' + state.q);
    if (state.cat) add('cat', LABELS.cat[state.cat]);
    if (state.sub) add('sub', LABELS.sub[state.sub] || state.sub);
    if (state.condition) add('condition', LABELS.condition[state.condition]);
    if (state.grade) add('grade', 'درجه ' + state.grade);
    if (state.use) add('use', LABELS.use[state.use]);
    (state.brand || []).forEach(function (b) { add('brand', b, b); });
    if (state.min) add('min', 'از ' + Shop.formatPrice(state.min / 1000000) + ' میلیون');
    if (state.max) add('max', 'تا ' + Shop.formatPrice(state.max / 1000000) + ' میلیون');
    if (state.stock) add('stock', 'فقط موجود');
    if (state.tag) add('tag', LABELS.tag[state.tag] || state.tag);
    return chips;
  }

  function counts() {
    // How many items each option would show, given the other active filters
    form.querySelectorAll('[data-count-for]').forEach(function (el) {
      var parts = el.getAttribute('data-count-for').split(':');
      var f = Object.assign({}, state);
      if (parts[0] === 'brand') f.brand = [parts[1]];
      else f[parts[0]] = parts[1];
      if (parts[0] === 'cat') f.sub = '';
      el.textContent = UI.toPersianDigits(Shop.query(f).length);
    });
  }

  function render() {
    var list = sortList(Shop.query(state), state.sort);
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    var page = Math.min(Math.max(1, Number(state.page) || 1), pages);
    var slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    var t = title();
    titleEl.textContent = t;
    crumb.textContent = t;
    document.title = t + ' | فیبسو';
    statusEl.textContent = UI.toPersianDigits(list.length) + ' کالا';
    resultCount.textContent = UI.toPersianDigits(list.length);

    Shop.render(grid, slice, 'li',
      '<li class="empty-state"><p>کالایی با این فیلترها پیدا نشد.</p>' +
      '<button class="btn btn--outline" type="button" data-clear-filters>حذف فیلترها</button></li>');

    var chips = activeChips();
    chipsEl.innerHTML = chips.map(function (c) {
      return '<li><button class="chip" type="button" data-remove-filter="' + c.key + '"' +
        (c.value ? ' data-value="' + Shop.escapeHtml(c.value) + '"' : '') + ' aria-label="حذف فیلتر ' + Shop.escapeHtml(c.label) + '">' +
        Shop.escapeHtml(c.label) +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></li>';
    }).join('');
    badge.hidden = !chips.length;
    badge.textContent = UI.toPersianDigits(chips.length);

    pager.hidden = pages < 2;
    var buttons = '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="صفحه قبل">‹</button>';
    for (var i = 1; i <= pages; i++) {
      buttons += '<button type="button" data-page="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + UI.toPersianDigits(i) + '</button>';
    }
    buttons += '<button type="button" data-page="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="صفحه بعد">›</button>';
    pager.innerHTML = buttons;

    counts();
  }

  function update(next, push) {
    state = next;
    writeState(state, push);
    syncForm();
    render();
  }

  /* ---------- Events ---------- */
  form.addEventListener('change', function () {
    var next = readForm();
    next.page = '';
    update(next, false);
  });

  sortEl.addEventListener('change', function () {
    var next = Object.assign({}, state, { sort: sortEl.value, page: '' });
    update(next, false);
  });

  document.addEventListener('click', function (event) {
    var chip = event.target.closest('[data-remove-filter]');
    if (chip) {
      var key = chip.getAttribute('data-remove-filter');
      var next = Object.assign({}, state, { page: '' });
      if (key === 'brand') next.brand = (state.brand || []).filter(function (b) { return b !== chip.getAttribute('data-value'); });
      else next[key] = '';
      if (key === 'cat') next.sub = '';
      update(next, false);
      (chipsEl.querySelector('.chip') || titleEl).focus();
      return;
    }
    if (event.target.closest('[data-clear-filters]')) {
      update({ sort: state.sort }, false);
      return;
    }
    var pageBtn = event.target.closest('[data-page]');
    if (pageBtn && !pageBtn.disabled) {
      update(Object.assign({}, state, { page: pageBtn.getAttribute('data-page') }), true);
      titleEl.setAttribute('tabindex', '-1');
      titleEl.focus({ preventScroll: true });
      titleEl.scrollIntoView({ block: 'start' });
    }
  });

  window.addEventListener('popstate', function () {
    state = readState();
    syncForm();
    render();
  });

  /* ---------- Mobile filter sheet ---------- */
  function openSheet() {
    panel.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    if (backdrop) backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    panel.querySelector('[data-filters-close]').focus();
  }

  function closeSheet() {
    if (!panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    if (backdrop) backdrop.hidden = true;
    document.body.style.overflow = '';
    openBtn.focus();
  }

  openBtn.addEventListener('click', openSheet);
  panel.querySelectorAll('[data-filters-close]').forEach(function (b) { b.addEventListener('click', closeSheet); });
  if (backdrop) backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // Keep the header search box in step with the current query
  var headerSearch = document.getElementById('search-q');
  if (headerSearch && state.q) headerSearch.value = state.q;

  Shop.onChange(function () { /* wishlist hearts are updated in place by shop.js */ });
  syncForm();
  render();
})();
