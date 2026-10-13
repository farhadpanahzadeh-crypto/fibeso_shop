/* Fibeso blog: magazine home (hero mosaic, carousels, ?cat= / ?q= results)
   and the single post page (TOC, share, comments in localStorage, sidebar, related). */
(function () {
  'use strict';

  var posts = (window.SHOP_POSTS || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var cats = window.SHOP_POST_CATS || [];
  var Shop = window.Shop;
  var UI = window.UI;
  if (!Shop || !UI) return;

  var esc = Shop.escapeHtml;
  var root = document.documentElement.getAttribute('data-root') || '';
  var fa = UI.toPersianDigits;
  var ic = window.icon || function () { return ''; };
  var params = new URLSearchParams(window.location.search);
  var DAY = 86400000;
  var weekday = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long' });
  var dayMonthYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
  function dateLong(d) { return weekday.format(d) + ' ' + dayMonthYear.format(d); }

  function postUrl(p) { return root + 'pages/post.html?slug=' + encodeURIComponent(p.slug); }
  function imgSrc(p) { return root + 'assets/images/products/' + p.img + '.svg'; }
  function catLabel(id) {
    var c = cats.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : '';
  }

  function parseDate(iso) {
    var d = String(iso).split('-');
    return new Date(+d[0], +d[1] - 1, +d[2], 12);
  }

  /* «۳ روز قبل», «۲ هفته قبل», «۱ ماه قبل» */
  function timeAgo(iso) {
    var diff = Math.floor((Date.now() - (typeof iso === 'number' ? iso : parseDate(iso).getTime())) / DAY);
    if (typeof iso === 'number' && Date.now() - iso < 3600000) return 'همین الان';
    if (diff <= 0) return 'امروز';
    if (diff < 7) return fa(diff) + ' روز قبل';
    if (diff < 30) return fa(Math.floor(diff / 7)) + ' هفته قبل';
    if (diff < 365) return fa(Math.floor(diff / 30)) + ' ماه قبل';
    return fa(Math.floor(diff / 365)) + ' سال قبل';
  }

  function initials(name) {
    return String(name || '؟').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('\u2009');
  }

  function tone(name) {
    var sum = 0;
    String(name).split('').forEach(function (c) { sum += c.charCodeAt(0); });
    return sum % 4;
  }

  function avatar(name, cls) {
    return '<span class="avatar avatar--t' + tone(name) + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  }

  /* ---------- Cards ---------- */
  function cardHTML(p, level) {
    var h = 'h' + (level || 3);
    return '<li><article class="post-card">' +
      '<div class="post-card__media"><img src="' + imgSrc(p) + '" alt="" width="400" height="400" loading="lazy">' +
      '<span class="post-card__time"><time datetime="' + p.date + '">' + timeAgo(p.date) + '</time></span></div>' +
      avatar(p.author, 'post-card__avatar') +
      '<div class="post-card__body"><p class="post-card__author">' + esc(p.author) + '</p>' +
      '<' + h + ' class="post-card__title"><a href="' + postUrl(p) + '">' + esc(p.title) + '</a></' + h + '>' +
      '</div></article></li>';
  }

  function heroTileHTML(p, big) {
    var src = p.cover ? root + 'assets/images/banners/' + p.cover + '.svg' : imgSrc(p);
    return '<article class="hero-tile' + (big ? ' hero-tile--big' : '') + (p.cover ? ' hero-tile--cover' : '') + '">' +
      '<img src="' + src + '" alt="" width="1600" height="520"' + (big ? '' : ' loading="lazy"') + '>' +
      '<div class="hero-tile__caption"><span class="hero-tile__cat">' + esc(p.catLabel) + '</span>' +
      '<h2 class="hero-tile__title"><a href="' + postUrl(p) + '">' + esc(p.title) + '</a></h2></div></article>';
  }

  function carouselHTML(id, list, level) {
    return '<button class="round-btn post-carousel__btn post-carousel__btn--prev" type="button" aria-label="مطالب قبلی" data-scroll-prev="' + id + '">' + ic('caret-right') + '</button>' +
      '<div class="scroller post-scroller" data-scroller="' + id + '"><ul class="scroller__track">' +
      list.map(function (p) { return cardHTML(p, level); }).join('') + '</ul></div>' +
      '<button class="round-btn post-carousel__btn post-carousel__btn--next" type="button" aria-label="مطالب بعدی" data-scroll-next="' + id + '">' + ic('caret-left') + '</button>';
  }

  function fillCarousel(id, list, level) {
    var el = document.querySelector('[data-carousel="' + id + '"]');
    if (el) el.innerHTML = carouselHTML(id, list, level);
  }

  /* ---------- Blog bar: active category + search value ---------- */
  var activeCat = params.get('cat') || '';
  var query = (params.get('q') || '').trim();
  document.querySelectorAll('[data-blog-cats] [data-cat]').forEach(function (a) {
    if (a.getAttribute('data-cat') === activeCat) a.setAttribute('aria-current', 'page');
  });
  var qInput = document.querySelector('[data-blog-q]');
  if (qInput && query) qInput.value = query;

  /* ---------- Blog home ---------- */
  var home = document.querySelector('[data-blog-home]');
  if (home) {
    var results = document.querySelector('[data-blog-results]');
    if ((activeCat && catLabel(activeCat)) || query) {
      var norm = function (s) { return UI.toLatinDigits(String(s)).toLowerCase().replace(/[‌\s-]+/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک'); };
      var needle = norm(query);
      var found = posts.filter(function (p) {
        if (activeCat && p.cat !== activeCat) return false;
        if (!needle) return true;
        return norm([p.title, p.excerpt, p.catLabel, p.author, (p.tags || []).join(' ')].join(' ')).indexOf(needle) !== -1;
      });
      var title = query ? 'نتایج جستجو برای «' + query + '»' + (activeCat ? ' در ' + catLabel(activeCat) : '') : catLabel(activeCat);
      home.hidden = true;
      results.hidden = false;
      document.title = title + ' | وبلاگ فیبسو';
      results.querySelector('[data-results-title]').textContent = title;
      results.querySelector('[data-results-crumb]').textContent = query ? 'جستجو' : catLabel(activeCat);
      results.querySelector('[data-results-count]').textContent = found.length ? fa(found.length) + ' مطلب پیدا شد' : '';
      results.querySelector('[data-results-list]').innerHTML = found.length ? found.map(function (p) { return cardHTML(p, 2); }).join('') :
        '<li class="empty-state">' + ic('magnifying-glass') + '<p>مطلبی با این عنوان پیدا نشد. عبارت کوتاه‌تری را امتحان کنید یا از دسته‌بندی‌ها کمک بگیرید.</p>' +
        '<a class="btn btn--outline" href="' + root + 'pages/blog.html">همه مطالب وبلاگ</a></li>';
    } else {
      var heroPosts = posts.filter(function (p) { return p.hero; });
      heroPosts.sort(function (a, b) { return (b.cover === 'hero-1') - (a.cover === 'hero-1'); });
      var big = home.querySelector('[data-hero-big]');
      var side = home.querySelector('[data-hero-side]');
      if (heroPosts[0]) big.innerHTML = heroTileHTML(heroPosts[0], true);
      side.innerHTML = heroPosts.slice(1, 3).map(function (p) { return heroTileHTML(p, false); }).join('');

      fillCarousel('picks', posts.filter(function (p) { return p.pick; }));

      var sections = [{ id: 'latest', title: 'تازه‌ترین‌ها', list: posts.slice(0, 8) }].concat(cats.map(function (c) {
        return { id: c.id, title: c.label, list: posts.filter(function (p) { return p.cat === c.id; }), href: root + 'pages/blog.html?cat=' + c.id };
      })).filter(function (s) { return s.list.length; });

      home.querySelector('[data-blog-sections]').innerHTML = sections.map(function (s) {
        return '<section class="blog-box" aria-labelledby="sec-' + s.id + '"><div class="blog-box__head">' +
          '<h2 class="blog-box__title" id="sec-' + s.id + '">' + esc(s.title) + '</h2>' +
          (s.href ? '<a class="view-all" href="' + s.href + '">مشاهده همه' + ic('caret-left') + '</a>' : '') + '</div>' +
          '<div class="post-carousel" data-carousel="' + s.id + '">' + carouselHTML('c-' + s.id, s.list) + '</div></section>';
      }).join('');
    }
  }

  /* ---------- Single post ---------- */
  var article = document.querySelector('[data-article]');

  function renderPost() {
    var slug = params.get('slug');
    var post = posts.filter(function (p) { return p.slug === slug; })[0];
    var bodyEl = article.querySelector('[data-article-body]');
    var comments = document.getElementById('comments');

    if (!post) {
      document.title = 'مطلب پیدا نشد | وبلاگ فیبسو';
      document.querySelector('[data-crumb-title]').textContent = 'مطلب پیدا نشد';
      bodyEl.innerHTML = '<div class="empty-state">' + ic('newspaper') + '<h1 class="post__title" id="post-title">این مطلب پیدا نشد</h1>' +
        '<p>ممکن است آدرس اشتباه باشد یا مطلب حذف شده باشد.</p><a class="btn btn--primary" href="' + root + 'pages/blog.html">بازگشت به وبلاگ</a></div>';
      comments.hidden = true;
      fillSidebar(null);
      fillCarousel('related', posts.slice(0, 8));
      UI.initScrollers(document);
      return;
    }

    document.title = post.title + ' | وبلاگ فیبسو';
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', post.excerpt);
    document.querySelector('[data-crumb-title]').textContent = post.title;
    var crumbCat = document.querySelector('[data-crumb-cat]');
    crumbCat.innerHTML = '<a href="' + root + 'pages/blog.html?cat=' + post.cat + '">' + esc(post.catLabel) + '</a>';
    crumbCat.hidden = false;

    var n = 0;
    var toc = [];
    var body = post.body.map(function (b) {
      var t = b[0];
      if (t === 'h2') {
        n += 1;
        toc.push(b[1]);
        return '<h2 id="sec-' + n + '">' + esc(b[1]) + '</h2>';
      }
      if (t === 'ul' || t === 'ol') return '<' + t + '>' + b[1].map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</' + t + '>';
      if (t === 'tip') {
        return '<aside class="post-tip">' + ic('info') + '<p>' + esc(b[1]) +
          (b[2] ? ' <a href="' + root + b[2] + '">' + esc(b[3] || 'بیشتر بخوانید') + '</a>' : '') + '</p></aside>';
      }
      return '<' + t + '>' + esc(b[1]) + '</' + t + '>';
    }).join('');

    bodyEl.innerHTML =
      '<figure class="post-figure"><div class="post-figure__media"><img src="' + imgSrc(post) + '" alt="" width="400" height="400">' +
        '<span class="post-figure__time"><time datetime="' + post.date + '">' + timeAgo(post.date) + '</time></span></div>' +
        '<figcaption class="post-figure__author">' + avatar(post.author, 'avatar--lg') +
        '<span><span class="post-figure__name">' + esc(post.author) + '</span><span class="post-figure__role">' + esc(post.authorRole || '') + '</span></span></figcaption>' +
      '</figure>' +
      '<div class="post-actions">' +
        '<button class="post-share" type="button" data-share>' + ic('share') + '<span class="visually-hidden">اشتراک‌گذاری مطلب</span></button>' +
        '<a class="post-talk" href="#comments">' + ic('chat') + 'نظرت چیه؟</a>' +
      '</div>' +
      '<h1 class="post__title" id="post-title">' + esc(post.title) + '</h1>' +
      '<p class="post__meta"><a href="' + root + 'pages/blog.html?cat=' + post.cat + '">' + esc(post.catLabel) + '</a><span>' + ic('clock') + fa(post.read) + ' دقیقه مطالعه</span></p>' +
      (toc.length ? '<nav class="post-toc" aria-labelledby="toc-title"><p class="post-toc__title" id="toc-title">فهرست مطالب</p><ul>' +
        toc.map(function (t, i) { return '<li><a href="#sec-' + (i + 1) + '">' + esc(t) + '</a></li>'; }).join('') + '</ul></nav>' : '') +
      '<p class="post__date"><time datetime="' + post.date + '">' + dateLong(parseDate(post.date)) + '</time></p>' +
      '<p class="post__lead">' + esc(post.excerpt) + '</p>' +
      '<div class="prose post__body">' + body + '</div>';

    bodyEl.querySelector('[data-share]').addEventListener('click', function () {
      var data = { title: post.title, text: post.excerpt, url: window.location.href };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(data.url).then(function () { Shop.toast('پیوند مطلب کپی شد'); }, function () { Shop.toast('کپی پیوند ممکن نشد'); });
      }
    });

    fillSidebar(post);
    var related = posts.filter(function (p) { return p.slug !== post.slug && p.cat === post.cat; })
      .concat(posts.filter(function (p) { return p.slug !== post.slug && p.cat !== post.cat; })).slice(0, 8);
    fillCarousel('related', related);
    UI.initScrollers(document);
    initComments(post);
  }

  function sideCardHTML(p) {
    return '<li><article class="post-card post-card--side">' +
      '<div class="post-card__media"><img src="' + imgSrc(p) + '" alt="" width="400" height="400" loading="lazy">' +
      '<span class="post-card__time"><time datetime="' + p.date + '">' + timeAgo(p.date) + '</time></span></div>' +
      avatar(p.author, 'post-card__avatar') +
      '<div class="post-card__body"><p class="post-card__author">' + esc(p.author) + '</p>' +
      '<h3 class="post-card__title"><a href="' + postUrl(p) + '">' + esc(p.title) + '</a></h3></div></article></li>';
  }

  function fillSidebar(post) {
    var others = posts.filter(function (p) { return !post || p.slug !== post.slug; });
    var picks = others.filter(function (p) { return p.pick; }).slice(0, 3);
    var howto = others.filter(function (p) { return (p.cat === 'network' || p.cat === 'parts') && picks.indexOf(p) === -1; }).slice(0, 3);
    document.querySelector('[data-side-picks]').innerHTML = picks.map(sideCardHTML).join('');
    document.querySelector('[data-side-howto]').innerHTML = howto.map(sideCardHTML).join('');
  }

  /* ---------- Comments (demo: stored in this browser only) ---------- */
  var KEY = 'fibeso-comments';
  function readComments() {
    try { return JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  function initComments(post) {
    var list = document.querySelector('[data-comments]');
    var form = document.querySelector('[data-comment-form]');
    var status = form.querySelector('[data-form-status]');

    function render() {
      var items = readComments()[post.slug] || [];
      list.innerHTML = items.length ? items.map(function (c) {
        return '<li class="comment">' + avatar(c.name) + '<div><p class="comment__head"><strong>' + esc(c.name) + '</strong>' +
          '<span>' + timeAgo(c.at) + '</span></p><p class="comment__text">' + esc(c.text) + '</p></div></li>';
      }).join('') : '<li class="comments__empty">هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهد.</li>';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';
      var data = window.Store && window.Store.validateForm(form);
      if (!data) return;
      var all = readComments();
      all[post.slug] = (all[post.slug] || []).concat({ name: data.name, text: data.text, at: Date.now() });
      try {
        window.localStorage.setItem(KEY, JSON.stringify(all));
        form.reset();
        status.classList.add('form-status--success');
        status.textContent = 'نظر شما ثبت شد. در نسخه نمایشی، نظر فقط روی همین مرورگر دیده می‌شود.';
        render();
      } catch (err) {
        status.classList.add('form-status--error');
        status.textContent = 'ذخیره نظر در این مرورگر ممکن نشد.';
      }
    });
    render();
  }

  if (article) renderPost();
  if (home) UI.initScrollers(document);
})();
