/* Shop listing / category / search page.
   Everything is driven by the URL (cat, sub, condition, grade, brand, use, cpu, ram, q, tag,
   min, max, stock, fast, sort, page): filters write it with replaceState, sub-category tiles and
   pagination push a history entry, and back/forward re-render from it. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var PER_PAGE = 12;
  var root = document.documentElement.getAttribute('data-root') || '';
  var SHOP_URL = root + 'pages/shop.html';
  var IMG = root + 'assets/images/products/';
  var icon = window.icon || function () { return ''; };
  var fa = UI.toPersianDigits;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var form = $('[data-filter-form]');
  var grid = $('[data-shop-grid]');
  var titleEl = $('[data-shop-title]');
  var crumbs = $('[data-crumbs]');
  var subcats = $('[data-subcats]');
  var subcatList = $('[data-subcats-list]');
  var activeWrap = $('[data-active-wrap]');
  var chipsEl = $('[data-active-filters]');
  var pager = $('[data-pagination]');
  var statusEl = $('[data-shop-status]');
  var panel = $('[data-filters]');
  var sortSheet = $('[data-sort-sheet]');
  var scrim = $('[data-sheet-scrim]');
  var filtersOpen = $('[data-filters-open]');
  var sortOpen = $('[data-sort-open]');
  if (!form || !grid) return;

  /* ---------- Vocabulary ---------- */
  var CAT = { laptop: 'لپ‌تاپ', network: 'تجهیزات شبکه', parts: 'قطعات و لوازم جانبی' };
  var CONDITION = { 'new': 'نو', used: 'استوک' };
  var SUB = {
    router: 'روتر', 'switch': 'سوییچ', ap: 'اکسس پوینت', nic: 'کارت شبکه', rack: 'رک', cable: 'کابل',
    ram: 'رم', ssd: 'SSD', charger: 'شارژر', mouse: 'ماوس',
    'rack|cable': 'رک و کابل', 'rack|nic': 'رک و کارت شبکه'
  };
  var SUB_CAT = { router: 'network', 'switch': 'network', ap: 'network', nic: 'network', rack: 'network', cable: 'network',
    ram: 'parts', ssd: 'parts', charger: 'parts', mouse: 'parts' };
  var USE = { gaming: 'گیمینگ', engineering: 'مهندسی', office: 'اداری', student: 'اقتصادی', light: 'سبک و باریک' };

  /* Sub-category tiles per category: [label, image, params] */
  var TILES = {
    '': [
      ['لپ‌تاپ نو', 'laptop-ultrabook', { cat: 'laptop', condition: 'new' }],
      ['لپ‌تاپ استوک', 'laptop-used-a', { cat: 'laptop', condition: 'used' }],
      ['تجهیزات شبکه', 'router', { cat: 'network' }],
      ['قطعات لپ‌تاپ', 'ram', { cat: 'parts' }],
      ['تخفیف‌دارها', 'laptop-gaming', { tag: 'offer' }]
    ],
    laptop: [
      ['نو', 'laptop-ultrabook', { cat: 'laptop', condition: 'new' }],
      ['استوک', 'laptop-used-a', { cat: 'laptop', condition: 'used' }],
      ['گیمینگ', 'laptop-gaming', { cat: 'laptop', use: 'gaming' }],
      ['مهندسی', 'laptop-workstation', { cat: 'laptop', use: 'engineering' }],
      ['اداری', 'laptop-business', { cat: 'laptop', use: 'office' }],
      ['اقتصادی', 'laptop-used-b', { cat: 'laptop', use: 'student' }]
    ],
    network: [
      ['روتر', 'router', { cat: 'network', sub: 'router' }],
      ['سوییچ', 'switch', { cat: 'network', sub: 'switch' }],
      ['اکسس پوینت', 'access-point', { cat: 'network', sub: 'ap' }],
      ['کارت شبکه', 'nic', { cat: 'network', sub: 'nic' }],
      ['رک', 'rack', { cat: 'network', sub: 'rack' }],
      ['کابل', 'cable', { cat: 'network', sub: 'cable' }]
    ],
    parts: [
      ['رم', 'ram', { cat: 'parts', sub: 'ram' }],
      ['SSD', 'ssd', { cat: 'parts', sub: 'ssd' }],
      ['شارژر', 'adapter', { cat: 'parts', sub: 'charger' }],
      ['ماوس', 'mouse', { cat: 'parts', sub: 'mouse' }]
    ]
  };

  var SORTS = [
    ['relevant', 'مرتبط‌ترین'],
    ['popular', 'پرفروش‌ترین'],
    ['expensive', 'بیشترین قیمت'],
    ['cheap', 'کمترین قیمت'],
    ['newest', 'جدیدترین'],
    ['discount', 'بیشترین تخفیف']
  ];

  /* Laptop facets derived from the catalogue */
  function cpuOf(p) {
    var m = (p.cpu || '').match(/Core i\d|Ryzen \d|Celeron|Apple \w+/);
    return m ? m[0] : '';
  }
  function ramOf(p) {
    var m = UI.toLatinDigits(p.ram || '').match(/\d+/);
    return m ? m[0] : '';
  }
  /* Demo "fast shipping" flag: in stock with healthy warehouse stock (ships same day in Tehran) */
  function isFast(p) {
    return p.stock !== 0 && !(p.stock < 3);
  }
  var ORDER = {};
  Shop.products.forEach(function (p, i) { ORDER[p.id] = i; });

  /* ---------- State <-> URL ---------- */
  var KEYS = ['q', 'cat', 'sub', 'condition', 'grade', 'brand', 'use', 'cpu', 'ram', 'min', 'max', 'stock', 'fast', 'tag', 'sort', 'page'];
  var LISTS = { brand: 1, cpu: 1, ram: 1 };

  function readState() {
    var params = new URLSearchParams(window.location.search);
    var s = {};
    KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) s[k] = LISTS[k] ? v.split(',').filter(Boolean) : v.trim();
    });
    if (s.sub && !s.cat && SUB_CAT[s.sub.split('|')[0]]) s.cat = SUB_CAT[s.sub.split('|')[0]];
    return s;
  }

  function urlFor(s) {
    var params = new URLSearchParams();
    KEYS.forEach(function (k) {
      var v = s[k];
      if (v && (!Array.isArray(v) || v.length)) params.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    var qs = params.toString().replace(/%7C/gi, '|').replace(/%2C/gi, ',');
    return window.location.pathname + (qs ? '?' + qs : '');
  }

  function defaultSort(s) { return s.q ? 'relevant' : 'popular'; }
  function sortOf(s) {
    var v = s.sort;
    if (!v || (v === 'relevant' && !s.q)) return defaultSort(s);
    return v;
  }

  var state = readState();

  /* ---------- Querying ---------- */
  function filtered(s, skip) {
    var f = {};
    Object.keys(s).forEach(function (k) { if (k !== skip) f[k] = s[k]; });
    var list = Shop.query({
      q: f.q, cat: f.cat, sub: f.sub, condition: f.condition, grade: f.grade, brand: f.brand, use: f.use,
      tag: f.tag, min: f.min, max: f.max, stock: f.stock
    });
    return list.filter(function (p) {
      if (f.fast && !isFast(p)) return false;
      if (f.cpu && f.cpu.length && f.cpu.indexOf(cpuOf(p)) === -1) return false;
      if (f.ram && f.ram.length && f.ram.indexOf(ramOf(p)) === -1) return false;
      return true;
    });
  }

  function relevance(p, q) {
    var words = q.toLowerCase().split(/[\s|]+/).filter(Boolean);
    var title = p.title.toLowerCase();
    var score = 0;
    words.forEach(function (w) {
      if (title.indexOf(w) === 0) score += 3;
      else if (title.indexOf(w) !== -1) score += 2;
      if ((p.brand || '').toLowerCase() === w) score += 2;
    });
    return score;
  }

  function sortList(list, s) {
    var sort = sortOf(s);
    var copy = list.slice();
    var by = {
      relevant: function (a, b) { return relevance(b, s.q || '') - relevance(a, s.q || '') || b.reviews - a.reviews; },
      popular: function (a, b) { return b.reviews - a.reviews || b.rating - a.rating; },
      expensive: function (a, b) { return b.price - a.price; },
      cheap: function (a, b) { return a.price - b.price; },
      newest: function (a, b) { return ORDER[b.id] - ORDER[a.id]; },
      discount: function (a, b) { return Shop.discountOf(b) - Shop.discountOf(a); }
    }[sort];
    if (by) copy.sort(by);
    // Out-of-stock items always sink to the end
    copy.sort(function (a, b) { return (a.stock === 0) - (b.stock === 0); });
    return copy;
  }

  /* ---------- Facet option lists (built once from the catalogue) ---------- */
  function uniq(values) {
    var seen = {};
    return values.filter(function (v) { if (!v || seen[v]) return false; seen[v] = true; return true; });
  }
  var esc = Shop.escapeHtml;
  function checkHTML(name, value, label) {
    return '<label class="check"><input type="checkbox" name="' + name + '" value="' + esc(value) + '"> ' + esc(label) +
      ' <span class="check__count" data-count-for="' + name + ':' + esc(value) + '"></span></label>';
  }
  var brands = uniq(Shop.products.map(function (p) { return p.brand; })).sort(function (a, b) { return a.localeCompare(b, 'fa'); });
  $('[data-brand-list]').insertAdjacentHTML('beforeend', brands.map(function (b) { return checkHTML('brand', b, b); }).join(''));
  var laptops = Shop.products.filter(function (p) { return p.cat === 'laptop'; });
  var cpus = uniq(laptops.map(cpuOf)).sort();
  $('[data-cpu-list]').insertAdjacentHTML('beforeend', cpus.map(function (c) { return checkHTML('cpu', c, c); }).join(''));
  var rams = uniq(laptops.map(ramOf)).sort(function (a, b) { return a - b; });
  $('[data-ram-list]').insertAdjacentHTML('beforeend', rams.map(function (r) { return checkHTML('ram', r, fa(r) + ' گیگابایت'); }).join(''));

  /* ---------- Form <-> state ---------- */
  function millions(toman) { return toman ? fa(String(Math.round(Number(toman) / 1e5) / 10)) : ''; }
  function toToman(text) {
    var n = parseFloat(UI.toLatinDigits(String(text)).replace(/[^\d.]/g, ''));
    return n > 0 ? String(Math.round(n * 1e6)) : '';
  }

  function syncForm() {
    $$('input[type="radio"]', form).forEach(function (r) { r.checked = (state[r.name] || '') === r.value; });
    $$('input[type="checkbox"]', form).forEach(function (c) {
      var v = state[c.name];
      c.checked = Array.isArray(v) ? v.indexOf(c.value) !== -1 : v === c.value;
    });
    if (document.activeElement !== form.elements.min) form.elements.min.value = millions(state.min);
    if (document.activeElement !== form.elements.max) form.elements.max.value = millions(state.max);
  }

  function readForm() {
    var next = Object.assign({}, state, { page: '' });
    ['condition', 'grade', 'cat'].forEach(function (name) {
      var r = form.querySelector('input[name="' + name + '"]:checked');
      next[name] = r ? r.value : '';
    });
    ['brand', 'cpu', 'ram'].forEach(function (name) {
      next[name] = $$('input[name="' + name + '"]:checked', form).map(function (c) { return c.value; });
    });
    next.stock = form.elements.stock.checked ? '1' : '';
    next.fast = form.elements.fast.checked ? '1' : '';
    next.tag = form.elements.tag.checked ? 'offer' : '';
    next.min = toToman(form.elements.min.value);
    next.max = toToman(form.elements.max.value);
    if (next.condition === 'new') next.grade = '';
    // Sub-category and laptop-only facets only make sense inside their own category
    if (next.cat !== state.cat) {
      next.sub = '';
      next.use = '';
      if (next.cat !== 'laptop') { next.cpu = []; next.ram = []; }
    }
    return next;
  }

  /* ---------- Rendering ---------- */
  function title() {
    if (state.q) return 'نتایج جستجو برای «' + state.q.replace(/\|/g, '، ') + '»';
    if (state.tag === 'offer' && !state.cat) return 'پیشنهادهای ویژه فیبسو';
    var base = state.cat ? CAT[state.cat] : 'همه محصولات';
    if (state.sub) return (SUB[state.sub] || state.sub) + (state.cat === 'network' ? ' شبکه' : (state.cat === 'parts' ? ' لپ‌تاپ' : ''));
    if (state.cat === 'laptop') {
      var parts = ['لپ‌تاپ'];
      if (state.use) parts.push(USE[state.use] || state.use);
      if (state.condition) parts.push(state.condition === 'used' ? 'استوک' : 'نو');
      return parts.join(' ');
    }
    if (state.condition && state.cat) return base + ' ' + CONDITION[state.condition];
    return base;
  }

  function renderCrumbs(t) {
    var items = ['<li><a href="' + root + 'index.html">خانه</a></li>'];
    if (state.q) {
      items.push('<li><a href="' + SHOP_URL + '">فروشگاه</a></li>');
      items.push('<li aria-current="page">جستجو</li>');
    } else {
      if (state.cat) {
        items.push('<li><a href="' + SHOP_URL + '">فروشگاه</a></li>');
        var deeper = state.sub || state.use || state.condition;
        items.push(deeper ? '<li><a href="' + SHOP_URL + '?cat=' + state.cat + '" data-nav>' + CAT[state.cat] + '</a></li>' : '');
      }
      items.push('<li aria-current="page">' + esc(t) + '</li>');
    }
    crumbs.innerHTML = items.join('');
  }

  function tileMatches(params) {
    return Object.keys(params).every(function (k) { return state[k] === params[k]; }) &&
      ['sub', 'use', 'condition', 'tag'].every(function (k) { return k in params || !state[k]; });
  }

  function renderSubcats() {
    var tiles = state.q ? null : TILES[state.cat || ''];
    if (!state.cat && state.tag) tiles = null;
    subcats.hidden = !tiles;
    if (!tiles) return;
    subcatList.innerHTML = tiles.map(function (t) {
      var href = SHOP_URL + '?' + new URLSearchParams(t[2]).toString();
      var current = tileMatches(t[2]);
      return '<li><a class="subcat" href="' + href + '" data-nav' + (current ? ' aria-current="page"' : '') + '>' +
        '<img src="' + IMG + t[1] + '.svg" alt="" width="64" height="48" loading="lazy">' +
        '<span>' + esc(t[0]) + '</span></a></li>';
    }).join('');
  }

  function renderFacets() {
    var search = !!state.q;
    var show = {
      condition: !search,
      grade: !search && state.condition !== 'new' && filtered(Object.assign({}, state, { grade: '' })).some(function (p) { return p.grade; }),
      brand: true,
      cpu: !search && state.cat === 'laptop',
      ram: !search && state.cat === 'laptop',
      cat: true,
      price: true,
      offer: !search
    };
    $$('[data-facet]', form).forEach(function (el) { el.hidden = !show[el.getAttribute('data-facet')]; });

    // Counts: what each option would show, given the other active filters
    $$('[data-count-for]', form).forEach(function (el) {
      var parts = el.getAttribute('data-count-for').split(':');
      var key = parts[0];
      var value = parts.slice(1).join(':');
      var s = Object.assign({}, state);
      s[key] = LISTS[key] ? [value] : value;
      if (key === 'cat') { s.sub = ''; s.use = ''; s.cpu = []; s.ram = []; }
      var n = filtered(s).length;
      el.textContent = fa(n);
      var label = el.closest('.check');
      var input = label.querySelector('input');
      // Hide options that cannot match here, unless they are selected
      label.hidden = n === 0 && !input.checked;
    });
    // A facet whose options all dropped out is hidden too
    ['brand', 'cpu', 'ram'].forEach(function (name) {
      var facet = form.querySelector('[data-facet="' + name + '"]');
      if (!facet.hidden) facet.hidden = !$$('.check', facet).some(function (l) { return !l.hidden; });
    });
  }

  function chips() {
    var out = [];
    function add(key, label, value) { out.push({ key: key, label: label, value: value }); }
    // The query and the category define the page itself, so they are not shown as pills
    if (state.sub) add('sub', SUB[state.sub] || state.sub);
    if (state.use) add('use', USE[state.use] || state.use);
    if (state.condition) add('condition', CONDITION[state.condition]);
    if (state.grade) add('grade', 'درجه ' + state.grade);
    (state.brand || []).forEach(function (b) { add('brand', b, b); });
    (state.cpu || []).forEach(function (c) { add('cpu', c, c); });
    (state.ram || []).forEach(function (r) { add('ram', 'رم ' + fa(r) + ' گیگ', r); });
    if (state.min) add('min', 'از ' + millions(state.min) + ' میلیون');
    if (state.max) add('max', 'تا ' + millions(state.max) + ' میلیون');
    if (state.stock) add('stock', 'فقط موجود');
    if (state.fast) add('fast', 'ارسال فوری');
    if (state.tag) add('tag', state.tag === 'offer' ? 'تخفیف‌دار' : state.tag);
    return out;
  }

  function renderSort() {
    var current = sortOf(state);
    var options = SORTS.filter(function (o) { return o[0] !== 'relevant' || state.q; });
    $('[data-sort-options]').innerHTML = options.map(function (o) {
      return '<button type="button" data-sort="' + o[0] + '" aria-pressed="' + (o[0] === current) + '">' + o[1] + '</button>';
    }).join('');
    $('[data-sort-sheet-options]').innerHTML = options.map(function (o) {
      return '<button class="sheet__option" type="button" data-sort="' + o[0] + '" aria-pressed="' + (o[0] === current) + '">' +
        '<span>' + o[1] + '</span>' + icon('check', 'sheet__check') + '</button>';
    }).join('');
    var label = options.filter(function (o) { return o[0] === current; })[0];
    $('[data-sort-current]').textContent = label ? label[1] : '';
  }

  function emptyHTML() {
    var suggestions = [['لپ‌تاپ استوک', '?cat=laptop&condition=used'], ['روتر', '?cat=network&sub=router'],
      ['رم لپ‌تاپ', '?cat=parts&sub=ram'], ['ThinkPad', '?q=ThinkPad']];
    var heading = state.q
      ? 'برای «' + esc(state.q) + '» کالایی پیدا نکردیم'
      : 'کالایی با این فیلترها پیدا نشد';
    var hint = state.q
      ? 'املای عبارت را بررسی کنید یا با کلمه‌ای کلی‌تر مثل نام برند یا مدل جستجو کنید.'
      : 'چند فیلتر را بردارید یا محدوده قیمت را بازتر کنید.';
    return '<li class="empty-state shop-empty">' + icon('package') +
      '<h2 class="shop-empty__title">' + heading + '</h2><p>' + hint + '</p>' +
      (chips().length ? '<button class="btn btn--primary" type="button" data-clear-filters>حذف همه فیلترها</button>' : '') +
      '<p class="shop-empty__label">شاید این‌ها به کارتان بیاید:</p><ul class="shop-empty__links">' +
      suggestions.map(function (s) { return '<li><a href="' + SHOP_URL + s[1] + '" data-nav>' + s[0] + '</a></li>'; }).join('') +
      '</ul></li>';
  }

  function render() {
    var list = sortList(filtered(state), state);
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    var page = Math.min(Math.max(1, Number(UI.toLatinDigits(state.page || '1')) || 1), pages);
    var slice = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    var t = title();
    titleEl.textContent = t;
    document.title = t + ' | فیبسو';
    renderCrumbs(t);
    renderSubcats();

    var countText = fa(list.length) + ' کالا';
    $$('[data-count-text]').forEach(function (el) { el.textContent = countText; });
    $$('[data-result-count]').forEach(function (el) { el.textContent = fa(list.length); });
    statusEl.textContent = list.length ? countText + ' پیدا شد' : 'کالایی پیدا نشد';

    Shop.render(grid, slice, 'li', emptyHTML(), { timer: state.tag === 'offer' });

    var active = chips();
    activeWrap.hidden = !active.length;
    chipsEl.innerHTML = active.map(function (c) {
      return '<li><button class="filter-pill" type="button" data-remove-filter="' + c.key + '"' +
        (c.value ? ' data-value="' + esc(c.value) + '"' : '') + ' aria-label="حذف فیلتر ' + esc(c.label) + '">' +
        '<span>' + esc(c.label) + '</span>' + icon('x') + '</button></li>';
    }).join('');
    var filterCount = active.length;
    $$('[data-filter-badge]').forEach(function (b) { b.hidden = !filterCount; b.textContent = fa(filterCount); });
    if (filtersOpen) filtersOpen.setAttribute('aria-label', 'فیلترها' + (filterCount ? '، ' + fa(filterCount) + ' فیلتر فعال' : ''));

    renderPager(page, pages);
    renderSort();
    renderFacets();

    var headerSearch = document.getElementById('search-q');
    if (headerSearch && document.activeElement !== headerSearch) headerSearch.value = state.q || '';
  }

  function renderPager(page, pages) {
    pager.hidden = pages < 2;
    if (pages < 2) { pager.innerHTML = ''; return; }
    var html = '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="صفحه قبل">' + icon('caret-right') + '</button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" data-page="' + i + '"' + (i === page ? ' aria-current="page"' : '') + ' aria-label="صفحه ' + fa(i) + '">' + fa(i) + '</button>';
    }
    html += '<button type="button" data-page="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="صفحه بعد">' + icon('caret-left') + '</button>';
    pager.innerHTML = html;
  }

  function clean(s) {
    var out = {};
    Object.keys(s).forEach(function (k) {
      var v = s[k];
      if (v && (!Array.isArray(v) || v.length)) out[k] = v;
    });
    if (out.sort && out.sort === defaultSort(out)) delete out.sort;
    if (out.page === '1') delete out.page;
    return out;
  }

  function update(next, push) {
    state = clean(next);
    var url = urlFor(state);
    if (url !== window.location.pathname + window.location.search) {
      window.history[push ? 'pushState' : 'replaceState'](null, '', url);
    }
    syncForm();
    render();
  }

  /* ---------- Events ---------- */
  form.addEventListener('change', function (e) {
    if (e.target.name === 'min' || e.target.name === 'max') return; // handled on commit below
    update(readForm(), false);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); update(readForm(), false); });
  ['min', 'max'].forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('change', function () { update(readForm(), false); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  });

  document.addEventListener('click', function (event) {
    var t = event.target;

    var preset = t.closest('[data-price]');
    if (preset) {
      var range = preset.getAttribute('data-price').split('-');
      update(Object.assign({}, state, { min: range[0] ? String(range[0] * 1e6) : '', max: range[1] ? String(range[1] * 1e6) : '', page: '' }), false);
      return;
    }

    var sortBtn = t.closest('[data-sort]');
    if (sortBtn) {
      var inSheet = !!sortBtn.closest('[data-sort-sheet]');
      update(Object.assign({}, state, { sort: sortBtn.getAttribute('data-sort'), page: '' }), false);
      if (inSheet) closeSheet();
      return;
    }

    var pill = t.closest('[data-remove-filter]');
    if (pill) {
      var key = pill.getAttribute('data-remove-filter');
      var value = pill.getAttribute('data-value');
      var next = Object.assign({}, state, { page: '' });
      if (LISTS[key]) next[key] = (state[key] || []).filter(function (v) { return v !== value; });
      else next[key] = '';
      if (key === 'cat') { next.sub = ''; next.use = ''; next.cpu = []; next.ram = []; }
      if (key === 'condition') next.grade = '';
      update(next, false);
      var first = chipsEl.querySelector('.filter-pill');
      (first || titleEl).focus();
      return;
    }

    if (t.closest('[data-clear-filters]')) {
      // Keep the search query and category context; drop the refinements
      update({ q: state.q, cat: state.cat, sort: state.sort }, false);
      if (!panel.classList.contains('is-open')) titleEl.focus();
      return;
    }

    var pageBtn = t.closest('[data-page]');
    if (pageBtn && !pageBtn.disabled) {
      update(Object.assign({}, state, { page: pageBtn.getAttribute('data-page') }), true);
      titleEl.focus({ preventScroll: true });
      titleEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    // In-page navigation (sub-category tiles, crumbs, suggestions) without a reload
    var nav = t.closest('a[data-nav]');
    if (nav && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      window.history.pushState(null, '', nav.getAttribute('href'));
      state = readState();
      syncForm();
      render();
      titleEl.focus({ preventScroll: true });
    }
  });

  window.addEventListener('popstate', function () {
    state = readState();
    syncForm();
    render();
  });

  /* ---------- Desktop: collapse the filter body ---------- */
  var collapseBtn = $('[data-filters-collapse]');
  collapseBtn.addEventListener('click', function () {
    var open = collapseBtn.getAttribute('aria-expanded') === 'true';
    collapseBtn.setAttribute('aria-expanded', String(!open));
    collapseBtn.querySelector('.visually-hidden').textContent = open ? 'باز کردن فیلترها' : 'جمع کردن فیلترها';
    panel.classList.toggle('is-collapsed', open);
  });

  /* ---------- Phones and tablets: filter and sort sheets ---------- */
  var sheetQuery = window.matchMedia('(max-width: 63.99rem)');
  var openSheetEl = null;
  var opener = null;

  function focusables(el) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select, [tabindex]:not([tabindex="-1"])', el)
      .filter(function (x) { return x.offsetParent !== null; });
  }

  function openSheet(sheet, btn) {
    if (openSheetEl) closeSheet(true);
    openSheetEl = sheet;
    opener = btn;
    if (sheet === panel) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.classList.add('is-open');
    } else {
      sheet.hidden = false;
    }
    scrim.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('has-sheet');
    var target = sheet === panel ? sheet.querySelector('.facet__trigger, input') : sheet.querySelector('[aria-pressed="true"]');
    (target || sheet.querySelector('button')).focus();
  }

  function closeSheet(silent) {
    if (!openSheetEl) return;
    var sheet = openSheetEl;
    if (sheet === panel) {
      panel.classList.remove('is-open');
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    } else {
      sheet.hidden = true;
    }
    scrim.hidden = true;
    document.documentElement.classList.remove('has-sheet');
    if (opener) {
      opener.setAttribute('aria-expanded', 'false');
      if (!silent) opener.focus();
    }
    openSheetEl = null;
  }

  filtersOpen.addEventListener('click', function () { openSheet(panel, filtersOpen); });
  sortOpen.addEventListener('click', function () { openSheet(sortSheet, sortOpen); });
  $$('[data-sheet-close]').forEach(function (b) { b.addEventListener('click', function () { closeSheet(); }); });
  scrim.addEventListener('click', function () { closeSheet(); });

  document.addEventListener('keydown', function (e) {
    if (!openSheetEl) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key !== 'Tab') return;
    var items = focusables(openSheetEl);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Leaving the small-screen layout closes any open sheet
  var onMedia = function (mq) { if (!mq.matches) closeSheet(true); };
  if (sheetQuery.addEventListener) sheetQuery.addEventListener('change', onMedia);
  else if (sheetQuery.addListener) sheetQuery.addListener(onMedia);

  // Open the facets that hold an active value
  function openActiveFacets() {
    var map = { condition: 'condition', grade: 'grade', brand: 'brand', cpu: 'cpu', ram: 'ram', cat: 'cat', min: 'price', max: 'price', tag: 'offer' };
    Object.keys(map).forEach(function (k) {
      var v = state[k];
      if (!v || (Array.isArray(v) && !v.length)) return;
      var trigger = form.querySelector('[aria-controls="facet-' + map[k] + '"]');
      if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
        trigger.setAttribute('aria-expanded', 'true');
        document.getElementById('facet-' + map[k]).hidden = false;
      }
    });
  }

  if (state.page === '1') delete state.page;
  syncForm();
  openActiveFacets();
  render();
})();
