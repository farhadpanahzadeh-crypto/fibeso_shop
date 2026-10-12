/* Mobile + one-time-code sign in (demo: no SMS is sent, code is 12345). */
(function () {
  'use strict';

  var Store = window.Store;
  var UI = window.UI;
  if (!Store || !UI) return;

  var DEMO_CODE = '12345';
  var params = new URLSearchParams(window.location.search);
  var next = params.get('next') || 'account.html';
  // Only allow relative destinations inside /pages
  if (!/^[a-z-]+\.html([?#].*)?$/i.test(next)) next = 'account.html';

  var mobileForm = document.querySelector('[data-step="mobile"]');
  var codeForm = document.querySelector('[data-step="code"]');
  var timerEl = document.querySelector('[data-timer]');
  var resendBtn = document.querySelector('[data-resend]');
  var nameField = document.querySelector('[data-name-field]');
  var mobile = '';
  var timer = null;

  if (Store.user()) {
    window.location.replace(next);
    return;
  }

  function startTimer() {
    var left = 120;
    resendBtn.hidden = true;
    window.clearInterval(timer);
    function tick() {
      var m = Math.floor(left / 60);
      var s = String(left % 60).padStart(2, '0');
      timerEl.textContent = UI.toPersianDigits(m + ':' + s) + ' تا امکان ارسال دوباره';
      if (left-- <= 0) {
        window.clearInterval(timer);
        timerEl.textContent = '';
        resendBtn.hidden = false;
      }
    }
    tick();
    timer = window.setInterval(tick, 1000);
  }

  mobileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = Store.validateForm(mobileForm);
    if (!data) return;
    mobile = Store.latin(data.mobile).replace(/[\s-]/g, '').replace(/^(\+98|0098)/, '0');
    if (mobile[0] !== '0') mobile = '0' + mobile;
    document.querySelector('[data-show-mobile]').textContent = mobile;
    // A first-time visitor (no profile saved on this device) also gives a name
    var known = Store.read('fibeso-known-' + mobile, null);
    nameField.hidden = !!known;
    mobileForm.hidden = true;
    codeForm.hidden = false;
    codeForm.querySelector('.auth__title').focus();
    startTimer();
  });

  document.querySelector('[data-edit-mobile]').addEventListener('click', function () {
    codeForm.hidden = true;
    mobileForm.hidden = false;
    window.clearInterval(timer);
    document.getElementById('login-mobile').focus();
  });

  resendBtn.addEventListener('click', function () {
    startTimer();
    if (window.Shop) window.Shop.toast('کد جدید ارسال شد (نسخه نمایشی: 12345)');
  });

  codeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = Store.latin(codeForm.elements.code.value);
    var codeErr = document.getElementById('login-code-error');
    var nameErr = document.getElementById('login-name-error');
    var name = codeForm.elements.name.value.trim();
    codeErr.textContent = code === DEMO_CODE ? '' : (code ? 'کد واردشده درست نیست.' : 'کد تأیید را وارد کنید.');
    codeForm.elements.code.setAttribute('aria-invalid', codeErr.textContent ? 'true' : 'false');
    nameErr.textContent = !nameField.hidden && name.length < 3 ? 'نام و نام خانوادگی را وارد کنید.' : '';
    codeForm.elements.name.setAttribute('aria-invalid', nameErr.textContent ? 'true' : 'false');
    if (codeErr.textContent) { codeForm.elements.code.focus(); return; }
    if (nameErr.textContent) { codeForm.elements.name.focus(); return; }

    var profile = Store.read('fibeso-known-' + mobile, null) || { mobile: mobile, name: name, email: '', joined: new Date().toISOString() };
    Store.write('fibeso-known-' + mobile, profile);
    Store.login(profile);
    window.location.href = next;
  });
})();
