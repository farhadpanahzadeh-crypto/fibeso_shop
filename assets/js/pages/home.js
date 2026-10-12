/* Home page: call-back request form (front-end validation only) */
(function () {
  'use strict';

  var form = document.querySelector('[data-callback-form]');
  if (!form || !window.UI) return;

  var input = form.querySelector('input[name="phone"]');
  var error = document.getElementById(input.getAttribute('aria-describedby'));
  var status = form.querySelector('[data-form-status]');
  var submit = form.querySelector('[type="submit"]');
  var mobilePattern = /^(?:\+98|0098|0)?9\d{9}$/;

  function validate() {
    var value = window.UI.toLatinDigits(input.value).replace(/[\s-]/g, '');
    var message = '';
    if (!value) message = 'لطفاً شماره موبایل را وارد کنید.';
    else if (!mobilePattern.test(value)) message = 'شماره موبایل معتبر نیست؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.';
    error.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  input.addEventListener('blur', function () {
    if (input.value) validate();
  });

  input.addEventListener('input', function () {
    if (input.getAttribute('aria-invalid') === 'true') validate();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form-status';

    if (!validate()) {
      input.focus();
      return;
    }

    // No backend exists yet: report honestly instead of faking a submission.
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    window.setTimeout(function () {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      status.classList.add('form-status--success');
      status.textContent = 'شماره معتبر است. این فرم هنوز به سرور متصل نشده و اطلاعاتی ارسال نشد.';
    }, 400);
  });
})();
