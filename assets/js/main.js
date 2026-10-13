/* Entry point: boots shared components (scripts are deferred, DOM is ready). */
(function () {
  'use strict';

  if (window.UI) {
    window.UI.initAccordions(document);
    window.UI.initReveal(document);
    window.UI.initCounters(document);
  }

  // Header login button becomes the account link once signed in
  var user = window.Store && window.Store.user();
  var root = document.documentElement.getAttribute('data-root') || '';
  document.querySelectorAll('[data-account-link]').forEach(function (a) {
    if (!user) return;
    a.href = root + 'pages/account.html';
    a.classList.add('is-signed-in');
    var label = a.querySelector('[data-account-label]');
    if (label) label.textContent = user.name || 'حساب کاربری';
  });
})();
