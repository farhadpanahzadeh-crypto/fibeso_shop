/* Entry point: boots shared components once the DOM is ready (scripts are deferred). */
(function () {
  'use strict';

  if (!window.UI) return;
  window.UI.initAccordions(document);
  window.UI.initFilters(document);
  window.UI.initReveal(document);
  window.UI.initCounters(document);
})();
