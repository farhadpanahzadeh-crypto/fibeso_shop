/* Store building blocks shared by every shop page:
   product-card rendering, mini cart (localStorage), wishlist, toasts. */
(function () {
  'use strict';

  var products = window.SHOP_PRODUCTS || [];
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var priceFmt = new Intl.NumberFormat('fa-IR');
  var IMG_BASE = 'assets/images/products/';
  var CART_KEY = 'fibeso-cart';
  var WISH_KEY = 'fibeso-wishlist';

  function formatPrice(n) {
    return priceFmt.format(n);
  }

  function read(key, fallback) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key));
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable: state lives for this page view only */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.25"/><circle cx="18" cy="20" r="1.25"/><path d="M2.5 3h2.6l2.4 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21.5 7H6"/><path d="M12 8v5M9.5 10.5h5"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  /* ---------- Product card template ---------- */
  function discountOf(p) {
    return p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  }

  function conditionHTML(p) {
    return p.condition === 'used'
      ? '<span class="condition condition--used">استوک' + (p.grade ? ' · درجه ' + p.grade : '') + '</span>'
      : '<span class="condition condition--new">نو</span>';
  }

  function cardHTML(p) {
    var off = discountOf(p);
    var out = p.stock === 0;
    var wished = wishlist.indexOf(p.id) !== -1;
    var priceBlock = out
      ? '<span class="stock-out">ناموجود</span>'
      : '<div class="price">' +
          (p.old ? '<del class="price__old"><span class="visually-hidden">قیمت قبلی: </span>' + formatPrice(p.old) + '</del>' : '') +
          '<span class="price__now">' + formatPrice(p.price) + ' <span class="price__unit">تومان</span></span>' +
        '</div>';
    var cartBtn = out ? '' :
      '<button class="add-to-cart" type="button" data-add-to-cart="' + p.id + '" aria-label="افزودن ' + escapeHtml(p.title) + ' به سبد خرید">' + ICON.cart + '</button>';

    return '<article class="product-card' + (out ? ' product-card--out' : '') + '">' +
      '<div class="product-card__media">' +
        '<img src="' + IMG_BASE + p.img + '.svg" alt="' + escapeHtml(p.title) + '" width="400" height="400" loading="lazy">' +
        '<div class="product-card__flags">' +
          (off ? '<span class="discount"><span class="visually-hidden">تخفیف </span>-' + formatPrice(off) + '٪</span>' : '') +
        '</div>' +
        '<button class="product-card__wish" type="button" data-wish="' + p.id + '" aria-pressed="' + wished + '" aria-label="افزودن به علاقه‌مندی‌ها">' + ICON.heart + '</button>' +
      '</div>' +
      '<div class="product-card__body">' +
        '<h3 class="product-card__title">' + escapeHtml(p.title) + '</h3>' +
        '<div class="product-card__meta">' + conditionHTML(p) +
          '<span class="product-card__rating">' + ICON.star + formatPrice(p.rating) +
          ' <span>(' + formatPrice(p.reviews) + ')</span><span class="visually-hidden"> نظر</span></span>' +
        '</div>' +
        '<div class="product-card__foot">' + priceBlock + cartBtn + '</div>' +
      '</div>' +
    '</article>';
  }

  /* Render products into a container: wrapTag lets lists use <li>. */
  function render(container, list, wrapTag) {
    if (!list.length) {
      container.innerHTML = '<p class="empty-state">محصولی برای نمایش وجود ندارد.</p>';
      return;
    }
    container.innerHTML = list.map(function (p) {
      return wrapTag ? '<' + wrapTag + '>' + cardHTML(p) + '</' + wrapTag + '>' : cardHTML(p);
    }).join('');
  }

  function query(filter) {
    return products.filter(function (p) {
      if (filter.tag && p.tags.indexOf(filter.tag) === -1) return false;
      if (filter.cat && p.cat !== filter.cat) return false;
      return true;
    }).slice(0, filter.limit || products.length);
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

  function updateWishCount() {
    document.querySelectorAll('[data-wish-count]').forEach(function (el) {
      el.textContent = formatPrice(wishlist.length);
      el.hidden = wishlist.length === 0;
    });
  }

  /* ---------- Cart ---------- */
  var cart = read(CART_KEY, {}); // { productId: qty }

  function cartItems() {
    return Object.keys(cart).filter(function (id) { return byId[id] && cart[id] > 0; })
      .map(function (id) { return { product: byId[id], qty: cart[id] }; });
  }

  function cartCount() {
    return cartItems().reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, 10);
    write(CART_KEY, cart);
    renderCart();
  }

  var drawer = document.querySelector('[data-cart-drawer]');
  var backdrop = document.querySelector('[data-backdrop]');
  var lastFocus = null;

  function renderCart() {
    var count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = formatPrice(count);
      el.hidden = count === 0;
    });
    document.querySelectorAll('[data-cart-trigger]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'سبد خرید، ' + formatPrice(count) + ' کالا');
    });
    if (!drawer) return;

    var body = drawer.querySelector('[data-cart-body]');
    var foot = drawer.querySelector('[data-cart-foot]');
    var items = cartItems();
    if (!items.length) {
      body.innerHTML = '<div class="empty-state">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.25"/><circle cx="18" cy="20" r="1.25"/><path d="M2.5 3h2.6l2.4 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21.5 7H6"/></svg>' +
        '<p>سبد خرید شما خالی است.</p></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = '<ul>' + items.map(function (i) {
      var p = i.product;
      return '<li class="cart-line">' +
        '<img src="' + IMG_BASE + p.img + '.svg" alt="" width="64" height="64">' +
        '<div><p class="cart-line__title">' + escapeHtml(p.title) + '</p>' +
        '<p class="cart-line__meta">' + formatPrice(p.price) + ' تومان</p></div>' +
        '<div class="qty" role="group" aria-label="تعداد ' + escapeHtml(p.title) + '">' +
          '<button type="button" data-qty="' + p.id + '" data-step="1" aria-label="افزایش تعداد">+</button>' +
          '<output aria-live="polite">' + formatPrice(i.qty) + '</output>' +
          '<button type="button" data-qty="' + p.id + '" data-step="-1" aria-label="' + (i.qty === 1 ? 'حذف از سبد' : 'کاهش تعداد') + '">−</button>' +
        '</div></li>';
    }).join('') + '</ul>';
    var total = items.reduce(function (sum, i) { return sum + i.qty * i.product.price; }, 0);
    drawer.querySelector('[data-cart-total]').textContent = formatPrice(total) + ' تومان';
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
    if (backdrop && !document.querySelector('[data-nav]:not([hidden]).is-drawer')) backdrop.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Event delegation ---------- */
  document.addEventListener('click', function (event) {
    var add = event.target.closest('[data-add-to-cart]');
    if (add) {
      var id = add.getAttribute('data-add-to-cart');
      setQty(id, (cart[id] || 0) + 1);
      add.classList.add('is-added');
      window.setTimeout(function () { add.classList.remove('is-added'); }, 900);
      toast('«' + byId[id].title.split('،')[0] + '» به سبد خرید اضافه شد');
      return;
    }

    var wish = event.target.closest('[data-wish]');
    if (wish) {
      var wid = wish.getAttribute('data-wish');
      var i = wishlist.indexOf(wid);
      if (i === -1) wishlist.push(wid); else wishlist.splice(i, 1);
      write(WISH_KEY, wishlist);
      document.querySelectorAll('[data-wish="' + wid + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(i === -1));
      });
      updateWishCount();
      toast(i === -1 ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد');
      return;
    }

    var qty = event.target.closest('[data-qty]');
    if (qty) {
      var qid = qty.getAttribute('data-qty');
      setQty(qid, (cart[qid] || 0) + Number(qty.getAttribute('data-step')));
      var stillThere = drawer && drawer.querySelector('[data-qty="' + qid + '"]');
      (stillThere || drawer.querySelector('[data-cart-close]')).focus();
      return;
    }

    if (event.target.closest('[data-cart-trigger]')) { openCart(); return; }
    if (event.target.closest('[data-cart-close]') || event.target.closest('[data-backdrop]')) closeCart();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCart();
  });

  renderCart();
  updateWishCount();

  window.Shop = {
    products: products,
    query: query,
    render: render,
    formatPrice: formatPrice,
    toast: toast,
    wishlist: function () { return wishlist.slice(); }
  };
})();
