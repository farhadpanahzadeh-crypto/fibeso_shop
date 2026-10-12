/* Blog list (category filter) and single article rendering from window.SHOP_POSTS. */
(function () {
  'use strict';

  var posts = window.SHOP_POSTS || [];
  var Shop = window.Shop;
  if (!Shop) return;
  var esc = Shop.escapeHtml;
  var root = Shop.root;
  var dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
  var fa = function (n) { return Shop.formatPrice(n); };

  function cardHTML(p) {
    return '<li><article class="card post-card">' +
      '<div class="card__media"><img src="' + root + 'assets/images/products/' + p.img + '.svg" alt="" width="400" height="400" loading="lazy"></div>' +
      '<div class="card__body"><span class="badge">' + esc(p.catLabel) + '</span>' +
      '<h2 class="card__title"><a href="' + root + 'pages/post.html?slug=' + p.slug + '">' + esc(p.title) + '</a></h2>' +
      '<p class="card__text">' + esc(p.excerpt) + '</p>' +
      '<p class="card__meta"><time datetime="' + p.date + '">' + dateFmt.format(new Date(p.date)) + '</time><span>' + fa(p.read) + ' دقیقه مطالعه</span></p>' +
      '</div></article></li>';
  }

  /* ---------- List ---------- */
  var list = document.querySelector('[data-post-list]');
  if (list) {
    var filters = document.querySelector('[data-blog-filters]');
    var render = function (cat) {
      var items = posts.filter(function (p) { return !cat || p.cat === cat; });
      list.innerHTML = items.length ? items.map(cardHTML).join('') : '<li class="empty-state">مطلبی در این دسته وجود ندارد.</li>';
    };
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      filters.querySelectorAll('[data-cat]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render(b.getAttribute('data-cat'));
    });
    render('');
  }

  /* ---------- Article ---------- */
  var article = document.querySelector('[data-article]');
  if (article) {
    var slug = new URLSearchParams(window.location.search).get('slug');
    var post = posts.filter(function (p) { return p.slug === slug; })[0];
    var hero = document.querySelector('[data-article-hero]');
    if (!post) {
      hero.innerHTML = '<h1 class="page-hero__title">مطلب پیدا نشد</h1>';
      article.innerHTML = '<p class="empty-state">این مطلب وجود ندارد. <a href="' + root + 'pages/blog.html">بازگشت به بلاگ</a></p>';
      return;
    }
    document.title = post.title + ' | بلاگ فیبسو';
    document.querySelector('[data-crumb-title]').textContent = post.title;
    hero.innerHTML = '<span class="badge">' + esc(post.catLabel) + '</span><h1 class="page-hero__title">' + esc(post.title) + '</h1>' +
      '<p class="article__meta"><time datetime="' + post.date + '">' + dateFmt.format(new Date(post.date)) + '</time><span>' + fa(post.read) + ' دقیقه مطالعه</span><span>نویسنده: تیم فنی فیبسو</span></p>';
    article.innerHTML = '<figure class="article__figure"><img src="' + root + 'assets/images/products/' + post.img + '.svg" alt="" width="400" height="400"></figure>' +
      '<p class="lead">' + esc(post.excerpt) + '</p>' +
      post.body.map(function (b) { return '<' + b[0] + '>' + esc(b[1]) + '</' + b[0] + '>'; }).join('');
    var more = document.querySelector('[data-more-posts]');
    if (more) more.innerHTML = posts.filter(function (p) { return p.slug !== post.slug; }).map(cardHTML).join('');
  }
})();
