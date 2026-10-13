/* Checkout in two steps on one page: shipping (address, day, method) and payment.
   The order is stored locally through Store (no backend, no real payment). */
(function () {
  'use strict';

  var Shop = window.Shop;
  var Store = window.Store;
  if (!Shop || !Store) return;

  var user = Store.requireUser();
  if (!user) return;

  var rootEl = document.querySelector('[data-checkout]');
  var dialogs = {
    add: document.querySelector('[data-dialog="add"]'),
    pick: document.querySelector('[data-dialog="pick"]')
  };
  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;
  var ic = window.icon;
  var CART_URL = Shop.root + 'pages/cart.html';
  var STATE_KEY = 'fibeso-checkout';

  var METHODS = [
    { id: 'courier', title: 'پیک تهران', text: 'تحویل در روز انتخابی بین ساعت ۹ تا ۱۸؛ فقط شهر تهران', price: 120000, icon: 'lightning', tehran: true },
    { id: 'post', title: 'پست پیشتاز', text: 'تحویل به پست در روز انتخابی؛ رسیدن ۲ تا ۴ روز کاری در سراسر کشور', price: 180000, icon: 'package' },
    { id: 'tipax', title: 'تیپاکس', text: 'مناسب رک، سوییچ و بسته‌های حجیم؛ رسیدن ۱ تا ۳ روز کاری', price: 260000, icon: 'truck' }
  ];
  var PAYMENTS = [
    { id: 'online', title: 'پرداخت اینترنتی', text: 'پرداخت آنلاین با کارت‌های بانکی', icon: 'credit-card' },
    { id: 'cod', title: 'پرداخت در محل (فقط تهران)', text: 'پرداخت با کارتخوان هنگام تحویل؛ فقط برای ارسال با پیک تهران', icon: 'wallet' },
    { id: 'invoice', title: 'پیش‌فاکتور و پرداخت سازمانی', text: 'برای شرکت‌ها و سازمان‌ها: پیش‌فاکتور رسمی با کد اقتصادی و پرداخت از حساب شرکت', icon: 'buildings' }
  ];

  /* ---------- State (kept for this tab so a reload does not lose choices) ---------- */
  var state = { addressId: null, day: null, method: null, payment: 'online' };
  try {
    var saved = JSON.parse(window.sessionStorage.getItem(STATE_KEY));
    if (saved) Object.keys(state).forEach(function (k) { if (saved[k]) state[k] = saved[k]; });
  } catch (e) { /* storage unavailable */ }

  function persist() {
    try { window.sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  var step = 'shipping';
  var pushedPayment = false;
  var done = null;
  var couponMsg = '';

  /* ---------- Delivery days (Persian calendar) ---------- */
  var fa = 'fa-IR-u-ca-persian';
  var fmtWeekday = new Intl.DateTimeFormat(fa, { weekday: 'long' });
  var fmtDay = new Intl.DateTimeFormat(fa, { day: 'numeric' });
  var fmtMonth = new Intl.DateTimeFormat(fa, { month: 'long' });
  var fmtFull = new Intl.DateTimeFormat(fa, { weekday: 'long', day: 'numeric', month: 'long' });

  function isoDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function deliveryDays() {
    var list = [];
    var base = new Date();
    base.setHours(12, 0, 0, 0);
    for (var i = 1; i <= 6; i++) {
      var d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push({ value: isoDate(d), date: d, closed: d.getDay() === 5 }); // Friday: no dispatch
    }
    return list;
  }

  function dayLabel(value) {
    var match = deliveryDays().filter(function (d) { return d.value === value; })[0];
    return match ? fmtFull.format(match.date) : '';
  }

  /* ---------- Derived data ---------- */
  function currentAddress() {
    var list = Store.addresses();
    return list.filter(function (a) { return a.id === state.addressId; })[0] ||
      list.filter(function (a) { return a.isDefault; })[0] || list[0] || null;
  }

  function isTehran(addr) {
    return !!addr && addr.province === 'تهران';
  }

  function methodById(id) {
    return METHODS.filter(function (m) { return m.id === id; })[0] || null;
  }

  function shippingCost(totals) {
    var m = methodById(state.method);
    if (!m) return null;
    return totals.freeShipping ? 0 : m.price;
  }

  // Drop choices that no longer apply (address outside Tehran, past days)
  function sanitize() {
    var addr = currentAddress();
    state.addressId = addr ? addr.id : null;
    if (state.method === 'courier' && !isTehran(addr)) state.method = null;
    var valid = deliveryDays().some(function (d) { return d.value === state.day && !d.closed; });
    if (!valid) state.day = null;
    if (state.payment === 'cod' && state.method !== 'courier') state.payment = 'online';
    if (!PAYMENTS.some(function (p) { return p.id === state.payment; })) state.payment = 'online';
    persist();
  }

  function shippingReady() {
    return !!(state.addressId && state.day && state.method);
  }

  function groups(items, addr) {
    var fast = [];
    var normal = [];
    items.forEach(function (i) {
      if (isTehran(addr) && typeof i.product.stock !== 'number') fast.push(i); else normal.push(i);
    });
    var out = [];
    if (fast.length) out.push({ id: 'fast', icon: 'lightning', title: 'ارسال فوری تهران', text: 'این کالاها در انبار تهران آماده‌اند و با پیک تهران در همان روز انتخابی می‌رسند.', items: fast });
    if (normal.length) out.push({ id: 'normal', icon: 'truck', title: 'ارسال عادی فیبسو', text: 'پس از تست نهایی و بسته‌بندی ایمن، در روز انتخابی تحویل شرکت حمل می‌شود.', items: normal });
    return out;
  }

  /* ---------- Markup ---------- */
  function addressHTML(addr) {
    if (!addr) {
      return '<section class="co-address co-address--empty" aria-labelledby="addr-title">' +
        '<span class="co-address__icon">' + ic('map-pin') + '</span>' +
        '<div class="co-address__body">' +
          '<h2 class="co-address__title" id="addr-title">آدرس تحویل را ثبت کنید</h2>' +
          '<p class="co-address__text">برای انتخاب شیوه و زمان ارسال، ابتدا آدرس گیرنده را وارد کنید.</p>' +
        '</div>' +
        '<button class="btn btn--primary btn--sm co-address__action" type="button" data-open-add>' + ic('plus') + 'افزودن آدرس</button>' +
      '</section>';
    }
    return '<section class="co-address" aria-labelledby="addr-title">' +
      '<span class="co-address__icon">' + ic('truck') + '</span>' +
      '<div class="co-address__body">' +
        '<h2 class="co-address__title" id="addr-title">ارسال به آدرس انتخاب شده</h2>' +
        '<p class="co-address__text">' + esc(Store.addressText(addr)) + '</p>' +
        '<p class="co-address__who">' + ic('user') + '<span>' + esc(addr.name) + '، <span class="ltr">' + esc(addr.mobile) + '</span></span></p>' +
      '</div>' +
      '<button class="co-address__change" type="button" data-open-pick>تغییر آدرس' + ic('caret-left') + '</button>' +
    '</section>';
  }

  function thumbHTML(i) {
    var p = i.product;
    return '<li class="co-thumb">' +
      '<span class="co-thumb__img"><img src="' + Shop.imageUrl(p) + '" alt="" width="96" height="96" loading="lazy"></span>' +
      '<span class="co-thumb__title">' + esc(p.title) + '</span>' +
      '<span class="co-thumb__meta"><span class="co-thumb__qty" aria-label="تعداد">' + fmt(i.qty) + '</span>' + Shop.conditionHTML(p) + '</span>' +
    '</li>';
  }

  function daysHTML() {
    return deliveryDays().map(function (d) {
      return '<label class="co-day' + (d.closed ? ' is-closed' : '') + '">' +
        '<input class="co-day__input" type="radio" name="day" value="' + d.value + '"' +
          (state.day === d.value ? ' checked' : '') + (d.closed ? ' disabled' : '') + '>' +
        '<span class="co-day__wd">' + fmtWeekday.format(d.date) + '</span>' +
        '<span class="co-day__num">' + fmtDay.format(d.date) + '</span>' +
        '<span class="co-day__mon">' + (d.closed ? 'تعطیل' : fmtMonth.format(d.date)) + '</span>' +
      '</label>';
    }).join('');
  }

  function methodsHTML(addr, totals) {
    return METHODS.map(function (m) {
      var blocked = m.tehran && !isTehran(addr);
      var price = totals.freeShipping ? 'رایگان' : fmt(m.price) + ' تومان';
      return '<label class="choice co-method' + (blocked ? ' is-disabled' : '') + '">' +
        '<input type="radio" name="method" value="' + m.id + '"' + (state.method === m.id ? ' checked' : '') + (blocked ? ' disabled' : '') + '>' +
        '<span class="co-method__icon">' + ic(m.icon) + '</span>' +
        '<span class="choice__body"><span class="choice__title">' + m.title + '</span>' +
          '<span class="choice__text">' + (blocked ? 'برای آدرس‌های خارج از تهران در دسترس نیست' : m.text) + '</span></span>' +
        '<span class="choice__price">' + price + '</span>' +
      '</label>';
    }).join('');
  }

  function shippingHTML(items, totals) {
    var addr = currentAddress();
    var g = groups(items, addr);
    return '<div class="co-toprow">' +
        '<h1 class="co-step-title" tabindex="-1">روش دریافت کالا را انتخاب کنید</h1>' +
        '<a class="co-back" href="' + CART_URL + '">' + ic('arrow-right') + 'بازگشت به سبد خرید</a>' +
      '</div>' +
      addressHTML(addr) +
      '<section class="co-order" aria-labelledby="order-title">' +
        '<h2 class="co-sec-title" id="order-title">سفارش شما <span class="co-sec-meta">' + fmt(totals.count) + ' عدد کالا · ' + fmt(g.length) + ' مرسوله</span></h2>' +
        '<div class="co-box">' +
          g.map(function (grp) {
            return '<div class="co-group co-group--' + grp.id + '">' +
              '<h3 class="co-group__title">' + ic(grp.icon) + grp.title + '</h3>' +
              '<p class="co-group__text">' + grp.text + '</p>' +
              '<ul class="co-thumbs" aria-label="کالاهای ' + grp.title + '">' + grp.items.map(thumbHTML).join('') + '</ul>' +
            '</div>';
          }).join('') +
          '<div class="co-ship" id="ship-box" tabindex="-1">' +
            '<div class="co-ship__head"><h3 class="co-ship__title" id="ship-title">شیوه و زمان ارسال</h3><span class="co-pill" data-ship-pill></span></div>' +
            (addr ? '' : '<p class="co-ship__lock">' + ic('info') + 'پس از ثبت آدرس، روز و شیوه ارسال را انتخاب کنید.</p>') +
            '<fieldset class="co-fieldset"' + (addr ? '' : ' disabled') + '><legend class="co-legend">روز ارسال</legend>' +
              '<div class="co-days">' + daysHTML() + '</div></fieldset>' +
            '<fieldset class="co-fieldset"' + (addr ? '' : ' disabled') + '><legend class="co-legend">شیوه ارسال</legend>' +
              '<div class="choice-list co-methods">' + methodsHTML(addr, totals) + '</div></fieldset>' +
            '<p class="co-error" id="ship-error" role="alert"></p>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function paymentHTML() {
    var addr = currentAddress();
    var m = methodById(state.method);
    return '<div class="co-toprow">' +
        '<h1 class="co-step-title" tabindex="-1">انتخاب شیوه پرداخت</h1>' +
        '<button class="co-back" type="button" data-go-shipping>' + ic('arrow-right') + 'بازگشت به شیوه و زمان ارسال</button>' +
      '</div>' +
      '<fieldset class="co-fieldset co-pays"><legend class="visually-hidden">شیوه پرداخت</legend>' +
        PAYMENTS.map(function (p) {
          var blocked = p.id === 'cod' && state.method !== 'courier';
          return '<div class="co-pay' + (blocked ? ' is-disabled' : '') + '">' +
            '<label class="co-pay__label">' +
              '<span class="co-pay__icon">' + ic(p.icon) + '</span>' +
              '<span class="co-pay__body"><span class="co-pay__title">' + p.title + '</span>' +
                '<span class="co-pay__text">' + (blocked ? 'فقط وقتی شیوه ارسال «پیک تهران» باشد فعال است' : p.text) + '</span></span>' +
              '<input class="co-pay__radio" type="radio" name="payment" value="' + p.id + '"' + (state.payment === p.id ? ' checked' : '') + (blocked ? ' disabled' : '') + '>' +
            '</label>' +
            (p.id === 'invoice' ? '<a class="co-pay__more" href="' + Shop.root + 'pages/b2b.html">شرایط خرید سازمانی' + ic('caret-left') + '</a>' : '') +
          '</div>';
        }).join('') +
      '</fieldset>' +
      '<section class="co-coupon" aria-labelledby="coupon-title">' +
        '<h2 class="co-sec-title" id="coupon-title">کد تخفیف <span class="co-sec-meta">اختیاری</span></h2>' +
        '<div class="co-coupon__row">' +
          '<label class="visually-hidden" for="coupon">کد تخفیف</label>' +
          '<input class="input" id="coupon" name="coupon" autocomplete="off" dir="ltr" placeholder="مثلاً FIBESO10" aria-describedby="coupon-msg">' +
          '<button class="btn btn--outline" type="button" data-apply-coupon>اعمال کد</button>' +
        '</div>' +
        '<p class="co-coupon__msg" id="coupon-msg" role="status">' + esc(couponMsg) + '</p>' +
      '</section>' +
      '<section class="co-review" aria-labelledby="review-title">' +
        '<h2 class="co-sec-title" id="review-title">خلاصه ارسال</h2>' +
        '<dl class="co-review__list">' +
          '<div><dt>' + ic('map-pin') + 'گیرنده</dt><dd>' + esc(addr.name) + '، ' + esc(Store.addressText(addr)) + '</dd></div>' +
          '<div><dt>' + ic('calendar') + 'روز ارسال</dt><dd>' + dayLabel(state.day) + '</dd></div>' +
          '<div><dt>' + ic('truck') + 'شیوه ارسال</dt><dd>' + (m ? m.title : '') + '</dd></div>' +
        '</dl>' +
      '</section>' +
      '<p class="alert alert--warning co-demo">' + ic('warning') +
        '<span>نسخه نمایشی: درگاه پرداخت هنوز متصل نیست. با زدن «پرداخت»، هیچ مبلغی کسر نمی‌شود و سفارش فقط در همین مرورگر ثبت می‌شود.</span></p>';
  }

  function billHTML(totals, groupCount) {
    return '<aside class="bill co-bill" aria-labelledby="bill-title">' +
      '<div class="co-bill__top"><h2 class="bill__label" id="bill-title">صورتحساب</h2>' +
        '<span class="co-sec-meta">' + fmt(totals.count) + ' عدد کالا · ' + fmt(groupCount) + ' مرسوله</span></div>' +
      '<div class="bill__card">' +
        '<dl class="bill__rows">' +
          '<div><dt>قیمت محصولات</dt><dd>' + fmt(totals.subtotal + totals.savings) + ' <small>تومان</small></dd></div>' +
          '<div><dt>هزینه بسته‌بندی و ارسال</dt><dd data-bill-ship></dd></div>' +
          (totals.savings ? '<div class="bill__save"><dt>تخفیف محصولات</dt><dd>' + fmt(totals.savings) + ' <small>تومان</small></dd></div>' : '') +
          '<div class="bill__total"><dt>مبلغ قابل پرداخت</dt><dd data-bill-total></dd></div>' +
        '</dl>' +
        '<button class="btn btn--block co-cta" type="button" data-cta></button>' +
        '<p class="bill__hint">ثبت سفارش به معنای پذیرش <a href="' + Shop.root + 'pages/terms.html">قوانین فیبسو</a> و <a href="' + Shop.root + 'pages/warranty.html">شرایط ضمانت</a> است.</p>' +
      '</div>' +
    '</aside>';
  }

  function emptyHTML() {
    return '<div class="cart-empty">' +
      '<span class="cart-empty__icon">' + ic('cart-plus') + '</span>' +
      '<h1 class="cart-empty__title" tabindex="-1">سبد خرید شما خالی است</h1>' +
      '<p class="cart-empty__text">برای ثبت سفارش، ابتدا کالایی به سبد خرید اضافه کنید.</p>' +
      '<a class="btn btn--primary" href="' + Shop.root + 'pages/shop.html">رفتن به فروشگاه</a>' +
    '</div>';
  }

  function successHTML(order) {
    return '<section class="co-success" aria-labelledby="ok-title">' +
      '<span class="co-success__icon">' + ic('check') + '</span>' +
      '<h1 class="co-success__title" id="ok-title" tabindex="-1">سفارش شما ثبت شد</h1>' +
      '<p class="co-success__code">شماره سفارش: <strong class="ltr">' + esc(order.id) + '</strong></p>' +
      '<dl class="co-review__list co-success__list">' +
        '<div><dt>' + ic('calendar') + 'ارسال</dt><dd>' + esc(order.shippingMethod) + '</dd></div>' +
        '<div><dt>' + ic('map-pin') + 'گیرنده</dt><dd>' + esc(order.address.name) + '، ' + esc(Store.addressText(order.address)) + '</dd></div>' +
        '<div><dt>' + ic('wallet') + 'مبلغ</dt><dd>' + fmt(order.total) + ' تومان، ' + esc(order.payment) + '</dd></div>' +
      '</dl>' +
      '<p class="co-success__note">این سفارش در نسخه نمایشی فقط در مرورگر شما ذخیره شده و پرداختی انجام نشده است.</p>' +
      '<div class="co-success__actions">' +
        '<a class="btn btn--primary" href="' + Shop.root + 'pages/account.html#orders">مشاهده سفارش‌های من</a>' +
        '<a class="btn btn--outline" href="' + Shop.root + 'pages/shop.html">ادامه خرید</a>' +
      '</div>' +
    '</section>';
  }

  /* ---------- Render ---------- */
  function render(focusTitle) {
    document.body.classList.remove('has-co-bar');
    if (done) {
      rootEl.innerHTML = successHTML(done);
      document.getElementById('ok-title').focus();
      window.scrollTo(0, 0);
      return;
    }
    var items = Shop.cartItems();
    if (!items.length) {
      rootEl.innerHTML = emptyHTML();
      return;
    }
    sanitize();
    if (step === 'payment' && !shippingReady()) step = 'shipping';
    var totals = Shop.cartTotals();
    var groupCount = groups(items, currentAddress()).length;

    rootEl.innerHTML =
      '<div class="co-layout co-layout--' + step + '">' +
        '<div class="co-main">' + (step === 'payment' ? paymentHTML() : shippingHTML(items, totals)) + '</div>' +
        billHTML(totals, groupCount) +
      '</div>' +
      '<div class="co-bar" role="region" aria-label="مبلغ و ادامه خرید">' +
        '<button class="btn co-cta" type="button" data-cta></button>' +
        '<div class="co-bar__sum"><span>مبلغ قابل پرداخت</span><strong data-bar-total></strong></div>' +
      '</div>';
    document.body.classList.add('has-co-bar');
    refresh();
    if (focusTitle) {
      var h = rootEl.querySelector('.co-step-title');
      if (h) h.focus();
      window.scrollTo(0, 0);
    }
  }

  // Update totals, buttons and status without rebuilding the form (keeps focus)
  function refresh() {
    var totals = Shop.cartTotals();
    var cost = shippingCost(totals);
    var shipCell = rootEl.querySelector('[data-bill-ship]');
    if (!shipCell) return;
    shipCell.innerHTML = cost === null
      ? '<span class="bill__later">پس از انتخاب شیوه ارسال</span>'
      : (cost ? fmt(cost) + ' <small>تومان</small>' : '<span class="bill__free">رایگان</span>');
    var total = fmt(totals.subtotal + (cost || 0)) + ' <small>تومان</small>';
    rootEl.querySelector('[data-bill-total]').innerHTML = total;
    rootEl.querySelector('[data-bar-total]').innerHTML = total;

    var ready = shippingReady();
    var label = step === 'payment' ? 'پرداخت' : (ready ? 'تایید و ادامه' : 'شیوه و زمان ارسال را انتخاب کنید');
    rootEl.querySelectorAll('[data-cta]').forEach(function (b) {
      b.textContent = label;
      var pending = step === 'shipping' && !ready;
      b.classList.toggle('btn--primary', !pending);
      b.classList.toggle('co-cta--pending', pending);
      b.setAttribute('aria-disabled', pending ? 'true' : 'false');
      if (pending) b.setAttribute('aria-describedby', 'ship-error'); else b.removeAttribute('aria-describedby');
    });
    document.body.classList.toggle('co-bar-ready', step === 'payment' || ready);

    var pill = rootEl.querySelector('[data-ship-pill]');
    if (pill) {
      var m = methodById(state.method);
      pill.textContent = ready ? dayLabel(state.day) + '، ' + m.title : 'تعیین نشده';
      pill.classList.toggle('is-set', ready);
    }
  }

  /* ---------- Steps ---------- */
  function goPayment() {
    var err = document.getElementById('ship-error');
    if (!state.addressId) { openDialog('add', rootEl.querySelector('[data-open-add]')); return; }
    if (!state.day || !state.method) {
      err.textContent = !state.day ? 'روز ارسال را انتخاب کنید.' : 'شیوه ارسال را انتخاب کنید.';
      var target = !state.day
        ? rootEl.querySelector('input[name="day"]:not(:disabled)')
        : rootEl.querySelector('input[name="method"]:not(:disabled)');
      document.getElementById('ship-box').scrollIntoView({ block: 'center' });
      if (target) target.focus({ preventScroll: true });
      return;
    }
    step = 'payment';
    pushedPayment = true;
    history.pushState({ step: 'payment' }, '', '#payment');
    render(true);
  }

  function goShipping() {
    if (pushedPayment && location.hash === '#payment') { history.back(); return; }
    step = 'shipping';
    history.replaceState(null, '', location.pathname + location.search);
    render(true);
  }

  window.addEventListener('popstate', function () {
    if (done) return;
    step = location.hash === '#payment' && shippingReady() ? 'payment' : 'shipping';
    if (location.hash !== '#payment') pushedPayment = false;
    render(true);
  });

  function placeOrder() {
    var pay = PAYMENTS.filter(function (p) { return p.id === state.payment; })[0];
    var input = rootEl.querySelector('input[name="payment"]:checked');
    if (!pay || !input) {
      var first = rootEl.querySelector('input[name="payment"]:not(:disabled)');
      if (first) first.focus();
      return;
    }
    var totals = Shop.cartTotals();
    var cost = shippingCost(totals) || 0;
    var m = methodById(state.method);
    done = Store.addOrder({
      items: Shop.cartItems().map(function (i) {
        return { id: i.product.id, title: i.product.title, img: i.product.img, price: i.product.price, qty: i.qty };
      }),
      subtotal: totals.subtotal,
      savings: totals.savings,
      shipping: cost,
      total: totals.subtotal + cost,
      shippingMethod: m.title + '، ' + dayLabel(state.day),
      deliveryDate: state.day,
      payment: pay.title,
      address: currentAddress(),
      note: ''
    });
    try { window.sessionStorage.removeItem(STATE_KEY); } catch (e) { /* ignore */ }
    history.replaceState(null, '', location.pathname + location.search);
    Shop.clearCart(); // triggers onChange, which renders the success screen
    render();
  }

  /* ---------- Events ---------- */
  rootEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'day') state.day = t.value;
    else if (t.name === 'method') {
      state.method = t.value;
    } else if (t.name === 'payment') {
      state.payment = t.value;
      var err = rootEl.querySelector('#pay-error');
      if (err) err.textContent = '';
    } else return;
    persist();
    var shipErr = document.getElementById('ship-error');
    if (shipErr) shipErr.textContent = '';
    refresh();
  });

  rootEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-cta]')) {
      if (step === 'payment') placeOrder(); else goPayment();
      return;
    }
    if (e.target.closest('[data-go-shipping]')) { goShipping(); return; }
    var add = e.target.closest('[data-open-add]');
    if (add) { openDialog('add', add); return; }
    var pick = e.target.closest('[data-open-pick]');
    if (pick) { openDialog('pick', pick); return; }
    if (e.target.closest('[data-apply-coupon]')) {
      var code = rootEl.querySelector('#coupon').value.trim();
      couponMsg = code ? 'کد «' + code + '» معتبر نیست یا زمان استفاده از آن گذشته است.' : 'کد تخفیف را وارد کنید.';
      rootEl.querySelector('#coupon-msg').textContent = couponMsg;
    }
  });

  rootEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'coupon') {
      e.preventDefault();
      rootEl.querySelector('[data-apply-coupon]').click();
    }
  });

  /* ---------- Dialogs (native modal: inert background, Escape closes) ---------- */
  var opener = null;

  function focusables(d) {
    return Array.prototype.filter.call(
      d.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function openDialog(name, from) {
    var d = dialogs[name];
    if (!d) return;
    opener = from || null;
    if (name === 'add') {
      d.querySelector('[data-address-fields]').innerHTML = Store.addressFields('ad-', { name: user.name, mobile: user.mobile });
    } else {
      var current = currentAddress();
      d.querySelector('[data-pick-list]').innerHTML = Store.addresses().map(function (a) {
        return '<label class="choice"><input type="radio" name="pick" value="' + a.id + '"' + (current && a.id === current.id ? ' checked' : '') + '>' +
          '<span class="choice__body"><span class="choice__title">' + esc(a.name) + '، <span class="ltr">' + esc(a.mobile) + '</span></span>' +
          '<span class="choice__text">' + esc(Store.addressText(a)) + '</span></span></label>';
      }).join('');
    }
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    var first = name === 'add' ? d.querySelector('input, select') : d.querySelector('input:checked') || d.querySelector('input');
    if (first) first.focus();
  }

  function closeDialog(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  Object.keys(dialogs).forEach(function (name) {
    var d = dialogs[name];
    if (!d) return;
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-dialog-close]')) closeDialog(d);
    });
    // Keep Tab inside the dialog
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var list = focusables(d);
      if (!list.length) return;
      var firstEl = list[0];
      var lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    });
    d.addEventListener('close', function () {
      var back = opener && document.contains(opener) ? opener : null;
      if (!back) back = rootEl.querySelector('[data-open-pick], [data-open-add], .co-step-title');
      if (back) back.focus();
    });
  });

  if (dialogs.add) {
    dialogs.add.querySelector('[data-address-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var data = Store.validateForm(form);
      if (!data) return;
      var addr = Store.saveAddress({
        name: data.name, mobile: data.mobile, province: data.province, city: data.city,
        street: data.street, postal: Store.latin(data.postal), plaque: form.elements.plaque.value.trim(),
        isDefault: form.elements.isDefault.checked
      });
      state.addressId = addr.id;
      persist();
      opener = null;
      render();
      closeDialog(dialogs.add);
      Shop.toast('آدرس ثبت شد');
    });
  }

  if (dialogs.pick) {
    dialogs.pick.querySelector('[data-pick-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var picked = e.target.querySelector('input[name="pick"]:checked');
      if (picked) state.addressId = picked.value;
      persist();
      opener = null;
      render();
      closeDialog(dialogs.pick);
    });
    dialogs.pick.querySelector('[data-open-add]').addEventListener('click', function () {
      closeDialog(dialogs.pick);
      openDialog('add', rootEl.querySelector('[data-open-pick]'));
    });
  }

  // Cart changes in another tab: rebuild (the success screen stays put)
  Shop.onChange(function () { if (!done) render(); });

  if (location.hash === '#payment') {
    sanitize();
    if (shippingReady()) step = 'payment';
    else history.replaceState(null, '', location.pathname + location.search);
  }
  render();
})();
