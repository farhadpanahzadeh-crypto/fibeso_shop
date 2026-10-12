/* Front-end persistence for the prototype: account, addresses and orders live in
   localStorage. There is no backend yet — nothing here is sent anywhere. */
(function () {
  'use strict';

  var KEYS = { user: 'fibeso-user', addresses: 'fibeso-addresses', orders: 'fibeso-orders' };

  function read(key, fallback) {
    try {
      var v = JSON.parse(window.localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  var root = document.documentElement.getAttribute('data-root') || '';

  /* ---------- Shared validation ---------- */
  function latin(v) {
    return String(v || '')
      .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); })
      .trim();
  }

  var RULES = {
    required: function (v, label) { return v ? '' : label + ' را وارد کنید.'; },
    mobile: function (v) { return /^(?:\+98|0098|0)?9\d{9}$/.test(latin(v).replace(/[\s-]/g, '')) ? '' : 'شماره موبایل معتبر نیست؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.'; },
    postal: function (v) { return /^\d{10}$/.test(latin(v).replace(/[\s-]/g, '')) ? '' : 'کد پستی باید ۱۰ رقم باشد.'; },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'ایمیل معتبر نیست.'; },
    min10: function (v) { return v.length >= 10 ? '' : 'حداقل ۱۰ حرف بنویسید.'; }
  };

  /* Validate inputs carrying data-rules="required mobile" and data-label="...".
     Shows each error next to its field (aria-describedby) and focuses the first. */
  function validateForm(form) {
    var first = null;
    var data = {};
    form.querySelectorAll('[data-rules]').forEach(function (input) {
      var value = input.type === 'checkbox' ? (input.checked ? 'yes' : '') : input.value.trim();
      var label = input.getAttribute('data-label') || '';
      var message = '';
      input.getAttribute('data-rules').split(' ').some(function (rule) {
        if (!RULES[rule] || (rule !== 'required' && !value)) return false;
        message = RULES[rule](value, label);
        return !!message;
      });
      var errorEl = document.getElementById(input.getAttribute('aria-describedby'));
      if (errorEl) errorEl.textContent = message;
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (message && !first) first = input;
      data[input.name] = input.type === 'checkbox' ? input.checked : value;
    });
    if (first) first.focus();
    return first ? null : data;
  }

  /* Re-validate a field as the user fixes it */
  document.addEventListener('input', function (e) {
    var input = e.target;
    if (input.getAttribute && input.getAttribute('aria-invalid') === 'true' && input.form) {
      var errorEl = document.getElementById(input.getAttribute('aria-describedby'));
      var rules = (input.getAttribute('data-rules') || '').split(' ');
      var value = input.value.trim();
      var message = '';
      rules.some(function (rule) {
        if (!RULES[rule] || (rule !== 'required' && !value)) return false;
        message = RULES[rule](value, input.getAttribute('data-label') || '');
        return !!message;
      });
      if (!message) {
        input.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.textContent = '';
      }
    }
  });

  function field(id, name, label, opts) {
    opts = opts || {};
    var req = opts.rules && opts.rules.indexOf('required') !== -1;
    var attrs = ' id="' + id + '" name="' + name + '" aria-describedby="' + id + '-error"' +
      (opts.rules ? ' data-rules="' + opts.rules + '" data-label="' + label + '"' : '') +
      (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') +
      (opts.inputmode ? ' inputmode="' + opts.inputmode + '"' : '') +
      (opts.dir ? ' dir="' + opts.dir + '"' : '') +
      (opts.type ? ' type="' + opts.type + '"' : '');
    var control;
    if (opts.options) {
      control = '<select class="input"' + attrs + '><option value="">انتخاب کنید</option>' +
        opts.options.map(function (o) { return '<option' + (o === opts.value ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
    } else if (opts.textarea) {
      control = '<textarea class="input"' + attrs + '>' + (opts.value || '') + '</textarea>';
    } else {
      control = '<input class="input"' + attrs + (opts.value ? ' value="' + String(opts.value).replace(/"/g, '&quot;') + '"' : '') + '>';
    }
    return '<div class="field' + (opts.full ? ' field--full' : '') + '">' +
      '<label class="field__label" for="' + id + '">' + label + (req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' +
      control + (opts.hint ? '<p class="field__hint">' + opts.hint + '</p>' : '') +
      '<p class="field__error" id="' + id + '-error"></p></div>';
  }

  var PROVINCES = ['تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'خوزستان', 'مازندران', 'گیلان', 'قم', 'کرمان', 'سایر استان‌ها'];

  function addressFields(prefix, a) {
    a = a || {};
    return '<div class="form-grid form-grid--2">' +
      field(prefix + 'name', 'name', 'نام و نام خانوادگی گیرنده', { rules: 'required', autocomplete: 'name', value: a.name }) +
      field(prefix + 'mobile', 'mobile', 'موبایل گیرنده', { rules: 'required mobile', autocomplete: 'tel', inputmode: 'tel', dir: 'ltr', value: a.mobile }) +
      field(prefix + 'province', 'province', 'استان', { rules: 'required', options: PROVINCES, value: a.province }) +
      field(prefix + 'city', 'city', 'شهر', { rules: 'required', autocomplete: 'address-level2', value: a.city }) +
      field(prefix + 'street', 'street', 'نشانی پستی', { rules: 'required', autocomplete: 'street-address', textarea: true, full: true, value: a.street }) +
      field(prefix + 'postal', 'postal', 'کد پستی', { rules: 'required postal', autocomplete: 'postal-code', inputmode: 'numeric', dir: 'ltr', value: a.postal, hint: '۱۰ رقم بدون خط تیره' }) +
      field(prefix + 'plaque', 'plaque', 'پلاک / واحد', { value: a.plaque }) +
    '</div>';
  }

  function addressText(a) {
    return a.province + '، ' + a.city + '، ' + a.street + (a.plaque ? '، پلاک ' + a.plaque : '');
  }

  window.Store = {
    root: root,
    read: read,
    write: write,
    latin: latin,
    validateForm: validateForm,
    field: field,
    addressFields: addressFields,
    addressText: addressText,

    /* ---- Account ---- */
    user: function () { return read(KEYS.user, null); },
    login: function (user) { write(KEYS.user, user); },
    updateUser: function (patch) {
      var u = read(KEYS.user, {});
      Object.keys(patch).forEach(function (k) { u[k] = patch[k]; });
      write(KEYS.user, u);
      return u;
    },
    logout: function () { remove(KEYS.user); },

    /* Send visitors who are not signed in to the login page, then back here. */
    requireUser: function () {
      var u = read(KEYS.user, null);
      if (!u) {
        var here = window.location.pathname.split('/').pop() + window.location.search + window.location.hash;
        window.location.replace(root + 'pages/login.html?next=' + encodeURIComponent(here));
      }
      return u;
    },

    /* ---- Addresses ---- */
    addresses: function () { return read(KEYS.addresses, []); },
    saveAddress: function (addr) {
      var list = read(KEYS.addresses, []);
      if (addr.id) {
        list = list.map(function (a) { return a.id === addr.id ? addr : a; });
      } else {
        addr.id = uid('a');
        list.push(addr);
      }
      if (addr.isDefault || list.length === 1) {
        list.forEach(function (a) { a.isDefault = a.id === addr.id; });
      }
      write(KEYS.addresses, list);
      return addr;
    },
    deleteAddress: function (id) {
      var list = read(KEYS.addresses, []).filter(function (a) { return a.id !== id; });
      if (list.length && !list.some(function (a) { return a.isDefault; })) list[0].isDefault = true;
      write(KEYS.addresses, list);
    },

    /* ---- Orders ---- */
    orders: function () { return read(KEYS.orders, []); },
    addOrder: function (order) {
      var list = read(KEYS.orders, []);
      order.id = 'FB-' + String(Date.now()).slice(-7);
      order.date = new Date().toISOString();
      order.status = 'processing';
      list.unshift(order);
      write(KEYS.orders, list);
      return order;
    }
  };
})();
