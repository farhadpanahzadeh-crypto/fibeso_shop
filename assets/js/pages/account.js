/* User panel: hash-routed sections. Desktop shows the sidebar next to the
   active section (dashboard by default); phones show the menu first (#menu)
   and open each section full width with a back header. */
(function () {
  'use strict';

  var Shop = window.Shop;
  var Store = window.Store;
  var UI = window.UI;
  if (!Shop || !Store || !UI) return;

  /* userpanel/*.html are static previews of one section each (no sign-in, sample data) */
  var preview = document.documentElement.getAttribute('data-panel-preview');
  var user = preview ? Store.user() : Store.requireUser();
  if (!user) return;

  // Section link: a hash in the real panel, a separate file in the preview folder
  function sectionHref(name) {
    if (!preview) return '#' + name;
    return name === 'dashboard' || name === 'menu' ? 'index.html' : name + '.html';
  }
  // Previews show sample products when the visitor has none yet
  function recentList() {
    var list = Shop.recent();
    return preview && !list.length ? Shop.query({ limit: 8 }) : list;
  }

  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;
  var fa = UI.toPersianDigits;
  var icon = window.icon;
  var shopUrl = Shop.root + 'pages/shop.html';

  var SECTIONS = ['dashboard', 'orders', 'wishlist', 'comments', 'addresses', 'messages', 'recent', 'profile', 'wallet'];
  var TITLES = {
    dashboard: 'پیشخوان', orders: 'سفارش‌های من', wishlist: 'کالاهای مورد علاقه', comments: 'نظرات',
    addresses: 'نشانی‌ها', messages: 'پیام‌ها', recent: 'آخرین کالاهای دیده شده', profile: 'مشخصات فردی', wallet: 'کیف پول'
  };
  var STATUS = {
    processing: 'در حال پردازش', shipped: 'ارسال شده', delivered: 'تحویل شده',
    returned: 'مرجوعی', cancelled: 'لغو شده'
  };
  var GROUPS = {
    current: ['processing', 'shipped'], delivered: ['delivered'], returned: ['returned'], cancelled: ['cancelled']
  };
  var dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });
  var phoneMq = window.matchMedia('(max-width: 47.99rem)');

  var accountEl = document.querySelector('[data-account]');
  var railEl = document.querySelector('[data-recent-rail]');

  function formatDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : dateFmt.format(d);
  }

  function emptyHTML(art, title, text, action, href) {
    return '<div class="acc-empty">' +
      '<span class="acc-empty__art" aria-hidden="true">' + icon(art) + '</span>' +
      '<p class="acc-empty__title">' + title + '</p>' +
      (text ? '<p class="acc-empty__text">' + text + '</p>' : '') +
      (action ? '<a class="btn btn--outline btn--sm" href="' + href + '">' + action + '</a>' : '') +
    '</div>';
  }

  /* ---------- Sidebar header, wallet strip, message badge ---------- */
  function renderUser() {
    document.querySelector('[data-user-name]').textContent = user.name || 'کاربر فیبسو';
    document.querySelector('[data-user-mobile]').textContent = fa(user.mobile || '');
    document.querySelector('[data-wallet-total]').textContent = fmt(Store.wallet().total);
    var unread = Store.messages().filter(function (m) { return m.unread; }).length;
    var badge = document.querySelector('[data-message-count]');
    badge.textContent = fmt(unread);
    badge.hidden = !unread;
    badge.setAttribute('aria-label', fmt(unread) + ' پیام خوانده نشده');
  }

  /* ---------- Routing ---------- */
  var lastSection = null;

  function route(focus) {
    var name = preview || window.location.hash.slice(1);
    var phone = phoneMq.matches;
    if (preview === 'dashboard' && phone) name = 'menu';
    if (SECTIONS.indexOf(name) === -1) name = phone ? 'menu' : 'dashboard';
    accountEl.setAttribute('data-view', name === 'menu' ? 'menu' : 'section');

    SECTIONS.forEach(function (s) {
      document.getElementById('acc-' + s).hidden = s !== name;
    });
    document.querySelectorAll('[data-section-link]').forEach(function (link) {
      if (link.getAttribute('data-section-link') === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    railEl.hidden = !((name === 'dashboard' && !phone) || name === 'menu') || !recentList().length;

    if (name === 'menu') {
      document.title = 'حساب کاربری | فیبسو';
      if (focus) {
        var back = lastSection && document.querySelector('.account__nav [data-section-link="' + lastSection + '"]');
        (back || document.querySelector('.account__nav .account__link')).focus();
      }
      return;
    }

    RENDER[name]();
    lastSection = name;
    document.title = TITLES[name] + ' | حساب کاربری فیبسو';
    if (focus) {
      document.getElementById(name + '-title').focus({ preventScroll: true });
      var top = accountEl.getBoundingClientRect().top + window.scrollY - 96;
      if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
    }
  }

  window.addEventListener('hashchange', function () { route(true); });
  phoneMq.addEventListener('change', function () { route(false); });

  /* ---------- Orders ---------- */
  function orderHTML(o, compact) {
    var items = o.items || [];
    return '<article class="order-card">' +
      '<header class="order-card__head">' +
        '<dl class="order-card__meta">' +
          '<div><dt>شماره سفارش</dt><dd class="ltr">' + esc(o.id) + '</dd></div>' +
          '<div><dt>تاریخ ثبت</dt><dd><time datetime="' + esc(o.date) + '">' + formatDate(o.date) + '</time></dd></div>' +
          '<div><dt>مبلغ کل</dt><dd>' + fmt(o.total) + ' تومان</dd></div>' +
        '</dl>' +
        '<span class="status status--' + esc(o.status) + '">' + (STATUS[o.status] || STATUS.processing) + '</span>' +
      '</header>' +
      '<div class="order-card__thumbs">' + items.slice(0, 5).map(function (i) {
        var p = Shop.byId(i.id);
        return '<img src="' + (p ? Shop.imageUrl(p) : Shop.root + 'assets/images/products/' + esc(i.img) + '.svg') + '" alt="' + esc(i.title) + '" width="64" height="64" loading="lazy">';
      }).join('') + (items.length > 5 ? '<span class="order-card__more">+' + fmt(items.length - 5) + '</span>' : '') + '</div>' +
      (compact ? '' :
      '<details class="order-card__details"><summary>جزئیات سفارش ' + icon('caret-down') + '</summary><div class="order-card__detail">' +
        '<ul class="order-card__lines">' + items.map(function (i) {
          return '<li><span>' + esc(i.title) + ' × ' + fmt(i.qty) + '</span><strong>' + fmt(i.qty * i.price) + ' تومان</strong></li>';
        }).join('') +
        '<li><span>هزینه ارسال</span><strong>' + (o.shipping ? fmt(o.shipping) + ' تومان' : 'رایگان / پس‌کرایه') + '</strong></li></ul>' +
        (o.address ? '<dl class="order-card__info"><dt>تحویل‌گیرنده</dt><dd>' + esc(o.address.name) + '، ' + fa(esc(o.address.mobile)) + '</dd>' +
          '<dt>نشانی</dt><dd>' + esc(Store.addressText(o.address)) + '</dd>' +
          (o.shippingMethod ? '<dt>روش ارسال</dt><dd>' + esc(o.shippingMethod) + '</dd>' : '') +
          (o.payment ? '<dt>روش پرداخت</dt><dd>' + esc(o.payment) + ' (نسخه نمایشی؛ پرداختی انجام نشده)</dd>' : '') + '</dl>' : '') +
      '</div></details>') +
    '</article>';
  }

  var orderGroup = 'current';
  var orderQuery = '';
  var orderTabs = Array.prototype.slice.call(document.querySelectorAll('[data-order-tabs] [role="tab"]'));
  var orderPanel = document.getElementById('order-panel');

  function inGroup(o, g) {
    return GROUPS[g].indexOf(STATUS[o.status] ? o.status : 'processing') !== -1;
  }

  function renderOrders() {
    var all = Store.orders();
    Object.keys(GROUPS).forEach(function (g) {
      document.querySelector('[data-order-count="' + g + '"]').textContent = '(' + fmt(all.filter(function (o) { return inGroup(o, g); }).length) + ')';
    });
    var q = Store.latin(orderQuery).toLowerCase();
    var list = all.filter(function (o) {
      if (!inGroup(o, orderGroup)) return false;
      if (!q) return true;
      return String(o.id).toLowerCase().indexOf(q) !== -1 ||
        (o.items || []).some(function (i) { return String(i.title).toLowerCase().indexOf(q) !== -1; });
    });
    document.querySelector('[data-orders]').innerHTML = list.length ? list.map(function (o) { return orderHTML(o); }).join('')
      : '<div class="acc-empty acc-empty--muted">' +
          '<span class="acc-empty__art acc-empty__art--orders" aria-hidden="true">' + icon('package') + '<span class="acc-empty__badge">' + icon('clock') + '</span></span>' +
          '<p class="acc-empty__title">' + (q ? 'سفارشی با این عبارت پیدا نشد' : 'سفارش فعالی در این بخش وجود ندارد') + '</p>' +
          (all.length || q ? '' : '<a class="btn btn--outline btn--sm" href="' + shopUrl + '">رفتن به فروشگاه</a>') +
        '</div>';
  }

  function selectOrderTab(tab, focus) {
    orderTabs.forEach(function (t) {
      t.setAttribute('aria-selected', String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    orderGroup = tab.getAttribute('data-group');
    orderPanel.setAttribute('aria-labelledby', tab.id);
    renderOrders();
    if (focus) tab.focus();
  }
  orderTabs.forEach(function (t) { t.addEventListener('click', function () { selectOrderTab(t); }); });
  tabKeys(document.querySelector('[data-order-tabs]'), orderTabs, selectOrderTab);

  document.querySelector('[data-order-search]').addEventListener('input', function (e) {
    orderQuery = e.target.value.trim();
    renderOrders();
  });

  /* Arrow keys move between tabs (RTL: left = next) */
  function tabKeys(list, tabs, select) {
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      var map = { ArrowLeft: 1, ArrowRight: -1 };
      if (i === -1) return;
      if (e.key in map) {
        e.preventDefault();
        select(tabs[(i + map[e.key] + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
      }
    });
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var rows = [
      ['نام و نام خانوادگی', user.name],
      ['پست الکترونیکی', user.email],
      ['شماره موبایل', fa(user.mobile || '')],
      ['کد ملی', user.nationalCode ? fa(user.nationalCode) : ''],
      ['دریافت خبرنامه', user.newsletter ? 'بله' : 'خیر'],
      ['نام شرکت', user.company]
    ];
    document.querySelector('[data-dashboard-profile]').innerHTML =
      '<div class="dash-profile">' +
        '<span class="dash-profile__avatar" aria-hidden="true">' + icon('user') + '</span>' +
        '<div class="dash-profile__box">' +
          '<dl class="dash-profile__grid">' + rows.map(function (r) {
            return '<div><dt>' + r[0] + '</dt><dd>' + (r[1] ? esc(r[1]) : '<span class="text-muted">ثبت نشده</span>') + '</dd></div>';
          }).join('') + '</dl>' +
          '<a class="btn btn--primary btn--sm dash-profile__edit" href="' + sectionHref('profile') + '">' + icon('pencil') + ' ویرایش اطلاعات</a>' +
        '</div>' +
      '</div>';

    var orders = Store.orders();
    document.querySelector('[data-dashboard-orders]').innerHTML = orders.length
      ? '<div class="order-list">' + orders.slice(0, 2).map(function (o) { return orderHTML(o, true); }).join('') + '</div>'
      : '<p class="dash-none">هنوز سفارشی ثبت نکرده‌اید. <a href="' + shopUrl + '">مشاهده لپ‌تاپ‌ها و تجهیزات شبکه</a></p>';
  }

  /* ---------- Recently viewed rail (dashboard / phone menu) ---------- */
  function renderRail() {
    var list = recentList();
    Shop.render(document.querySelector('[data-recent-track]'), list.slice(0, 12), 'li');
    UI.initScrollers(railEl);
  }

  /* ---------- Wishlist / recent grids ---------- */
  function renderWishlist() {
    var ids = Shop.wishlist();
    var list = Shop.products.filter(function (p) { return ids.indexOf(p.id) !== -1; });
    Shop.render(document.querySelector('[data-wishlist]'), list, 'li',
      '<li class="acc-grid__empty">' + emptyHTML('heart', 'فهرست علاقه‌مندی‌های شما خالی است',
        'با زدن دکمه قلب روی هر کالا، آن را برای مقایسه و خرید بعدی اینجا نگه دارید.', 'مشاهده محصولات', shopUrl) + '</li>');
  }

  function renderRecent() {
    Shop.render(document.querySelector('[data-recent]'), recentList(), 'li',
      '<li class="acc-grid__empty">' + emptyHTML('eye', 'هنوز کالایی را مشاهده نکرده‌اید',
        'کالاهایی که باز می‌کنید اینجا می‌مانند تا دوباره پیدا کردنشان آسان باشد.', 'رفتن به فروشگاه', shopUrl) + '</li>');
  }

  Shop.onChange(function () {
    if (!document.getElementById('acc-wishlist').hidden) renderWishlist();
  });

  /* ---------- Comments (static empty state in the template) ---------- */
  function renderComments() {}

  /* ---------- Messages ---------- */
  function renderMessages() {
    var list = Store.messages();
    document.querySelector('[data-messages]').innerHTML = list.map(function (m) {
      return '<li class="msg' + (m.unread ? ' msg--unread' : '') + '">' +
        '<span class="msg__icon" aria-hidden="true">' + icon(m.kind === 'order' ? 'package' : 'envelope-open') + '</span>' +
        '<div class="msg__body">' +
          '<p class="msg__title">' + (m.unread ? '<span class="visually-hidden">خوانده نشده: </span>' : '') + esc(m.title) + '</p>' +
          '<p class="msg__text">' + esc(m.text) + '</p>' +
          (m.kind === 'order' ? '<a class="msg__link" href="' + sectionHref('orders') + '">مشاهده سفارش ' + icon('caret-left') + '</a>' : '') +
        '</div>' +
        '<time class="msg__date" datetime="' + esc(m.date) + '">' + formatDate(m.date) + '</time>' +
      '</li>';
    }).join('');
    Store.markMessagesSeen();
    renderUser();
  }

  /* ---------- Addresses ---------- */
  var addrDialog = document.querySelector('[data-address-dialog]');
  var addrForm = document.querySelector('[data-address-form]');
  var editingId = null;
  var opener = null;

  function renderAddresses() {
    var list = Store.addresses();
    document.querySelector('[data-addresses]').innerHTML = list.length ? list.map(function (a) {
      return '<li class="address-card' + (a.isDefault ? ' address-card--default' : '') + '">' +
        '<div class="address-card__head">' + icon('map-pin') + '<p class="address-card__text">' + esc(Store.addressText(a)) + '</p>' +
          (a.isDefault ? '<span class="badge">نشانی پیش‌فرض</span>' : '') + '</div>' +
        '<ul class="address-card__meta">' +
          '<li>' + icon('user') + esc(a.name) + '</li>' +
          '<li>' + icon('phone') + fa(esc(a.mobile)) + '</li>' +
          '<li>' + icon('envelope') + 'کد پستی ' + fa(esc(a.postal)) + '</li>' +
        '</ul>' +
        '<div class="address-card__actions">' +
          '<button class="btn btn--outline btn--sm" type="button" data-address-edit="' + esc(a.id) + '">' + icon('pencil') + ' ویرایش</button>' +
          (a.isDefault ? '' : '<button class="btn btn--outline btn--sm" type="button" data-address-default="' + esc(a.id) + '">انتخاب به‌عنوان پیش‌فرض</button>') +
          '<button class="btn btn--sm btn--danger-text" type="button" data-address-delete="' + esc(a.id) + '">' + icon('trash') + ' <span>حذف</span></button>' +
        '</div></li>';
    }).join('') : '<li>' + emptyHTML('map-pin', 'هنوز نشانی‌ای ذخیره نکرده‌اید', 'نشانی‌های ذخیره‌شده هنگام ثبت سفارش برای انتخاب سریع نمایش داده می‌شوند.') + '</li>';
  }

  function openAddressDialog(address) {
    opener = document.activeElement;
    editingId = address ? address.id : null;
    document.getElementById('address-dialog-title').textContent = address ? 'ویرایش نشانی' : 'نشانی جدید';
    document.querySelector('[data-address-fields]').innerHTML = Store.addressFields('dlg-', address || { name: user.name, mobile: user.mobile }) +
      '<label class="check"><input type="checkbox" name="isDefault"' + (address && address.isDefault ? ' checked' : '') + '> نشانی پیش‌فرض باشد</label>';
    addrDialog.showModal();
    document.getElementById('dlg-name').focus();
  }

  [addrDialog, document.querySelector('[data-field-dialog]')].forEach(function (d) {
    d.addEventListener('close', function () {
      if (opener && document.body.contains(opener)) opener.focus();
    });
    d.querySelectorAll('[data-dialog-close]').forEach(function (b) {
      b.addEventListener('click', function () { d.close(); });
    });
  });

  addrForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = Store.validateForm(addrForm);
    if (!data) return;
    var current = Store.addresses().filter(function (a) { return a.id === editingId; })[0];
    Store.saveAddress({
      id: editingId || undefined,
      name: data.name, mobile: data.mobile, province: data.province, city: data.city,
      street: data.street, postal: data.postal, plaque: addrForm.elements.plaque.value.trim(),
      isDefault: addrForm.elements.isDefault.checked || (current && current.isDefault)
    });
    var wasEditing = editingId;
    addrDialog.close();
    renderAddresses();
    Shop.toast(wasEditing ? 'نشانی ویرایش شد' : 'نشانی جدید ذخیره شد');
  });

  document.querySelector('[data-address-add]').addEventListener('click', function () { openAddressDialog(null); });
  document.querySelector('[data-addresses]').addEventListener('click', function (e) {
    var edit = e.target.closest('[data-address-edit]');
    var del = e.target.closest('[data-address-delete]');
    var def = e.target.closest('[data-address-default]');
    var find = function (id) { return Store.addresses().filter(function (a) { return a.id === id; })[0]; };
    if (edit) openAddressDialog(find(edit.getAttribute('data-address-edit')));
    // Two-step inline delete instead of window.confirm()
    if (del && del.getAttribute('data-confirm') !== 'true') {
      del.setAttribute('data-confirm', 'true');
      del.querySelector('span').textContent = 'حذف شود؟ دوباره بزنید';
      window.setTimeout(function () {
        if (document.body.contains(del)) { del.removeAttribute('data-confirm'); del.querySelector('span').textContent = 'حذف'; }
      }, 4000);
    } else if (del) {
      Store.deleteAddress(del.getAttribute('data-address-delete'));
      renderAddresses();
      Shop.toast('نشانی حذف شد');
      document.querySelector('[data-address-add]').focus();
    }
    if (def) {
      var a = find(def.getAttribute('data-address-default'));
      a.isDefault = true;
      Store.saveAddress(a);
      renderAddresses();
      Shop.toast('نشانی پیش‌فرض تغییر کرد');
    }
  });

  /* ---------- Personal / legal info ---------- */
  var PROFILE = {
    person: {
      note: 'این اطلاعات برای صدور فاکتور و پیگیری سفارش‌ها استفاده می‌شود.',
      fields: [
        { key: 'name', label: 'نام و نام خانوادگی', rules: 'required', autocomplete: 'name' },
        { key: 'email', label: 'پست الکترونیکی', rules: 'email', type: 'email', autocomplete: 'email', dir: 'ltr' },
        { key: 'mobile', label: 'شماره موبایل', locked: 'شماره موبایل شناسه ورود شماست و قابل تغییر نیست.', number: true },
        { key: 'nationalCode', label: 'کد ملی', rules: 'national', inputmode: 'numeric', dir: 'ltr', number: true, hint: '۱۰ رقم' },
        { key: 'birthDate', label: 'تاریخ تولد', rules: 'date', inputmode: 'numeric', dir: 'ltr', number: true, hint: 'مثلاً ۱۳۷۰/۰۵/۲۱' },
        { key: 'job', label: 'شغل', autocomplete: 'organization-title' },
        { key: 'newsletter', label: 'دریافت خبرنامه', bool: 'خبرنامه پیشنهادهای ویژه لپ‌تاپ و تجهیزات شبکه را دریافت می‌کنم.' }
      ]
    },
    legal: {
      note: 'برای خرید سازمانی و دریافت فاکتور رسمی، مشخصات شرکت را تکمیل کنید.',
      fields: [
        { key: 'company', label: 'نام شرکت یا سازمان', autocomplete: 'organization' },
        { key: 'economicCode', label: 'کد اقتصادی', rules: 'digits', inputmode: 'numeric', dir: 'ltr', number: true },
        { key: 'companyNationalId', label: 'شناسه ملی', rules: 'nationalId', inputmode: 'numeric', dir: 'ltr', number: true, hint: '۱۱ رقم' },
        { key: 'registrationNumber', label: 'شماره ثبت', rules: 'digits', inputmode: 'numeric', dir: 'ltr', number: true },
        { key: 'companyPhone', label: 'تلفن ثابت', rules: 'phone', inputmode: 'tel', dir: 'ltr', number: true, hint: 'با کد شهر' }
      ]
    }
  };
  var profileKind = 'person';
  var profileTabs = Array.prototype.slice.call(document.querySelectorAll('[data-profile-tabs] [role="tab"]'));
  var fieldDialog = document.querySelector('[data-field-dialog]');
  var fieldForm = document.querySelector('[data-field-form]');
  var editingField = null;

  function findField(key) {
    return PROFILE.person.fields.concat(PROFILE.legal.fields).filter(function (f) { return f.key === key; })[0];
  }

  function displayValue(f) {
    var v = user[f.key];
    if (f.bool) return v ? 'بله' : 'خیر';
    if (!v) return '';
    return f.number ? fa(v) : v;
  }

  function renderProfile() {
    var conf = PROFILE[profileKind];
    document.querySelector('[data-profile-note]').textContent = conf.note;
    document.querySelector('[data-profile-fields]').innerHTML = conf.fields.map(function (f) {
      var v = displayValue(f);
      return '<div class="info-item">' +
        '<div class="info-item__text"><dt>' + f.label + '</dt>' +
          '<dd>' + (v ? esc(v) : '<span class="info-item__empty">ثبت نشده</span>') + '</dd></div>' +
        (f.locked
          ? '<span class="info-item__lock" title="' + f.locked + '">' + icon('shield-check') + '<span class="visually-hidden">' + f.locked + '</span></span>'
          : '<button class="info-item__edit" type="button" data-edit-field="' + f.key + '" aria-label="ویرایش ' + f.label + '">' + icon('pencil') + '</button>') +
      '</div>';
    }).join('');
  }

  function selectProfileTab(tab, focus) {
    profileTabs.forEach(function (t) {
      t.setAttribute('aria-selected', String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    profileKind = tab.getAttribute('data-kind');
    document.getElementById('profile-panel').setAttribute('aria-labelledby', tab.id);
    renderProfile();
    if (focus) tab.focus();
  }
  profileTabs.forEach(function (t) { t.addEventListener('click', function () { selectProfileTab(t); }); });
  tabKeys(document.querySelector('[data-profile-tabs]'), profileTabs, selectProfileTab);

  document.querySelector('[data-profile-fields]').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-edit-field]');
    if (!btn) return;
    var f = findField(btn.getAttribute('data-edit-field'));
    opener = btn;
    editingField = f;
    document.getElementById('field-dialog-title').textContent = 'ویرایش ' + f.label;
    document.querySelector('[data-field-body]').innerHTML = f.bool
      ? '<label class="check"><input type="checkbox" id="fd-input" name="value"' + (user[f.key] ? ' checked' : '') + '> ' + f.bool + '</label>'
      : Store.field('fd-input', 'value', f.label, {
        rules: f.rules, type: f.type, autocomplete: f.autocomplete, inputmode: f.inputmode, dir: f.dir,
        hint: f.hint, value: f.number && user[f.key] ? fa(user[f.key]) : user[f.key]
      });
    fieldDialog.showModal();
    var input = document.getElementById('fd-input');
    input.focus();
    if (input.select && input.type !== 'checkbox') input.select();
  });

  fieldForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = editingField;
    if (!f) return;
    var input = fieldForm.elements.value;
    var value;
    if (f.bool) {
      value = input.checked;
    } else {
      var data = Store.validateForm(fieldForm);
      if (!data) return;
      value = input.value.trim();
      if (f.number) value = Store.latin(value).replace(/[\s-]/g, '');
    }
    var patch = {};
    patch[f.key] = value;
    user = Store.updateUser(patch);
    Store.write('fibeso-known-' + user.mobile, user);
    fieldDialog.close();
    renderUser();
    renderProfile();
    var again = document.querySelector('[data-edit-field="' + f.key + '"]');
    if (again) { opener = null; again.focus(); }
    Shop.toast(f.label + ' ذخیره شد');
  });

  /* ---------- Wallet ---------- */
  function renderWallet() {
    var w = Store.wallet();
    var toman = function (n) { return '<span class="balance__value">' + fmt(n) + ' <small>تومان</small></span>'; };
    document.querySelector('[data-wallet]').innerHTML =
      '<section class="wallet__block" aria-labelledby="w-split">' +
        '<h3 class="wallet__title" id="w-split">' + icon('stack') + ' تفکیک موجودی‌ها</h3>' +
        '<ul class="balances">' +
          '<li class="balance"><span class="balance__label">موجودی نقدی</span>' + toman(w.cash) + '</li>' +
          '<li class="balance"><span class="balance__label">موجودی هدیه</span>' + toman(w.gift) + '</li>' +
          '<li class="balance balance--total"><span class="balance__label">موجودی کل</span>' + toman(w.total) + '</li>' +
        '</ul>' +
      '</section>' +
      '<section class="wallet__block" aria-labelledby="w-detail">' +
        '<h3 class="wallet__title" id="w-detail">' + icon('wallet') + ' جزئیات کیف پول</h3>' +
        '<dl class="wallet__details">' +
          '<div><dt>موجودی قابل برداشت</dt><dd>' + fmt(w.cash) + ' تومان</dd></div>' +
          '<div><dt>قابل خرید با کیف پول</dt><dd>' + fmt(w.total) + ' تومان</dd></div>' +
          '<div><dt>قابل خرید با کارت هدیه</dt><dd>' + fmt(w.gift) + ' تومان</dd></div>' +
        '</dl>' +
      '</section>' +
      '<section class="wallet__block" aria-labelledby="w-tx">' +
        '<h3 class="wallet__title" id="w-tx">' + icon('clock') + ' تراکنش‌های اخیر</h3>' +
        '<div class="tx-wrap"><table class="tx">' +
          '<thead><tr><th scope="col">نوع تراکنش</th><th scope="col">مبلغ</th><th scope="col">کد سفارش</th><th scope="col">تاریخ تراکنش</th></tr></thead>' +
          '<tbody>' + (w.transactions.length ? w.transactions.map(function (t) {
            return '<tr><td>' + esc(t.type) + '</td><td>' + fmt(t.amount) + ' تومان</td><td class="ltr">' + esc(t.order || '') + '</td><td>' + formatDate(t.date) + '</td></tr>';
          }).join('') : '<tr><td class="tx__empty" colspan="4">تراکنشی برای نمایش وجود ندارد</td></tr>') + '</tbody>' +
        '</table></div>' +
      '</section>' +
      '<div class="alert">' + icon('info') + '<span>افزایش موجودی و برداشت از کیف پول پس از راه‌اندازی درگاه پرداخت فیبسو فعال می‌شود.</span></div>';
  }

  /* ---------- Logout ---------- */
  document.querySelectorAll('[data-logout]').forEach(function (b) {
    b.addEventListener('click', function () {
      Store.logout();
      window.location.href = preview ? 'index.html' : Shop.root + 'index.html';
    });
  });

  var RENDER = {
    dashboard: renderDashboard,
    orders: renderOrders,
    wishlist: renderWishlist,
    comments: renderComments,
    addresses: renderAddresses,
    messages: renderMessages,
    recent: renderRecent,
    profile: renderProfile,
    wallet: renderWallet
  };

  renderUser();
  renderRail();
  route(false);
})();
