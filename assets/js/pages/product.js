/* Product detail page: gallery, info, buy box, sticky section nav (intro, specs,
   reviews), similar products and recently viewed rails. Renders ?id= */
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
  var ic = window.icon;
  var SHOP = Shop.root + 'pages/shop.html';
  var CAT_LABEL = { laptop: 'لپ‌تاپ', network: 'تجهیزات شبکه', parts: 'قطعات و لوازم جانبی' };
  var SUB_LABEL = {
    router: 'مودم و روتر', 'switch': 'سوییچ شبکه', ap: 'اکسس پوینت', cable: 'کابل و پچ‌کورد', rack: 'رک شبکه',
    nic: 'کارت شبکه', ram: 'رم لپ‌تاپ', ssd: 'حافظه SSD', charger: 'شارژر و آداپتور', mouse: 'ماوس و جانبی'
  };

  if (!p) {
    document.title = 'محصول پیدا نشد | فیبسو';
    root.innerHTML = '<div class="empty-state pdp-missing">' + Shop.icon.bag +
      '<h1>محصول مورد نظر پیدا نشد</h1><p>ممکن است این کالا حذف شده یا آدرس اشتباه باشد.</p>' +
      '<a class="btn btn--primary" href="' + SHOP + '">رفتن به فروشگاه</a></div>';
    showRecent(null);
    return;
  }

  /* ---------- Meta + breadcrumb ---------- */
  document.title = p.title + ' | فیبسو';
  var desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', p.desc);
  var crumbCat = document.querySelector('[data-crumb-cat]');
  crumbCat.textContent = CAT_LABEL[p.cat] || 'فروشگاه';
  crumbCat.href = SHOP + '?cat=' + p.cat;
  var crumbSub = document.querySelector('[data-crumb-sub]');
  var subLabel = p.cat === 'laptop' ? (p.condition === 'used' ? 'لپ‌تاپ استوک' : 'لپ‌تاپ نو') : SUB_LABEL[p.sub];
  if (subLabel) {
    crumbSub.textContent = subLabel;
    crumbSub.href = SHOP + (p.cat === 'laptop' ? '?cat=laptop&condition=' + p.condition : '?sub=' + p.sub);
    crumbSub.parentNode.hidden = false;
  }
  document.querySelector('[data-crumb-title]').textContent = p.title;

  var off = Shop.discountOf(p);
  var out = p.stock === 0;
  var low = p.stock > 0 && p.stock <= 3;
  var wished = Shop.wishlist().indexOf(p.id) !== -1;
  var used = p.condition === 'used';

  // Latin model name from the title, shown as the subtitle ("ThinkPad E14 Core i5")
  var latin = (p.title.match(/[A-Za-z][A-Za-z0-9.+\-\/]*(?:\s+[A-Za-z0-9][A-Za-z0-9.+\-\/]*)*/g) || []).join(' ');

  /* ---------- Gallery: full view + close-up views of the same picture ---------- */
  var VIEWS = [
    { label: 'نمای کامل', s: 1, o: '50% 50%' },
    { label: 'نمای نزدیک از بالا', s: 1.7, o: '50% 25%' },
    { label: 'نمای نزدیک از راست', s: 1.8, o: '78% 55%' },
    { label: 'نمای نزدیک از چپ', s: 1.8, o: '22% 55%' }
  ];
  function viewStyle(v) {
    return 'transform:scale(' + v.s + ');transform-origin:' + v.o;
  }
  var img = Shop.imageUrl(p);
  var thumbs = VIEWS.map(function (v, i) {
    return '<li><button class="pdp-thumb" type="button" data-view="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + v.label + '">' +
      '<img src="' + img + '" alt="" width="400" height="400" style="' + viewStyle(v) + '"></button></li>';
  }).join('');

  /* ---------- Info column ---------- */
  var features = p.specs.filter(function (s) { return !/وضعیت ظاهری/.test(s[0]); }).slice(0, 6).map(function (s) {
    return '<li><span class="pdp-features__label">' + esc(s[0]) + '</span><span class="pdp-features__value">' + esc(s[1]) + '</span></li>';
  }).join('');

  var gradeBox = used
    ? '<div class="pdp-grade">' + ic('seal-check') +
        '<div><p class="pdp-grade__title">کالای استوک' + (p.grade ? '، درجه ' + p.grade : '') + '</p>' +
        '<p>این کالا پیش از فروش تست فنی شده است. ' +
          (p.grade === 'B' ? 'ممکن است آثار جزئی استفاده مانند خط و خش سطحی روی بدنه دیده شود.' : 'بدنه بدون خط و خش محسوس است.') + '</p>' +
        '<a class="link-arrow" href="' + Shop.root + 'pages/warranty.html">درباره درجه‌بندی و ضمانت سلامت ' + ic('caret-left') + '</a></div>' +
      '</div>'
    : '';

  /* ---------- Buy box ---------- */
  var priceBlock = out
    ? '<p class="buybox__out">' + ic('info') + 'این کالا در حال حاضر ناموجود است.</p>'
    : '<div class="buybox__price">' +
        (off ? '<div class="buybox__old"><span class="discount"><span class="visually-hidden">تخفیف </span>' + fmt(off) + '٪</span>' +
          '<del class="price__old"><span class="visually-hidden">قیمت قبلی: </span>' + fmt(p.old) + '</del></div>' : '') +
        '<p class="price__now">' + fmt(p.price) + ' <span class="price__unit">تومان</span></p>' +
      '</div>';

  var buyActions = out
    ? '<button class="btn btn--outline btn--block" type="button" data-notify>' + ic('envelope') + 'موجود شد خبرم کن</button>'
    : '<div class="buybox__actions">' +
        '<div class="qty" role="group" aria-label="تعداد">' +
          '<button type="button" data-pdp-step="1" aria-label="افزایش تعداد">' + ic('plus') + '</button>' +
          '<output aria-live="polite" data-pdp-qty>۱</output>' +
          '<button type="button" data-pdp-step="-1" aria-label="کاهش تعداد" disabled>' + ic('minus') + '</button>' +
        '</div>' +
        '<button class="btn btn--primary buybox__add" type="button" data-add-to-cart="' + p.id + '" data-amount="1">' + ic('cart-plus') + 'افزودن به سبد خرید</button>' +
      '</div>';

  /* ---------- Sections below ---------- */
  var specRows =
    '<tr><th scope="row">برند</th><td>' + esc(p.brand) + '</td></tr>' +
    (latin ? '<tr><th scope="row">مدل</th><td><span lang="en" dir="ltr">' + esc(latin) + '</span></td></tr>' : '') +
    '<tr><th scope="row">وضعیت</th><td>' + (used ? 'استوک' + (p.grade ? '، درجه ' + p.grade : '') : 'نو') + '</td></tr>' +
    p.specs.map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + '</th><td>' + esc(s[1]) + '</td></tr>'; }).join('') +
    '<tr><th scope="row">گارانتی</th><td>' + esc(p.warranty) + '</td></tr>';

  var stars = [1, 2, 3, 4, 5].map(function (n) {
    return '<span class="pdp-stars__star' + (n <= Math.round(p.rating) ? ' is-on' : '') + '">' + Shop.icon.star + '</span>';
  }).join('');

  root.innerHTML =
    '<article class="pdp" aria-labelledby="pdp-title">' +
      '<div class="pdp__gallery">' +
        '<div class="pdp__stage">' +
          '<img src="' + img + '" alt="' + esc(p.title) + '" width="400" height="400" data-stage style="' + viewStyle(VIEWS[0]) + '">' +
          '<div class="pdp__tools">' +
            '<button class="pdp-tool pdp-wish" type="button" data-wish="' + p.id + '" aria-pressed="' + wished + '" aria-label="افزودن به علاقه‌مندی‌ها">' + Shop.icon.heart + '</button>' +
            '<button class="pdp-tool" type="button" data-share aria-label="اشتراک‌گذاری">' + ic('share') + '</button>' +
          '</div>' +
        '</div>' +
        '<ul class="pdp__thumbs" aria-label="تصاویر محصول">' + thumbs + '</ul>' +
      '</div>' +

      '<div class="pdp__info">' +
        '<h1 class="pdp__title" id="pdp-title">' + esc(p.title) + '</h1>' +
        (latin ? '<p class="pdp__subtitle"><span lang="en" dir="ltr">' + esc(latin) + '</span></p>' : '') +
        '<div class="pdp__meta">' +
          '<span class="pdp__rating">' + Shop.icon.star + '<span>' + fmt(p.rating) + '</span>' +
            '<a href="#reviews">(' + fmt(p.reviews) + ' نظر)</a></span>' +
          Shop.conditionHTML(p) +
          '<a class="pdp__brand" href="' + SHOP + '?brand=' + encodeURIComponent(p.brand) + '">برند: ' + esc(p.brand) + '</a>' +
        '</div>' +
        '<h2 class="pdp__h">ویژگی‌ها</h2>' +
        '<ul class="pdp-features">' + features + '</ul>' +
        '<a class="link-arrow pdp__all-specs" href="#specs">مشاهده همه مشخصات ' + ic('caret-left') + '</a>' +
        gradeBox +
      '</div>' +

      '<aside class="buybox" aria-labelledby="buybox-title">' +
        '<h2 class="visually-hidden" id="buybox-title">خرید این کالا</h2>' +
        '<ul class="buybox__rows">' +
          '<li>' + ic('shield-check') + '<span>' + esc(p.warranty) + '</span></li>' +
          '<li>' + ic('storefront') + (out ? '<span class="text-muted">ناموجود در انبار</span>'
            : '<span><span class="in-stock">موجود در انبار فیبسو</span>' +
              (low ? '<span class="stock-low">' + Shop.icon.stock + 'تنها ' + fmt(p.stock) + ' عدد باقی مانده</span>' : '') + '</span>') + '</li>' +
          '<li>' + ic('truck') + '<span>ارسال ۱ تا ۳ روز کاری<span class="buybox__hint">رایگان برای سفارش‌های بالای ۵ میلیون تومان</span></span></li>' +
          '<li>' + ic('package') + '<span><span>کد کالا: <span dir="ltr">' + esc(p.id.toUpperCase()) + '</span></span></span></li>' +
        '</ul>' +
        priceBlock +
        buyActions +
      '</aside>' +
    '</article>' +

    '<nav class="pdp-nav" aria-label="بخش‌های صفحه محصول" data-pdp-nav>' +
      '<ul>' +
        '<li><a href="#intro" aria-current="true">معرفی</a></li>' +
        '<li><a href="#specs">مشخصات فنی</a></li>' +
        '<li><a href="#reviews">نظرات <span class="pdp-nav__count">' + fmt(p.reviews) + '</span></a></li>' +
      '</ul>' +
    '</nav>' +

    '<div class="pdp-sections">' +
      '<section class="pdp-section" id="intro" aria-labelledby="intro-title">' +
        '<h2 class="pdp-section__title" id="intro-title">معرفی</h2>' +
        '<div class="pdp-prose">' +
          '<p>' + esc(p.desc) + '</p>' +
          '<p>' + (used
            ? 'همه کالاهای استوک فیبسو پیش از ارسال توسط کارشناسان فنی تست می‌شوند و وضعیت ظاهری آن‌ها به‌صورت شفاف در صفحه محصول درج می‌شود.'
            : 'این کالا نو و آکبند است و با ' + esc(p.warranty) + ' عرضه می‌شود.') + '</p>' +
        '</div>' +
      '</section>' +

      '<section class="pdp-section" id="specs" aria-labelledby="specs-title">' +
        '<h2 class="pdp-section__title" id="specs-title">مشخصات فنی</h2>' +
        '<table class="spec-table"><caption class="visually-hidden">مشخصات فنی ' + esc(p.title) + '</caption><tbody>' + specRows + '</tbody></table>' +
      '</section>' +

      '<section class="pdp-section" id="reviews" aria-labelledby="reviews-title">' +
        '<h2 class="pdp-section__title" id="reviews-title">نظرات خریداران</h2>' +
        '<div class="reviews">' +
          '<div class="reviews__summary">' +
            '<p class="reviews__score"><strong>' + fmt(p.rating) + '</strong> از ۵</p>' +
            '<div class="pdp-stars" aria-hidden="true">' + stars + '</div>' +
            '<p class="text-muted">بر اساس ' + fmt(p.reviews) + ' نظر خریداران</p>' +
          '</div>' +
          '<ul class="review-list" data-review-list></ul>' +
          '<form class="panel review-form" novalidate data-review-form>' +
            '<h3 class="panel__title">نظر خود را بنویسید</h3>' +
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
      '</section>' +
    '</div>' +

    (out ? '' :
      '<div class="buybar" role="region" aria-label="خرید سریع">' +
        '<div class="buybar__price">' +
          (off ? '<span class="buybar__old"><span class="discount">' + fmt(off) + '٪</span><del class="price__old">' + fmt(p.old) + '</del></span>' : '') +
          '<span class="price__now">' + fmt(p.price) + ' <span class="price__unit">تومان</span></span>' +
        '</div>' +
        '<button class="btn btn--primary" type="button" data-add-to-cart="' + p.id + '" data-amount="1">افزودن به سبد</button>' +
      '</div>');

  /* ---------- Gallery views ---------- */
  var stage = root.querySelector('[data-stage]');
  root.querySelector('.pdp__thumbs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (!b) return;
    stage.setAttribute('style', viewStyle(VIEWS[Number(b.getAttribute('data-view'))]));
    root.querySelectorAll('[data-view]').forEach(function (t) { t.setAttribute('aria-pressed', String(t === b)); });
  });

  /* ---------- Quantity picker feeds the add-to-cart amount ---------- */
  var qty = 1;
  var qtyOut = root.querySelector('[data-pdp-qty]');
  root.addEventListener('click', function (event) {
    var step = event.target.closest('[data-pdp-step]');
    if (!step) return;
    qty = Math.min(10, Math.max(1, qty + Number(step.getAttribute('data-pdp-step'))));
    qtyOut.textContent = fmt(qty);
    root.querySelector('[data-pdp-step="-1"]').disabled = qty <= 1;
    root.querySelector('[data-pdp-step="1"]').disabled = qty >= 10;
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

  /* ---------- Sticky section nav: sits under the sticky header, tracks the section in view ---------- */
  var header = document.querySelector('.site-header');
  function syncOffset() {
    var h = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--pdp-sticky-top', Math.round(h) + 'px');
  }
  syncOffset();
  window.addEventListener('resize', syncOffset);

  var navLinks = Array.prototype.slice.call(root.querySelectorAll('[data-pdp-nav] a'));
  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function setCurrent(i) {
    navLinks.forEach(function (a, j) {
      if (i === j) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  var nav = root.querySelector('[data-pdp-nav]');
  function spy() {
    var line = nav.getBoundingClientRect().bottom + 96;
    var current = 0;
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) current = i; });
    setCurrent(current);
  }
  nav.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a) setCurrent(navLinks.indexOf(a));
  });
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; spy(); });
  }, { passive: true });

  /* ---------- Reviews (sample + front-end only form) ---------- */
  // Buyer reviews come from the server once it exists; until then the list starts empty.
  var listEl = root.querySelector('[data-review-list]');
  function reviewHTML(r) {
    return '<li class="review"><div class="review__head"><span class="review__author">' + esc(r.name) + '</span>' +
      '<span class="product-card__rating">' + Shop.icon.star + fmt(r.rating) + '</span>' +
      '<span class="text-muted">' + esc(r.date) + '</span></div><p class="review__text">' + esc(r.text) + '</p></li>';
  }
  listEl.innerHTML = '<li class="review review--empty text-muted">هنوز نظری برای این کالا ثبت نشده است. اولین نفر باشید.</li>';

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
    var empty = listEl.querySelector('.review--empty');
    if (empty) empty.remove();
    listEl.insertAdjacentHTML('afterbegin', reviewHTML({ name: form.elements.name.value.trim(), rating: Number(rating.value), text: form.elements.text.value.trim(), date: 'هم‌اکنون' }));
    status.className = 'form-status form-status--success';
    status.textContent = 'نظر شما فقط در همین مرورگر نمایش داده شد؛ ثبت نهایی نظرها پس از اتصال به سرور فعال می‌شود.';
    form.reset();
  });

  /* ---------- Similar products: same sub-category first, then the same category ---------- */
  var related = Shop.query({ cat: p.cat }).filter(function (x) { return x.id !== p.id; });
  related.sort(function (a, b) {
    var sa = (a.sub === p.sub && a.condition === p.condition) ? 0 : (a.sub === p.sub || a.condition === p.condition) ? 1 : 2;
    var sb = (b.sub === p.sub && b.condition === p.condition) ? 0 : (b.sub === p.sub || b.condition === p.condition) ? 1 : 2;
    return sa - sb;
  });
  related = related.slice(0, 10);
  if (related.length) {
    document.querySelector('[data-related-section]').hidden = false;
    document.querySelector('[data-related-all]').href = SHOP + '?cat=' + p.cat;
    Shop.render(document.querySelector('[data-related]'), related, 'li');
  }

  showRecent(p.id);
  Shop.addRecent(p.id);
  UI.initScrollers(document);

  /* ---------- Recently viewed (read before recording this visit) ---------- */
  function showRecent(currentId) {
    var list = Shop.recent().filter(function (x) { return x.id !== currentId; }).slice(0, 10);
    if (!list.length) return;
    document.querySelector('[data-recent-section]').hidden = false;
    Shop.render(document.querySelector('[data-recent]'), list, 'li');
    if (!currentId) UI.initScrollers(document);
  }
})();
