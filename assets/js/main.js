/* Entry point: boots shared components (scripts are deferred, DOM is ready). */
(function () {
  'use strict';

  if (!window.UI) return;
  window.UI.initAccordions(document);
  window.UI.initReveal(document);
  window.UI.initCounters(document);
})();
