/* Entry point: boots shared components (scripts are deferred, DOM is ready). */
(function () {
  'use strict';

  if (window.UI) {
    window.UI.initAccordions(document);
    window.UI.initReveal(document);
    window.UI.initCounters(document);
  }

  // Header account icon: name the signed-in user for assistive tech
  var user = window.Store && window.Store.user();
  document.querySelectorAll('[data-account-link]').forEach(function (a) {
    a.setAttribute('aria-label', user ? 'پنل کاربری ' + (user.name || '') : 'ورود یا ثبت‌نام');
    a.classList.toggle('is-signed-in', !!user);
  });
})();
