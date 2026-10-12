/* Cart page: editable line items, totals, coupon (front-end only). */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var rootEl = document.querySelector('[data-cart-page]');
  var headingCount = document.querySelector('[data-cart-heading-count]');
  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;
  var couponMessage = '';

  function render() {
    var items = Shop.cartItems();
    var t = Shop.cartTotals();
    headingCount.textContent = t.count ? '(' + fmt(t.count) + ' کالا)' : '';

    if (!items.length) {
      rootEl.innerHTML = '<div class="panel empty-state">' + Shop.icon.bag +
        '<h2>سبد خرید شما خالی است</h2><p>برای شروع، لپ‌تاپ یا تجهیزات شبکه مورد نیاز خود را پیدا کنید.</p>' +
        '<a class="btn btn--primary" href="' + Shop.root + 'pages/shop.html">رفتن به فروشگاه</a></div>';
      return;
    }

    rootEl.innerHTML =
      '<div class="cart-layout">' +
        '<ul class="cart-items" aria-label="کالاهای سبد خرید">' + items.map(function (i) {
          var p = i.product;
          return '<li class="cart-item">' +
            '<img class="cart-item__img" src="' + Shop.imageUrl(p) + '" alt="" width="112" height="112">' +
            '<div class="cart-item__body">' +
              '<h2 class="cart-item__title"><a href="' + Shop.productUrl(p) + '">' + esc(p.title) + '</a></h2>' +
              '<div class="cart-item__meta">' + Shop.conditionHTML(p) + '<span>' + esc(p.warranty) + '</span></div>' +
              '<div class="cart-item__meta"><span>قیمت واحد: ' + fmt(p.price) + ' تومان</span>' +
                (p.old ? '<span>تخفیف: ' + fmt((p.old - p.price) * i.qty) + ' تومان</span>' : '') + '</div>' +
            '</div>' +
            '<div class="cart-item__side">' +
              '<span class="cart-item__total">' + fmt(p.price * i.qty) + ' تومان</span>' +
              Shop.qtyHTML(p, i.qty) +
              '<button class="btn btn--sm btn--danger-text" type="button" data-remove="' + p.id + '">حذف</button>' +
            '</div>' +
          '</li>';
        }).join('') + '</ul>' +

        '<aside class="summary" aria-labelledby="summary-title">' +
          '<h2 class="summary__title" id="summary-title">خلاصه سفارش</h2>' +
          '<dl class="summary__rows">' +
            '<div><dt>قیمت کالاها (' + fmt(t.count) + ')</dt><dd>' + fmt(t.subtotal + t.savings) + ' تومان</dd></div>' +
            (t.savings ? '<div class="summary__save"><dt>سود شما از خرید</dt><dd>' + fmt(t.savings) + ' تومان</dd></div>' : '') +
            '<div><dt>هزینه ارسال</dt><dd>' + (t.freeShipping ? 'رایگان' : 'در مرحله بعد محاسبه می‌شود') + '</dd></div>' +
            '<div class="summary__total"><dt>جمع سبد خرید</dt><dd>' + fmt(t.subtotal) + ' تومان</dd></div>' +
          '</dl>' +
          '<form class="coupon" novalidate data-coupon>' +
            '<label class="visually-hidden" for="coupon">کد تخفیف</label>' +
            '<input class="input" id="coupon" name="coupon" placeholder="کد تخفیف" autocomplete="off" aria-describedby="coupon-msg">' +
            '<button class="btn btn--outline btn--sm" type="submit">اعمال</button>' +
          '</form>' +
          '<p class="summary__note" id="coupon-msg" role="status">' + esc(couponMessage) + '</p>' +
          '<a class="btn btn--primary btn--block" href="' + Shop.root + 'pages/checkout.html">ادامه و تکمیل سفارش</a>' +
          (t.freeShipping ? '' : '<p class="summary__note">با افزودن ' + fmt(5000000 - t.subtotal) + ' تومان دیگر، ارسال رایگان می‌شود.</p>') +
        '</aside>' +
      '</div>';
  }

  rootEl.addEventListener('submit', function (e) {
    if (!e.target.matches('[data-coupon]')) return;
    e.preventDefault();
    var code = e.target.elements.coupon.value.trim();
    couponMessage = code ? 'بررسی کد تخفیف پس از اتصال فروشگاه به سرور فعال می‌شود.' : 'کد تخفیف را وارد کنید.';
    document.getElementById('coupon-msg').textContent = couponMessage;
  });

  Shop.onChange(render);
  render();
})();
