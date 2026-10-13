/* Store building blocks shared by every page: catalogue queries, product-card
   rendering, cart and wishlist (localStorage), mini cart drawer and toasts. */
(function () {
  'use strict';

  var products = window.SHOP_PRODUCTS || [];
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var root = document.documentElement.getAttribute('data-root') || '';
  var IMG_BASE = root + 'assets/images/products/';
  var PHOTO_BASE = root + 'assets/images/photos/';
  var photos = window.SHOP_PHOTOS || {};

  /* Real photo when one is registered (scripts/import-photos.py), else the drawing */
  function imageUrl(p) {
    return photos[p.id] ? PHOTO_BASE + photos[p.id] : IMG_BASE + p.img + '.svg';
  }
  var PRODUCT_URL = root + 'pages/product.html?id=';
  var CART_KEY = 'fibeso-cart';
  var WISH_KEY = 'fibeso-wishlist';
  var priceFmt = new Intl.NumberFormat('fa-IR');

  function formatPrice(n) { return priceFmt.format(n); }

  function read(key, fallback) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key));
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* page-view only */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Catalogue queries ----------
     filter keys: tag, cat, sub ("a|b"), condition, grade, brand, use, q ("a|b"), min, max, stock */
  function normalize(s) {
    return String(s).toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ');
  }

  function matches(p, f) {
    if (f.tag && p.tags.indexOf(f.tag) === -1) return false;
    if (f.cat && p.cat !== f.cat) return false;
    if (f.sub && String(f.sub).split('|').indexOf(p.sub) === -1) return false;
    if (f.condition && p.condition !== f.condition) return false;
    if (f.grade && p.grade !== f.grade) return false;
    if (f.brand && f.brand.length && [].concat(f.brand).indexOf(p.brand) === -1) return false;
    if (f.use && (!p.use || p.use.indexOf(f.use) === -1)) return false;
    if (f.min && p.price < Number(f.min)) return false;
    if (f.max && p.price > Number(f.max)) return false;
    if (f.stock && p.stock === 0) return false;
    if (f.q) {
      var hay = normalize(p.title + ' ' + p.catLabel + ' ' + (p.brand || ''));
      var any = normalize(f.q).split('|').some(function (alt) {
        return alt.split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) !== -1; });
      });
      if (!any) return false;
    }
    return true;
  }

  function query(f) {
    f = f || {};
    var list = products.filter(function (p) { return matches(p, f); });
    return f.limit ? list.slice(0, f.limit) : list;
  }

  /* ---------- Product card ---------- */
  var ic = window.icon || function () { return ''; };
  var ICON = {
    heart: ic('heart', 'icon-off') + ic('heart-fill', 'icon-on'),
    cart: ic('cart-plus'),
    star: ic('star-fill'),
    check: ic('check'),
    bag: ic('bag'),
    x: ic('x'),
    stock: ic('package'),
    timer: ic('timer')
  };

  function discountOf(p) {
    return p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  }

  function conditionHTML(p) {
    return p.condition === 'used'
      ? '<span class="condition condition--used">استوک' + (p.grade ? ' · درجه ' + p.grade : '') + '</span>'
      : '<span class="condition condition--new">نو</span>';
  }

  function priceHTML(p) {
    if (p.stock === 0) return '<span class="stock-out">ناموجود</span>';
    return '<div class="price">' +
      '<span class="price__now">' + formatPrice(p.price) + ' <span class="price__unit">تومان</span></span>' +
      (p.old ? '<del class="price__old"><span class="visually-hidden">قیمت قبلی: </span>' + formatPrice(p.old) + '</del>' : '') +
    '</div>';
  }

  /* Up to three key specs shown as an icon row on cards (laptops: screen, CPU, RAM) */
  var SPEC_ICON = [[/پورت/, 'network'], [/بی‌سیم|باند|Wi-Fi/, 'wifi'], [/ظرفیت|حافظه/, 'hard-drive'],
    [/توان|تغذیه|درگاه/, 'plugs'], [/نوع|رابط|رده|اتصال/, 'cpu'], [/نصب|ارتفاع|عمق|طول/, 'rack']];
  function cardSpecs(p) {
    if (p.cat === 'laptop') {
      var cpu = (p.cpu.match(/Core i\d|Ryzen \d|Celeron|Apple \w+/) || [p.cpu.split(' ').slice(-1)[0]])[0];
      return [
        ['monitor', p.screen.split(' ').slice(0, 2).join(' ')],
        ['cpu', cpu],
        ['memory', p.ram.split(' ')[0] + ' گیگ']
      ];
    }
    return (p.specs || []).filter(function (s) { return !/وضعیت ظاهری/.test(s[0]); }).slice(0, 3).map(function (s) {
      var name = 'info';
      SPEC_ICON.some(function (m) { if (m[0].test(s[0])) { name = m[1]; return true; } return false; });
      var v = s[1].replace(/\s*\(.*\)/, '');
      return [name, v.length > 16 ? v.slice(0, 15) + '…' : v];
    });
  }

  /* Timed offers: each product gets a stable end time later today (demo data) */
  function offerEnd(p) {
    var h = 0;
    for (var i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) % 997;
    var d = new Date();
    d.setHours(18 + (h % 6), (h * 7) % 60, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }

  function countdownText(end) {
    var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    var hh = Math.floor(left / 3600), mm = Math.floor(left / 60) % 60, ss = left % 60;
    return [hh, mm, ss].map(function (n) { return faPad(n); }).join(':');
  }
  var faDigits = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });
  function faPad(n) { return faDigits.format(n); }

  var countdownTimer = null;
  function startCountdowns() {
    if (countdownTimer) return;
    var tick = function () {
      var els = document.querySelectorAll('[data-countdown]');
      if (!els.length) { window.clearInterval(countdownTimer); countdownTimer = null; return; }
      els.forEach(function (el) { el.textContent = countdownText(Number(el.getAttribute('data-countdown'))); });
    };
    countdownTimer = window.setInterval(tick, 1000);
    tick();
  }

  /* opts.timer: show the "special offer" band with a countdown (discounted items only) */
  function cardHTML(p, opts) {
    opts = opts || {};
    var off = discountOf(p);
    var wished = wishlist.indexOf(p.id) !== -1;
    var low = p.stock > 0 && p.stock <= 3;
    var timer = opts.timer && off && p.stock !== 0;
    var end = timer ? offerEnd(p) : 0;

    return '<article class="product-card' + (p.stock === 0 ? ' product-card--out' : '') + (timer ? ' product-card--timer' : '') + '">' +
      (timer ? '<p class="product-card__timer"><span>تخفیف ویژه</span>' +
        '<span class="visually-hidden">زمان باقی‌مانده: </span><time class="countdown" data-countdown="' + end + '">' + countdownText(end) + '</time></p>' : '') +
      '<div class="product-card__media">' +
        '<img src="' + imageUrl(p) + '" alt="" width="400" height="400" loading="lazy">' +
        '<div class="product-card__flags">' + conditionHTML(p) + '</div>' +
        '<button class="product-card__wish" type="button" data-wish="' + p.id + '" aria-pressed="' + wished + '" aria-label="افزودن ' + escapeHtml(p.title) + ' به علاقه‌مندی‌ها">' + ICON.heart + '</button>' +
      '</div>' +
      '<ul class="product-card__specs" aria-label="مشخصات کلیدی">' + cardSpecs(p).map(function (s) {
        return '<li>' + ic(s[0]) + '<span>' + escapeHtml(s[1]) + '</span></li>';
      }).join('') + '</ul>' +
      '<h3 class="product-card__title"><a href="' + PRODUCT_URL + p.id + '">' + escapeHtml(p.title) + '</a></h3>' +
      '<div class="product-card__meta">' +
        '<span class="product-card__rating">' + ICON.star + formatPrice(p.rating) +
        '<span class="visually-hidden"> از ۵، ' + formatPrice(p.reviews) + ' نظر</span></span>' +
        (low ? '<span class="stock-low">' + ICON.stock + formatPrice(p.stock) + ' عدد در انبار باقی مانده</span>' : '') +
      '</div>' +
      '<div class="product-card__foot">' +
        (off && p.stock !== 0 ? '<span class="discount"><span class="visually-hidden">تخفیف </span>' + formatPrice(off) + '٪</span>' : '') +
        priceHTML(p) +
      '</div>' +
    '</article>';
  }

  function render(container, list, wrapTag, emptyHTML, opts) {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = emptyHTML || '<li class="empty-state">محصولی برای نمایش وجود ندارد.</li>';
      return;
    }
    container.innerHTML = list.map(function (p) {
      var card = cardHTML(p, opts);
      return wrapTag ? '<' + wrapTag + '>' + card + '</' + wrapTag + '>' : card;
    }).join('');
    if (opts && opts.timer) startCountdowns();
  }

  /* ---------- Toast ---------- */
  var toastRegion;
  var toastTimer;
  function toast(message) {
    if (!toastRegion) {
      toastRegion = document.createElement('div');
      toastRegion.className = 'toast-region';
      toastRegion.setAttribute('role', 'status');
      toastRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRegion);
    }
    window.clearTimeout(toastTimer);
    toastRegion.innerHTML = '<div class="toast">' + ICON.check + '<span>' + escapeHtml(message) + '</span></div>';
    toastTimer = window.setTimeout(function () { toastRegion.innerHTML = ''; }, 3200);
  }

  /* ---------- Wishlist ---------- */
  var wishlist = read(WISH_KEY, []);
  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) { fn(); });
  }

  function updateWishCount() {
    document.querySelectorAll('[data-wish-count]').forEach(function (el) {
      el.textContent = formatPrice(wishlist.length);
      el.hidden = wishlist.length === 0;
    });
  }

  function toggleWish(id) {
    var i = wishlist.indexOf(id);
    if (i === -1) wishlist.push(id); else wishlist.splice(i, 1);
    write(WISH_KEY, wishlist);
    document.querySelectorAll('[data-wish="' + id + '"]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(i === -1));
    });
    updateWishCount();
    emit();
    return i === -1;
  }

  /* ---------- Recently viewed (product page records, cart/account show) ---------- */
  var RECENT_KEY = 'fibeso-recent';
  function recent() {
    return read(RECENT_KEY, []).filter(function (id) { return byId[id]; }).map(function (id) { return byId[id]; });
  }
  function addRecent(id) {
    if (!byId[id]) return;
    var list = read(RECENT_KEY, []).filter(function (x) { return x !== id; });
    list.unshift(id);
    write(RECENT_KEY, list.slice(0, 12));
  }

  /* ---------- Cart ---------- */
  var cart = read(CART_KEY, {}); // { productId: qty }
  var MAX_QTY = 10;

  function cartItems() {
    return Object.keys(cart).filter(function (id) { return byId[id] && cart[id] > 0 && byId[id].stock !== 0; })
      .map(function (id) { return { product: byId[id], qty: cart[id] }; });
  }

  function cartTotals() {
    var items = cartItems();
    var subtotal = 0;
    var listTotal = 0;
    items.forEach(function (i) {
      subtotal += i.qty * i.product.price;
      listTotal += i.qty * (i.product.old || i.product.price);
    });
    return {
      count: items.reduce(function (s, i) { return s + i.qty; }, 0),
      subtotal: subtotal,
      savings: listTotal - subtotal,
      freeShipping: subtotal >= 5000000
    };
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, MAX_QTY);
    write(CART_KEY, cart);
    renderMiniCart();
    emit();
  }

  function clearCart() {
    cart = {};
    write(CART_KEY, cart);
    renderMiniCart();
    emit();
  }

  var drawer = document.querySelector('[data-cart-drawer]');
  var backdrop = document.querySelector('[data-backdrop]');
  var lastFocus = null;

  function renderMiniCart() {
    var totals = cartTotals();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = formatPrice(totals.count);
      el.hidden = totals.count === 0;
    });
    document.querySelectorAll('[data-cart-trigger]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'سبد خرید، ' + formatPrice(totals.count) + ' کالا');
    });
    if (!drawer) return;

    var body = drawer.querySelector('[data-cart-body]');
    var foot = drawer.querySelector('[data-cart-foot]');
    var items = cartItems();
    if (!items.length) {
      body.innerHTML = '<div class="empty-state">' + ICON.bag + '<p>سبد خرید شما خالی است.</p>' +
        '<a class="btn btn--outline" href="' + root + 'pages/shop.html">مشاهده محصولات</a></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = '<ul>' + items.map(function (i) {
      var p = i.product;
      return '<li class="cart-line">' +
        '<img src="' + imageUrl(p) + '" alt="" width="64" height="64">' +
        '<div><p class="cart-line__title"><a href="' + PRODUCT_URL + p.id + '">' + escapeHtml(p.title) + '</a></p>' +
        '<p class="cart-line__meta">' + formatPrice(p.price) + ' تومان</p></div>' +
        qtyHTML(p, i.qty) +
        '</li>';
    }).join('') + '</ul>';
    drawer.querySelector('[data-cart-total]').textContent = formatPrice(totals.subtotal) + ' تومان';
  }

  function qtyHTML(p, qty) {
    return '<div class="qty" role="group" aria-label="تعداد ' + escapeHtml(p.title) + '">' +
      '<button type="button" data-qty="' + p.id + '" data-step="1" aria-label="افزایش تعداد"' + (qty >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
      '<output aria-live="polite">' + formatPrice(qty) + '</output>' +
      '<button type="button" data-qty="' + p.id + '" data-step="-1" aria-label="' + (qty === 1 ? 'حذف از سبد' : 'کاهش تعداد') + '">−</button>' +
    '</div>';
  }

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    drawer.querySelector('[data-cart-close]').focus();
  }

  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Event delegation ---------- */
  document.addEventListener('click', function (event) {
    var add = event.target.closest('[data-add-to-cart]');
    if (add) {
      var id = add.getAttribute('data-add-to-cart');
      var amount = Number(add.getAttribute('data-amount') || 1);
      setQty(id, (cart[id] || 0) + amount);
      add.classList.add('is-added');
      window.setTimeout(function () { add.classList.remove('is-added'); }, 900);
      toast('«' + byId[id].title.split(' ').slice(0, 5).join(' ') + '…» به سبد خرید اضافه شد');
      return;
    }

    var wish = event.target.closest('[data-wish]');
    if (wish) {
      var added = toggleWish(wish.getAttribute('data-wish'));
      toast(added ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
      return;
    }

    var qty = event.target.closest('[data-qty]');
    if (qty) {
      var qid = qty.getAttribute('data-qty');
      var container = qty.closest('[data-cart-drawer], [data-cart-page]');
      setQty(qid, (cart[qid] || 0) + Number(qty.getAttribute('data-step')));
      // Keep keyboard focus on the same control after the list re-renders
      if (container) {
        var same = container.querySelector('[data-qty="' + qid + '"][data-step="' + qty.getAttribute('data-step') + '"]');
        (same || container.querySelector('[data-qty]') || container).focus();
      }
      return;
    }

    var removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) {
      setQty(removeBtn.getAttribute('data-remove'), 0);
      toast('کالا از سبد خرید حذف شد');
      return;
    }

    if (event.target.closest('[data-cart-trigger]')) { openCart(); return; }
    if (event.target.closest('[data-cart-close]') || event.target.closest('[data-backdrop]')) closeCart();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCart();
  });

  // Keep counts in sync when another tab changes the cart or wishlist
  window.addEventListener('storage', function (event) {
    if (event.key === CART_KEY) { cart = read(CART_KEY, {}); renderMiniCart(); emit(); }
    if (event.key === WISH_KEY) { wishlist = read(WISH_KEY, []); updateWishCount(); emit(); }
  });

  renderMiniCart();
  updateWishCount();

  window.Shop = {
    root: root,
    products: products,
    byId: function (id) { return byId[id]; },
    query: query,
    matches: matches,
    render: render,
    cardHTML: cardHTML,
    cardSpecs: cardSpecs,
    offerEnd: offerEnd,
    startCountdowns: startCountdowns,
    conditionHTML: conditionHTML,
    priceHTML: priceHTML,
    qtyHTML: qtyHTML,
    discountOf: discountOf,
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    imageUrl: imageUrl,
    productUrl: function (p) { return PRODUCT_URL + p.id; },
    toast: toast,
    icon: ICON,
    wishlist: function () { return wishlist.slice(); },
    toggleWish: toggleWish,
    cartItems: cartItems,
    cartTotals: cartTotals,
    cartQty: function (id) { return cart[id] || 0; },
    setQty: setQty,
    clearCart: clearCart,
    recent: recent,
    addRecent: addRecent,
    onChange: function (fn) { listeners.push(fn); }
  };
})();
