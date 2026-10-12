/* User panel: hash-routed sections (dashboard, orders, wishlist, addresses, profile). */
(function () {
  'use strict';

  var Shop = window.Shop;
  var Store = window.Store;
  var UI = window.UI;
  if (!Shop || !Store || !UI) return;

  var user = Store.requireUser();
  if (!user) return;

  var fmt = Shop.formatPrice;
  var esc = Shop.escapeHtml;
  var SECTIONS = ['dashboard', 'orders', 'wishlist', 'addresses', 'profile'];
  var STATUS = { processing: 'در حال پردازش', shipped: 'ارسال‌شده', delivered: 'تحویل‌شده' };
  var dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' });

  /* ---------- Header card ---------- */
  function renderUser() {
    document.querySelector('[data-user-name]').textContent = user.name || 'کاربر فیبسو';
    document.querySelector('[data-user-mobile]').textContent = user.mobile;
    document.querySelector('[data-user-initial]').textContent = (user.name || 'ف').trim().charAt(0);
  }

  /* ---------- Routing ---------- */
  function show(name, focus) {
    if (SECTIONS.indexOf(name) === -1) name = 'dashboard';
    SECTIONS.forEach(function (s) {
      document.getElementById(s).hidden = s !== name;
      var link = document.querySelector('[data-section-link="' + s + '"]');
      if (s === name) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    RENDER[name]();
    document.title = document.getElementById(name + '-title').textContent + ' | پنل کاربری فیبسو';
    if (focus) document.getElementById(name + '-title').focus();
  }

  window.addEventListener('hashchange', function () {
    show(window.location.hash.slice(1), true);
  });

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var orders = Store.orders();
    var open = orders.filter(function (o) { return o.status !== 'delivered'; }).length;
    var el = document.querySelector('[data-dashboard]');
    el.innerHTML =
      '<p class="text-muted dash-intro">' + esc(user.name || '') + ' عزیز، به پنل کاربری فیبسو خوش آمدید.</p>' +
      '<div class="kpis">' +
        kpi('#orders', orders.length, 'همه سفارش‌ها') +
        kpi('#orders', open, 'سفارش‌های جاری') +
        kpi('#wishlist', Shop.wishlist().length, 'علاقه‌مندی‌ها') +
        kpi('#addresses', Store.addresses().length, 'آدرس‌های ذخیره‌شده') +
      '</div>' +
      '<section class="panel"><div class="panel__head"><h2 class="panel__title">آخرین سفارش‌ها</h2>' +
        (orders.length ? '<a class="view-all" href="#orders">مشاهده همه</a>' : '') + '</div>' +
        (orders.length ? '<div class="order-list order-list--flush">' + orders.slice(0, 2).map(orderHTML).join('') + '</div>'
          : emptyHTML('هنوز سفارشی ثبت نکرده‌اید.', 'شروع خرید', Shop.root + 'pages/shop.html')) +
      '</section>';
  }

  function kpi(href, value, label) {
    return '<a class="kpi" href="' + href + '"><span class="kpi__value">' + fmt(value) + '</span><span class="kpi__label">' + label + '</span></a>';
  }

  function emptyHTML(text, action, href) {
    return '<div class="empty-state">' + Shop.icon.bag + '<p>' + text + '</p>' +
      (action ? '<a class="btn btn--outline" href="' + href + '">' + action + '</a>' : '') + '</div>';
  }

  /* ---------- Orders ---------- */
  var orderFilter = '';

  function orderHTML(o) {
    return '<article class="order">' +
      '<header class="order__head"><span class="order__id">سفارش <span class="ltr">' + esc(o.id) + '</span></span>' +
        '<time datetime="' + o.date + '">' + dateFmt.format(new Date(o.date)) + '</time>' +
        '<span class="status status--' + o.status + '">' + STATUS[o.status] + '</span></header>' +
      '<div class="order__body"><div class="order__thumbs">' + o.items.slice(0, 4).map(function (i) {
          return '<img src="' + (Shop.byId(i.id) ? Shop.imageUrl(Shop.byId(i.id)) : Shop.root + 'assets/images/products/' + i.img + '.svg') + '" alt="' + esc(i.title) + '" width="56" height="56">';
        }).join('') + '</div>' +
        '<span>مبلغ کل: <span class="order__total">' + fmt(o.total) + ' تومان</span></span></div>' +
      '<details><summary>جزئیات سفارش</summary><div class="order__detail">' +
        '<ul class="order__lines">' + o.items.map(function (i) {
          return '<li><span>' + esc(i.title) + ' × ' + fmt(i.qty) + '</span><strong>' + fmt(i.qty * i.price) + '</strong></li>';
        }).join('') +
        '<li><span>هزینه ارسال</span><strong>' + (o.shipping ? fmt(o.shipping) : 'رایگان / پس‌کرایه') + '</strong></li></ul>' +
        '<dl class="order__info"><dt>تحویل‌گیرنده</dt><dd>' + esc(o.address.name) + '، <span class="ltr">' + esc(o.address.mobile) + '</span></dd>' +
          '<dt>آدرس</dt><dd>' + esc(Store.addressText(o.address)) + '</dd>' +
          '<dt>روش ارسال</dt><dd>' + esc(o.shippingMethod) + '</dd>' +
          '<dt>روش پرداخت</dt><dd>' + esc(o.payment) + ' (نسخه نمایشی؛ پرداختی انجام نشده)</dd></dl>' +
      '</div></details></article>';
  }

  function renderOrders() {
    var list = Store.orders().filter(function (o) { return !orderFilter || o.status === orderFilter; });
    document.querySelector('[data-orders]').innerHTML = list.length ? list.map(orderHTML).join('')
      : emptyHTML(orderFilter ? 'سفارشی با این وضعیت ندارید.' : 'هنوز سفارشی ثبت نکرده‌اید.', 'رفتن به فروشگاه', Shop.root + 'pages/shop.html');
  }

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-order-tabs] [role="tab"]'));
  function selectOrderTab(tab, focus) {
    tabs.forEach(function (t) {
      t.setAttribute('aria-selected', String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    orderFilter = tab.getAttribute('data-status');
    renderOrders();
    if (focus) tab.focus();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { selectOrderTab(t); }); });
  document.querySelector('[data-order-tabs]').addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement);
    var map = { ArrowLeft: 1, ArrowRight: -1 };
    if (e.key in map) {
      e.preventDefault();
      selectOrderTab(tabs[(i + map[e.key] + tabs.length) % tabs.length], true);
    }
  });

  /* ---------- Wishlist ---------- */
  function renderWishlist() {
    var ids = Shop.wishlist();
    var list = Shop.products.filter(function (p) { return ids.indexOf(p.id) !== -1; });
    Shop.render(document.querySelector('[data-wishlist]'), list, 'li',
      '<li>' + emptyHTML('فهرست علاقه‌مندی‌های شما خالی است. با دکمه قلب روی هر کالا آن را اضافه کنید.', 'مشاهده محصولات', Shop.root + 'pages/shop.html') + '</li>');
  }
  Shop.onChange(function () {
    if (!document.getElementById('wishlist').hidden) renderWishlist();
  });

  /* ---------- Addresses ---------- */
  var dialog = document.querySelector('[data-address-dialog]');
  var addrForm = document.querySelector('[data-address-form]');
  var editingId = null;
  var opener = null;

  function renderAddresses() {
    var list = Store.addresses();
    document.querySelector('[data-addresses]').innerHTML = list.length ? list.map(function (a) {
      return '<li class="address-item' + (a.isDefault ? ' address-item--default' : '') + '">' +
        '<div class="address-item__head"><span>' + esc(a.name) + '</span>' + (a.isDefault ? '<span class="badge">آدرس پیش‌فرض</span>' : '') + '</div>' +
        '<p>' + esc(Store.addressText(a)) + '</p>' +
        '<p class="text-muted">موبایل: <span class="ltr">' + esc(a.mobile) + '</span> · کد پستی: <span class="ltr">' + esc(a.postal) + '</span></p>' +
        '<div class="address-item__actions">' +
          '<button class="btn btn--outline btn--sm" type="button" data-address-edit="' + a.id + '">ویرایش</button>' +
          (a.isDefault ? '' : '<button class="btn btn--outline btn--sm" type="button" data-address-default="' + a.id + '">انتخاب به‌عنوان پیش‌فرض</button>') +
          '<button class="btn btn--sm btn--danger-text" type="button" data-address-delete="' + a.id + '">حذف</button>' +
        '</div></li>';
    }).join('') : '<li>' + emptyHTML('هنوز آدرسی ذخیره نکرده‌اید.') + '</li>';
  }

  function openAddressDialog(address) {
    opener = document.activeElement;
    editingId = address ? address.id : null;
    document.getElementById('address-dialog-title').textContent = address ? 'ویرایش آدرس' : 'آدرس جدید';
    document.querySelector('[data-address-fields]').innerHTML = Store.addressFields('dlg-', address || { name: user.name, mobile: user.mobile }) +
      '<label class="check"><input type="checkbox" name="isDefault"' + (address && address.isDefault ? ' checked' : '') + '> آدرس پیش‌فرض باشد</label>';
    dialog.showModal();
    document.getElementById('dlg-name').focus();
  }

  function closeDialog() {
    dialog.close();
  }
  dialog.addEventListener('close', function () { if (opener) opener.focus(); });
  dialog.querySelectorAll('[data-dialog-close]').forEach(function (b) { b.addEventListener('click', closeDialog); });

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
    closeDialog();
    renderAddresses();
    Shop.toast(editingId ? 'آدرس ویرایش شد' : 'آدرس جدید ذخیره شد');
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
      del.textContent = 'حذف شود؟ دوباره بزنید';
      window.setTimeout(function () {
        if (document.body.contains(del)) { del.removeAttribute('data-confirm'); del.textContent = 'حذف'; }
      }, 4000);
    } else if (del) {
      Store.deleteAddress(del.getAttribute('data-address-delete'));
      renderAddresses();
      Shop.toast('آدرس حذف شد');
      document.querySelector('[data-address-add]').focus();
    }
    if (def) {
      var a = find(def.getAttribute('data-address-default'));
      a.isDefault = true;
      Store.saveAddress(a);
      renderAddresses();
      Shop.toast('آدرس پیش‌فرض تغییر کرد');
    }
  });

  /* ---------- Profile ---------- */
  function renderProfile() {
    var form = document.querySelector('[data-profile-form]');
    form.innerHTML = '<div class="form-grid form-grid--2">' +
      Store.field('pf-name', 'name', 'نام و نام خانوادگی', { rules: 'required', autocomplete: 'name', value: user.name }) +
      '<div class="field"><label class="field__label" for="pf-mobile">شماره موبایل</label>' +
        '<input class="input" id="pf-mobile" value="' + esc(user.mobile) + '" dir="ltr" readonly aria-describedby="pf-mobile-hint">' +
        '<p class="field__hint" id="pf-mobile-hint">شماره موبایل شناسه ورود شماست و از اینجا قابل تغییر نیست.</p></div>' +
      Store.field('pf-email', 'email', 'ایمیل', { rules: 'email', type: 'email', autocomplete: 'email', dir: 'ltr', value: user.email }) +
      Store.field('pf-company', 'company', 'نام شرکت (برای خرید سازمانی)', { autocomplete: 'organization', value: user.company }) +
      '</div><div class="form-actions"><button class="btn btn--primary" type="submit">ذخیره تغییرات</button></div>' +
      '<p class="form-status" role="status" data-form-status></p>';
  }

  document.querySelector('[data-profile-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var data = Store.validateForm(form);
    if (!data) return;
    user = Store.updateUser({ name: data.name, email: data.email, company: form.elements.company.value.trim() });
    Store.write('fibeso-known-' + user.mobile, user);
    renderUser();
    var status = form.querySelector('[data-form-status]');
    status.className = 'form-status form-status--success';
    status.textContent = 'اطلاعات حساب ذخیره شد (در همین مرورگر).';
  });

  /* ---------- Logout ---------- */
  document.querySelector('[data-logout]').addEventListener('click', function () {
    Store.logout();
    window.location.href = Shop.root + 'index.html';
  });

  var RENDER = {
    dashboard: renderDashboard,
    orders: renderOrders,
    wishlist: renderWishlist,
    addresses: renderAddresses,
    profile: renderProfile
  };

  renderUser();
  show(window.location.hash.slice(1), false);
})();
