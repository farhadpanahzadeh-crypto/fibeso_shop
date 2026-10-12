/* Checkout: address, delivery and payment; the order is stored locally (no backend). */
(function () {
  'use strict';

  var Shop = window.Shop;
  var Store = window.Store;
  if (!Shop || !Store) return;

  var user = Store.requireUser();
  if (!user) return;

  var rootEl = document.querySelector('[data-checkout]');
  var steps = document.querySelector('[data-steps]');
  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;

  var SHIPPING = [
    { id: 'courier', title: 'پیک فیبسو (فقط تهران)', text: 'تحویل در همان روز یا روز کاری بعد', price: 120000 },
    { id: 'post', title: 'پست پیشتاز', text: 'تحویل ۲ تا ۴ روز کاری در سراسر کشور', price: 180000 },
    { id: 'freight', title: 'باربری (رک و کالاهای حجیم)', text: 'هزینه هنگام تحویل از گیرنده دریافت می‌شود', price: 0 }
  ];
  var PAYMENT = [
    { id: 'online', title: 'پرداخت اینترنتی', text: 'پرداخت با کلیه کارت‌های عضو شتاب' },
    { id: 'cod', title: 'پرداخت در محل', text: 'فقط برای ارسال با پیک در تهران' },
    { id: 'invoice', title: 'پیش‌فاکتور سازمانی', text: 'صدور پیش‌فاکتور رسمی و پرداخت از حساب شرکت' }
  ];

  function shippingCost(method, totals) {
    var m = SHIPPING.filter(function (s) { return s.id === method; })[0];
    if (!m) return 0;
    if (method !== 'freight' && totals.freeShipping) return 0;
    return m.price;
  }

  function radio(name, item, checked, extra) {
    return '<label class="choice"><input type="radio" name="' + name + '" value="' + item.id + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="choice__body"><span class="choice__title">' + esc(item.title) + '</span><span class="choice__text">' + esc(item.text) + '</span></span>' +
      (extra || '') + '</label>';
  }

  function render() {
    var items = Shop.cartItems();
    if (!items.length) {
      rootEl.innerHTML = '<div class="panel empty-state">' + Shop.icon.bag + '<h1>سبد خرید شما خالی است</h1>' +
        '<p>برای ثبت سفارش ابتدا کالایی به سبد خرید اضافه کنید.</p>' +
        '<a class="btn btn--primary" href="' + Shop.root + 'pages/shop.html">رفتن به فروشگاه</a></div>';
      return;
    }
    var totals = Shop.cartTotals();
    var addresses = Store.addresses();
    var def = addresses.filter(function (a) { return a.isDefault; })[0] || addresses[0];

    var addressBlock = addresses.length
      ? '<div class="choice-list" role="radiogroup" aria-label="آدرس‌های ذخیره‌شده">' + addresses.map(function (a) {
          return '<label class="choice"><input type="radio" name="addressId" value="' + a.id + '"' + (a === def ? ' checked' : '') + '>' +
            '<span class="choice__body address-card"><span class="address-card__name">' + esc(a.name) + '، <span class="ltr">' + esc(a.mobile) + '</span></span>' +
            '<span class="choice__text">' + esc(Store.addressText(a)) + '</span></span></label>';
        }).join('') +
        '<label class="choice"><input type="radio" name="addressId" value="new"><span class="choice__body"><span class="choice__title">ارسال به آدرس جدید</span></span></label>' +
        '</div><div class="new-address" data-new-address hidden>' + Store.addressFields('ad-') + '</div>'
      : '<div class="new-address" data-new-address>' + Store.addressFields('ad-', { name: user.name, mobile: user.mobile }) + '</div>';

    rootEl.innerHTML =
      '<h1 class="cart-title">تکمیل سفارش</h1>' +
      '<form class="cart-layout" novalidate data-checkout-form>' +
        '<div class="checkout-main">' +
          '<section class="panel" aria-labelledby="addr-title"><h2 class="panel__title" id="addr-title">آدرس تحویل</h2>' + addressBlock + '</section>' +
          '<section class="panel" aria-labelledby="ship-title"><h2 class="panel__title" id="ship-title">روش ارسال</h2>' +
            '<div class="choice-list" role="radiogroup" aria-labelledby="ship-title">' + SHIPPING.map(function (s, i) {
              var cost = shippingCost(s.id, totals);
              return radio('shipping', s, i === 1, '<span class="choice__price">' + (s.id === 'freight' ? 'پس‌کرایه' : cost ? fmt(cost) + ' تومان' : 'رایگان') + '</span>');
            }).join('') + '</div></section>' +
          '<section class="panel" aria-labelledby="pay-title"><h2 class="panel__title" id="pay-title">روش پرداخت</h2>' +
            '<div class="choice-list" role="radiogroup" aria-labelledby="pay-title">' + PAYMENT.map(function (p, i) { return radio('payment', p, i === 0); }).join('') + '</div>' +
            '<p class="field__error" id="pay-error" role="alert"></p>' +
            '<div class="alert alert--warning checkout-demo-note">' + window.icon('warning') +
            '<span>نسخه نمایشی: درگاه پرداخت هنوز متصل نیست. با ثبت سفارش، هیچ پرداختی انجام نمی‌شود و سفارش فقط در همین مرورگر ذخیره می‌شود.</span></div>' +
          '</section>' +
          '<section class="panel"><div class="field"><label class="field__label" for="order-note">توضیحات سفارش (اختیاری)</label>' +
            '<textarea class="input" id="order-note" name="note" placeholder="مثلاً زمان مناسب تحویل"></textarea></div></section>' +
        '</div>' +
        '<aside class="summary" aria-labelledby="sum-title">' +
          '<h2 class="summary__title" id="sum-title">سفارش شما</h2>' +
          '<ul class="summary__items">' + items.map(function (i) {
            return '<li class="summary__item"><img src="' + Shop.imageUrl(i.product) + '" alt="" width="48" height="48">' +
              '<span>' + esc(i.product.title) + ' <span class="text-muted">× ' + fmt(i.qty) + '</span></span>' +
              '<strong>' + fmt(i.qty * i.product.price) + '</strong></li>';
          }).join('') + '</ul>' +
          '<dl class="summary__rows">' +
            '<div><dt>جمع کالاها</dt><dd>' + fmt(totals.subtotal) + ' تومان</dd></div>' +
            '<div><dt>هزینه ارسال</dt><dd data-ship-cost></dd></div>' +
            '<div class="summary__total"><dt>مبلغ قابل پرداخت</dt><dd data-grand-total></dd></div>' +
          '</dl>' +
          '<label class="check"><input type="checkbox" name="terms" data-rules="required" data-label="پذیرش قوانین" aria-describedby="terms-error"> <span><a href="' + Shop.root + 'pages/terms.html">قوانین فروشگاه</a> و <a href="' + Shop.root + 'pages/warranty.html">شرایط ضمانت</a> را می‌پذیرم.</span></label>' +
          '<p class="field__error" id="terms-error"></p>' +
          '<button class="btn btn--primary btn--block" type="submit">ثبت سفارش</button>' +
        '</aside>' +
      '</form>';

    var form = rootEl.querySelector('[data-checkout-form]');
    var newAddr = rootEl.querySelector('[data-new-address]');

    function refreshTotals() {
      var method = form.querySelector('input[name="shipping"]:checked').value;
      var cost = shippingCost(method, totals);
      rootEl.querySelector('[data-ship-cost]').textContent = method === 'freight' ? 'پس‌کرایه' : (cost ? fmt(cost) + ' تومان' : 'رایگان');
      rootEl.querySelector('[data-grand-total]').textContent = fmt(totals.subtotal + cost) + ' تومان';
    }

    function toggleNewAddress() {
      var picked = form.querySelector('input[name="addressId"]:checked');
      var show = !picked || picked.value === 'new';
      newAddr.hidden = !show;
      // Hidden address inputs must not block submission
      newAddr.querySelectorAll('[data-rules], [data-rules-off]').forEach(function (el) {
        if (show && el.hasAttribute('data-rules-off')) { el.setAttribute('data-rules', el.getAttribute('data-rules-off')); el.removeAttribute('data-rules-off'); }
        if (!show && el.hasAttribute('data-rules')) { el.setAttribute('data-rules-off', el.getAttribute('data-rules')); el.removeAttribute('data-rules'); }
      });
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'shipping') refreshTotals();
      if (e.target.name === 'addressId') toggleNewAddress();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payError = document.getElementById('pay-error');
      var method = form.querySelector('input[name="shipping"]:checked').value;
      var payment = form.querySelector('input[name="payment"]:checked').value;
      payError.textContent = payment === 'cod' && method !== 'courier' ? 'پرداخت در محل فقط با ارسال پیک در تهران ممکن است.' : '';

      var data = Store.validateForm(form);
      if (!data) return;
      if (payError.textContent) { form.querySelector('input[name="payment"]:checked').focus(); return; }

      var picked = form.querySelector('input[name="addressId"]:checked');
      var address;
      if (picked && picked.value !== 'new') {
        address = Store.addresses().filter(function (a) { return a.id === picked.value; })[0];
      } else {
        address = Store.saveAddress({ name: data.name, mobile: data.mobile, province: data.province, city: data.city, street: data.street, postal: data.postal, plaque: form.elements.plaque.value.trim() });
      }

      var cost = shippingCost(method, totals);
      var order = Store.addOrder({
        items: Shop.cartItems().map(function (i) { return { id: i.product.id, title: i.product.title, img: i.product.img, price: i.product.price, qty: i.qty }; }),
        subtotal: totals.subtotal,
        shipping: cost,
        total: totals.subtotal + cost,
        shippingMethod: SHIPPING.filter(function (s) { return s.id === method; })[0].title,
        payment: PAYMENT.filter(function (p) { return p.id === payment; })[0].title,
        address: address,
        note: form.elements.note.value.trim()
      });
      Shop.clearCart();
      showSuccess(order);
    });

    refreshTotals();
    if (addresses.length) toggleNewAddress();
  }

  function showSuccess(order) {
    steps.querySelectorAll('li').forEach(function (li) { li.classList.add('is-done'); li.removeAttribute('aria-current'); });
    rootEl.innerHTML = '<section class="panel success" aria-labelledby="ok-title">' +
      '<span class="success__icon">' + Shop.icon.check + '</span>' +
      '<h1 id="ok-title" tabindex="-1">سفارش شما ثبت شد</h1>' +
      '<p class="success__code">کد سفارش: <span class="ltr">' + esc(order.id) + '</span></p>' +
      '<p class="text-muted">این سفارش در نسخه نمایشی فقط در مرورگر شما ذخیره شده و پرداختی انجام نشده است. وضعیت آن را در پنل کاربری ببینید.</p>' +
      '<div class="success__actions"><a class="btn btn--primary" href="' + Shop.root + 'pages/account.html#orders">پیگیری سفارش</a>' +
      '<a class="btn btn--outline" href="' + Shop.root + 'index.html">بازگشت به فروشگاه</a></div></section>';
    document.getElementById('ok-title').focus();
    window.scrollTo(0, 0);
  }

  // Re-render when the cart changes elsewhere, but never wipe the success screen
  Shop.onChange(function () {
    if (!rootEl.querySelector('.success') && !rootEl.querySelector('[data-checkout-form]')) render();
  });
  render();
})();
