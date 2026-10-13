/* Front-end handling for the contact and B2B forms (demo: nothing is sent, there is no backend yet). */
(function () {
  'use strict';

  var Store = window.Store;
  if (!Store) return;

  document.querySelectorAll('[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');
      status.className = 'form-status';
      status.textContent = '';
      if (!Store.validateForm(form)) return;
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      window.setTimeout(function () {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        form.reset();
        form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
        status.classList.add('form-status--success');
        status.textContent = form.getAttribute('data-success');
      }, 400);
    });
  });
})();
