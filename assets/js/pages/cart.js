/* Cart page: item cards, bill summary, mobile checkout bar and recently viewed rail. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var rootEl = document.querySelector('[data-cart-page]');
  var clearDialog = document.querySelector('[data-clear-dialog]');
  var recentSection = document.querySelector('[data-recent]');
  var recentTrack = document.querySelector('[data-recent-track]');
  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;
  var ic = window.icon;
  var FREE_FROM = 5000000;
  var CHECKOUT = Shop.root + 'pages/checkout.html';

  function similarUrl(p) {
    var q = p.sub ? 'sub=' + encodeURIComponent(p.sub) : 'cat=' + encodeURIComponent(p.cat);
    if (p.cat === 'laptop') q += '&condition=' + p.condition;
    return Shop.root + 'pages/shop.html?' + q;
  }

  function stockLine(p) {
    if (typeof p.stock === 'number' && p.stock <= 3) {
      return '<li class="cart-card__fact cart-card__fact--low">' + ic('package') + '<span>فقط ' + fmt(p.stock) + ' عدد در انبار فیبسو باقی مانده</span></li>';
    }
    return '<li class="cart-card__fact">' + ic('truck') + '<span>موجود در انبار تهران، آماده ارسال</span></li>';
  }

  function itemHTML(i) {
    var p = i.product;
    var lineOld = p.old ? p.old * i.qty : 0;
    return '<li class="cart-card">' +
      '<h2 class="cart-card__title"><a href="' + Shop.productUrl(p) + '">' + esc(p.title) + '</a></h2>' +
        '<ul class="cart-card__facts">' +
          '<li class="cart-card__fact">' + ic('shield-check') + '<span>' + esc(p.warranty) + ' + ضمانت اصالت کالا</span></li>' +
          '<li class="cart-card__fact">' + ic('storefront') + '<span>فروشنده: فیبسو</span>' + Shop.conditionHTML(p) + '</li>' +
          stockLine(p) +
        '</ul>' +
      '<a class="cart-card__media" href="' + Shop.productUrl(p) + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + Shop.imageUrl(p) + '" alt="" width="200" height="200" loading="lazy"></a>' +
      '<div class="cart-card__buy">' +
        Shop.qtyHTML(p, i.qty) +
        '<div class="cart-card__price">' +
          (lineOld ? '<span class="cart-card__save">' + fmt(lineOld - p.price * i.qty) + ' تومان تخفیف</span>' : '') +
          '<span class="cart-card__now">' + fmt(p.price * i.qty) + ' <span class="price__unit">تومان</span></span>' +
        '</div>' +
      '</div>' +
      '<div class="cart-card__actions">' +
        '<a class="btn btn--outline btn--sm cart-card__similar" href="' + similarUrl(p) + '">' + ic('squares') + 'نمایش کالاهای مشابه' + ic('caret-left') + '</a>' +
        '<button class="btn btn--sm cart-card__remove" type="button" data-remove="' + p.id + '" aria-label="حذف ' + esc(p.title) + ' از سبد">' + ic('trash') + 'حذف کالا</button>' +
      '</div>' +
    '</li>';
  }

  function billHTML(t) {
    return '<aside class="bill" aria-labelledby="bill-title">' +
      '<h2 class="bill__label" id="bill-title">صورتحساب</h2>' +
      '<div class="bill__card">' +
        '<dl class="bill__rows">' +
          '<div><dt>قیمت کالاها (' + fmt(t.count) + ')</dt><dd>' + fmt(t.subtotal + t.savings) + ' <small>تومان</small></dd></div>' +
          (t.savings ? '<div class="bill__save"><dt>سود شما از خرید</dt><dd>' + fmt(t.savings) + ' <small>تومان</small></dd></div>' : '') +
          '<div><dt>هزینه ارسال</dt><dd>' + (t.freeShipping ? '<span class="bill__free">رایگان</span>' : '<span class="bill__later">در مرحله بعد</span>') + '</dd></div>' +
          '<div class="bill__total"><dt>جمع سبد خرید</dt><dd>' + fmt(t.subtotal) + ' <small>تومان</small></dd></div>' +
        '</dl>' +
        '<a class="btn btn--primary btn--block bill__cta" href="' + CHECKOUT + '">ادامه فرایند خرید</a>' +
        (t.freeShipping
          ? '<p class="bill__note">' + ic('truck') + '<span>ارسال این سفارش رایگان است.</span></p>'
          : '<p class="bill__note">' + ic('truck') + '<span>با افزودن ' + fmt(FREE_FROM - t.subtotal) + ' تومان دیگر، ارسال رایگان می‌شود.</span></p>') +
        '<p class="bill__hint">کالاهای سبد خرید رزرو نشده‌اند؛ برای قطعی شدن خرید، سفارش را تکمیل کنید.</p>' +
      '</div>' +
    '</aside>';
  }

  function emptyHTML() {
    var links = [
      ['shop.html?cat=laptop&condition=new', 'laptop', 'لپ‌تاپ نو'],
      ['shop.html?cat=laptop&condition=used', 'recycle', 'لپ‌تاپ استوک'],
      ['shop.html?cat=network', 'network', 'تجهیزات شبکه'],
      ['shop.html?cat=parts', 'memory', 'قطعات لپ‌تاپ']
    ];
    return '<div class="cart-empty">' +
      '<span class="cart-empty__icon">' + ic('cart-plus') + '</span>' +
      '<h2 class="cart-empty__title">سبد خرید شما خالی است</h2>' +
      '<p class="cart-empty__text">لپ‌تاپ، تجهیزات شبکه یا قطعه مورد نیازتان را پیدا کنید و به سبد اضافه کنید.</p>' +
      '<ul class="cart-empty__links">' + links.map(function (l) {
        return '<li><a href="' + Shop.root + 'pages/' + l[0] + '">' + ic(l[1]) + '<span>' + l[2] + '</span></a></li>';
      }).join('') + '</ul>' +
      '<a class="btn btn--primary" href="' + Shop.root + 'pages/shop.html">رفتن به فروشگاه</a>' +
    '</div>';
  }

  function render() {
    var items = Shop.cartItems();
    var t = Shop.cartTotals();
    var head = '<div class="cart-head">' +
      '<h1 class="cart-head__title">سبد خرید شما <span class="cart-head__count">' + (t.count ? fmt(t.count) + ' عدد کالا' : '') + '</span></h1>' +
      (items.length ? '<button class="cart-head__clear" type="button" data-clear-cart>' + ic('trash') + 'حذف کل سبد خرید</button>' : '') +
    '</div>';

    document.body.classList.toggle('has-cart-bar', items.length > 0);

    if (!items.length) {
      rootEl.innerHTML = '<div class="cart-layout cart-layout--empty">' + head + emptyHTML() + '</div>';
      return;
    }

    rootEl.innerHTML =
      '<div class="cart-layout">' +
        '<div class="cart-main">' + head +
          '<ul class="cart-list" aria-label="کالاهای سبد خرید">' + items.map(itemHTML).join('') + '</ul>' +
        '</div>' +
        billHTML(t) +
      '</div>' +
      '<div class="cart-bar" role="region" aria-label="جمع و ادامه خرید">' +
        '<div class="cart-bar__sum"><span>جمع سبد خرید</span><strong>' + fmt(t.subtotal) + ' <small>تومان</small></strong></div>' +
        '<a class="btn btn--primary cart-bar__cta" href="' + CHECKOUT + '">ادامه فرایند خرید</a>' +
      '</div>';
  }

  function renderRecent() {
    var cartIds = Shop.cartItems().map(function (i) { return i.product.id; });
    var list = Shop.recent().filter(function (p) { return cartIds.indexOf(p.id) === -1; }).slice(0, 12);
    recentSection.hidden = !list.length;
    if (list.length) Shop.render(recentTrack, list, 'li');
  }

  rootEl.addEventListener('click', function (e) {
    if (!e.target.closest('[data-clear-cart]')) return;
    if (clearDialog && clearDialog.showModal) {
      clearDialog.returnValue = '';
      clearDialog.showModal();
    } else if (window.confirm('همه کالاها از سبد خرید حذف شوند؟')) {
      Shop.clearCart();
    }
  });

  if (clearDialog) {
    clearDialog.addEventListener('close', function () {
      if (clearDialog.returnValue === 'confirm') {
        Shop.clearCart();
        Shop.toast('سبد خرید خالی شد');
        var title = rootEl.querySelector('.cart-empty__title');
        if (title) { title.setAttribute('tabindex', '-1'); title.focus(); }
      } else {
        var btn = rootEl.querySelector('[data-clear-cart]');
        if (btn) btn.focus();
      }
    });
    // Click on the backdrop closes the dialog
    clearDialog.addEventListener('click', function (e) { if (e.target === clearDialog) clearDialog.close('cancel'); });
  }

  Shop.onChange(function () { render(); renderRecent(); });
  render();
  renderRecent();
  UI.initScrollers(recentSection);
})();
