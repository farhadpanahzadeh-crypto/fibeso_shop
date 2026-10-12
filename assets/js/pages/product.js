/* Product detail page: renders one product from ?id=, buy box, tabs, reviews, related rail. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var root = document.querySelector('[data-product-root]');
  var id = new URLSearchParams(window.location.search).get('id');
  var p = Shop.byId(id);
  var esc = Shop.escapeHtml;
  var fmt = Shop.formatPrice;
  var CAT_LABEL = { laptop: 'لپ‌تاپ', network: 'تجهیزات شبکه', parts: 'قطعات و لوازم جانبی' };

  var SVG = {
    shield: window.icon('shield-check'),
    truck: window.icon('truck'),
    box: window.icon('package'),
    share: window.icon('share'),
    minus: window.icon('minus'),
    plus: window.icon('plus')
  };

  if (!p) {
    document.title = 'محصول پیدا نشد | فیبسو';
    root.innerHTML = '<div class="empty-state pdp-missing">' + Shop.icon.bag +
      '<h1>محصول مورد نظر پیدا نشد</h1><p>ممکن است این کالا حذف شده یا آدرس اشتباه باشد.</p>' +
      '<a class="btn btn--primary" href="' + Shop.root + 'pages/shop.html">رفتن به فروشگاه</a></div>';
    return;
  }

  /* ---------- Meta ---------- */
  document.title = p.title + ' | فیبسو';
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', p.desc);
  var crumbCat = document.querySelector('[data-crumb-cat]');
  crumbCat.textContent = CAT_LABEL[p.cat];
  crumbCat.href = Shop.root + 'pages/shop.html?cat=' + p.cat;
  document.querySelector('[data-crumb-title]').textContent = p.title;

  var off = Shop.discountOf(p);
  var out = p.stock === 0;
  var wished = Shop.wishlist().indexOf(p.id) !== -1;

  var gradeNote = p.condition === 'used'
    ? '<p class="pdp__grade"><strong>کالای استوک (کارکرده)' + (p.grade ? '، درجه ' + p.grade : '') + ':</strong> ' +
      'این کالا پیش از فروش تست فنی شده است. ' + (p.grade === 'B' ? 'ممکن است آثار جزئی استفاده روی بدنه دیده شود.' : 'بدنه بدون خط و خش محسوس است.') +
      ' <a href="' + Shop.root + 'pages/warranty.html">درباره درجه‌بندی</a></p>'
    : '';

  var keyspecs = p.specs.slice(0, 4).map(function (s) {
    return '<li><span class="keyspecs__label">' + esc(s[0]) + '</span><span class="keyspecs__value">' + esc(s[1]) + '</span></li>';
  }).join('');

  var buyActions = out
    ? '<p class="stock-out">این کالا در حال حاضر ناموجود است.</p>' +
      '<button class="btn btn--outline btn--block" type="button" data-notify>به من اطلاع بده</button>'
    : '<div class="buybox__actions">' +
        '<div class="qty" role="group" aria-label="تعداد">' +
          '<button type="button" data-pdp-step="1" aria-label="افزایش تعداد">+</button>' +
          '<output aria-live="polite" data-pdp-qty>۱</output>' +
          '<button type="button" data-pdp-step="-1" aria-label="کاهش تعداد">−</button>' +
        '</div>' +
        '<button class="btn btn--primary" type="button" data-add-to-cart="' + p.id + '" data-amount="1">افزودن به سبد خرید</button>' +
      '</div>';

  root.innerHTML =
    '<article class="pdp">' +
      '<div class="pdp__gallery">' +
        '<img src="' + Shop.imageUrl(p) + '" alt="' + esc(p.title) + '" width="400" height="400">' +
        (off ? '<span class="discount">-' + fmt(off) + '٪</span>' : '') +
        '<div class="pdp__gallery-tools">' +
          '<button class="icon-btn icon-btn--round pdp-wish" type="button" data-wish="' + p.id + '" aria-pressed="' + wished + '" aria-label="افزودن به علاقه‌مندی‌ها">' + Shop.icon.heart + '</button>' +
          '<button class="icon-btn icon-btn--round" type="button" data-share aria-label="اشتراک‌گذاری">' + SVG.share + '</button>' +
        '</div>' +
      '</div>' +

      '<div class="pdp__info">' +
        '<a class="pdp__brand" href="' + Shop.root + 'pages/shop.html?brand=' + encodeURIComponent(p.brand) + '">' + esc(p.brand) + '</a>' +
        '<h1 class="pdp__title">' + esc(p.title) + '</h1>' +
        '<div class="pdp__meta">' + Shop.conditionHTML(p) +
          '<span class="product-card__rating">' + Shop.icon.star + fmt(p.rating) + ' از ۵ <span>(' + fmt(p.reviews) + ' نظر)</span></span>' +
          '<span>کد کالا: <span class="ltr">' + esc(p.id.toUpperCase()) + '</span></span>' +
        '</div>' +
        gradeNote +
        '<h2 class="pdp__keyspecs-title">ویژگی‌های اصلی</h2>' +
        '<ul class="keyspecs">' + keyspecs + '</ul>' +
      '</div>' +

      '<aside class="buybox" aria-label="خرید">' +
        '<ul class="buybox__rows">' +
          '<li>' + SVG.shield + '<span>' + esc(p.warranty) + '</span></li>' +
          '<li>' + SVG.box + (out ? '<span>ناموجود</span>' : '<span class="in-stock">موجود در انبار فیبسو</span>') + '</li>' +
          '<li>' + SVG.truck + '<span>ارسال از ۱ تا ۳ روز کاری؛ رایگان برای سفارش‌های بالای ۵ میلیون تومان</span></li>' +
        '</ul>' +
        (out ? '' :
          '<div class="buybox__price">' +
            (p.old ? '<div class="buybox__old"><del class="price__old">' + fmt(p.old) + '</del><span class="discount">-' + fmt(off) + '٪</span></div>' : '') +
            '<span class="price__now">' + fmt(p.price) + ' <span class="price__unit">تومان</span></span>' +
          '</div>') +
        buyActions +
      '</aside>' +
    '</article>' +

    '<section class="pdp-tabs" aria-label="اطلاعات تکمیلی">' +
      '<div class="tabs-line" role="tablist" aria-label="اطلاعات محصول" data-tablist>' +
        '<button class="tabs-line__tab" role="tab" type="button" id="tab-desc" aria-controls="panel-desc" aria-selected="true">توضیحات</button>' +
        '<button class="tabs-line__tab" role="tab" type="button" id="tab-specs" aria-controls="panel-specs" aria-selected="false" tabindex="-1">مشخصات فنی</button>' +
        '<button class="tabs-line__tab" role="tab" type="button" id="tab-reviews" aria-controls="panel-reviews" aria-selected="false" tabindex="-1">نظرات (' + fmt(p.reviews) + ')</button>' +
      '</div>' +
      '<div class="tab-panel pdp-desc" id="panel-desc" role="tabpanel" aria-labelledby="tab-desc" tabindex="0">' +
        '<p>' + esc(p.desc) + '</p>' +
        '<p>' + (p.condition === 'used'
          ? 'همه کالاهای استوک فیبسو پیش از ارسال توسط کارشناسان فنی تست می‌شوند و وضعیت ظاهری آن‌ها به‌صورت شفاف در صفحه محصول درج می‌شود.'
          : 'این کالا نو و آکبند است و با گارانتی معتبر عرضه می‌شود.') + '</p>' +
      '</div>' +
      '<div class="tab-panel" id="panel-specs" role="tabpanel" aria-labelledby="tab-specs" tabindex="0" hidden>' +
        '<table class="spec-table"><caption class="visually-hidden">مشخصات فنی ' + esc(p.title) + '</caption><tbody>' +
          '<tr><th scope="row">برند</th><td>' + esc(p.brand) + '</td></tr>' +
          '<tr><th scope="row">وضعیت</th><td>' + (p.condition === 'used' ? 'استوک' + (p.grade ? '، درجه ' + p.grade : '') : 'نو') + '</td></tr>' +
          p.specs.map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + '</th><td>' + esc(s[1]) + '</td></tr>'; }).join('') +
          '<tr><th scope="row">گارانتی</th><td>' + esc(p.warranty) + '</td></tr>' +
        '</tbody></table>' +
      '</div>' +
      '<div class="tab-panel" id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" tabindex="0" hidden>' +
        '<div class="reviews">' +
          '<div><h2 class="panel__title">نظر خریداران</h2><ul class="review-list" data-review-list></ul></div>' +
          '<form class="panel" novalidate data-review-form>' +
            '<h2 class="panel__title">نظر خود را بنویسید</h2>' +
            '<div class="form-grid">' +
              '<fieldset class="field"><legend class="field__label">امتیاز شما</legend>' +
                '<div class="rating-input" data-rating>' +
                  [5, 4, 3, 2, 1].map(function (n) {
                    return '<input type="radio" id="rate-' + n + '" name="rating" value="' + n + '"><label for="rate-' + n + '" title="' + fmt(n) + ' ستاره">' +
                      Shop.icon.star + '<span class="visually-hidden">' + fmt(n) + ' ستاره</span></label>';
                  }).join('') +
                '</div><p class="field__error" id="rating-error"></p></fieldset>' +
              '<div class="field"><label class="field__label" for="review-name">نام</label>' +
                '<input class="input" id="review-name" name="name" autocomplete="name" aria-describedby="review-name-error"><p class="field__error" id="review-name-error"></p></div>' +
              '<div class="field"><label class="field__label" for="review-text">متن نظر</label>' +
                '<textarea class="input" id="review-text" name="text" aria-describedby="review-text-error"></textarea><p class="field__error" id="review-text-error"></p></div>' +
              '<button class="btn btn--primary" type="submit">ثبت نظر</button>' +
              '<p class="form-status" role="status" data-form-status></p>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</section>' +

    (out ? '' :
      '<div class="buybar" aria-label="خرید سریع">' +
        '<div class="price"><span class="price__now">' + fmt(p.price) + ' <span class="price__unit">تومان</span></span></div>' +
        '<button class="btn btn--primary" type="button" data-add-to-cart="' + p.id + '" data-amount="1">افزودن به سبد</button>' +
      '</div>');

  /* ---------- Quantity picker feeds the add-to-cart amount ---------- */
  var qty = 1;
  var qtyOut = root.querySelector('[data-pdp-qty]');
  root.addEventListener('click', function (event) {
    var step = event.target.closest('[data-pdp-step]');
    if (!step) return;
    qty = Math.min(10, Math.max(1, qty + Number(step.getAttribute('data-pdp-step'))));
    qtyOut.textContent = fmt(qty);
    root.querySelectorAll('.buybox [data-add-to-cart]').forEach(function (b) { b.setAttribute('data-amount', qty); });
  });

  var notify = root.querySelector('[data-notify]');
  if (notify) {
    notify.addEventListener('click', function () {
      Shop.toast('یادآوری موجودی در نسخه نمایشی فعال نیست؛ لطفاً با پشتیبانی تماس بگیرید');
    });
  }

  root.querySelector('[data-share]').addEventListener('click', function () {
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: p.title, url: url }).catch(function () { /* user cancelled */ });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { Shop.toast('لینک محصول کپی شد'); },
        function () { Shop.toast('کپی لینک ممکن نشد'); });
    }
  });

  /* ---------- Tabs (WAI-ARIA, automatic activation; RTL arrows) ---------- */
  var tablist = root.querySelector('[data-tablist]');
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tablist.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) selectTab(t);
  });
  tablist.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement);
    var map = { ArrowLeft: 1, ArrowRight: -1 };
    if (e.key in map) {
      e.preventDefault();
      selectTab(tabs[(i + map[e.key] + tabs.length) % tabs.length], true);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      selectTab(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
    }
  });

  /* ---------- Reviews (sample + front-end only form) ---------- */
  var SAMPLE = [
    { name: 'محمد', rating: 5, text: 'کالا سالم و دقیقاً مطابق توضیحات رسید. بسته‌بندی عالی بود.', date: '۲ مهر ۱۴۰۵' },
    { name: 'سارا', rating: 4, text: 'از کیفیت راضی هستم. ارسال کمی بیشتر از انتظارم طول کشید.', date: '۱۸ شهریور ۱۴۰۵' }
  ];
  var listEl = root.querySelector('[data-review-list]');
  function reviewHTML(r) {
    return '<li class="review"><div class="review__head"><span class="review__author">' + esc(r.name) + '</span>' +
      '<span class="product-card__rating">' + Shop.icon.star + fmt(r.rating) + '</span>' +
      '<span class="text-muted">' + esc(r.date) + '</span></div><p class="review__text">' + esc(r.text) + '</p></li>';
  }
  listEl.innerHTML = SAMPLE.map(reviewHTML).join('');

  var form = root.querySelector('[data-review-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('[data-form-status]');
    var rating = form.querySelector('input[name="rating"]:checked');
    var errors = [
      ['rating-error', null, rating ? '' : 'لطفاً امتیاز خود را انتخاب کنید.'],
      ['review-name-error', form.elements.name, form.elements.name.value.trim().length < 2 ? 'نام خود را وارد کنید.' : ''],
      ['review-text-error', form.elements.text, form.elements.text.value.trim().length < 10 ? 'متن نظر باید حداقل ۱۰ حرف باشد.' : '']
    ];
    var first = null;
    errors.forEach(function (er) {
      document.getElementById(er[0]).textContent = er[2];
      if (er[1]) er[1].setAttribute('aria-invalid', er[2] ? 'true' : 'false');
      if (er[2] && !first) first = er[1] || form.querySelector('input[name="rating"]');
    });
    if (first) { first.focus(); return; }
    listEl.insertAdjacentHTML('afterbegin', reviewHTML({ name: form.elements.name.value.trim(), rating: Number(rating.value), text: form.elements.text.value.trim(), date: 'هم‌اکنون' }));
    status.className = 'form-status form-status--success';
    status.textContent = 'نظر شما فقط در همین مرورگر نمایش داده شد؛ ثبت نهایی نظرها پس از اتصال به سرور فعال می‌شود.';
    form.reset();
  });

  /* ---------- Related products ---------- */
  var related = Shop.query({ cat: p.cat }).filter(function (x) { return x.id !== p.id; }).slice(0, 10);
  if (related.length) {
    document.querySelector('[data-related-section]').hidden = false;
    Shop.render(document.querySelector('[data-related]'), related, 'li');
    UI.initScrollers(document);
  }
})();
