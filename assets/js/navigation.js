/* Site header: sticky shadow + accessible mobile menu */
(function () {
  'use strict';

  var header = document.querySelector('[data-header]');
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var label = document.querySelector('[data-nav-label]');
  var desktop = window.matchMedia('(min-width: 64rem)');

  var backdrop = document.querySelector('[data-backdrop]');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'بستن منو' : 'باز کردن منو';
    nav.hidden = !open && !desktop.matches;
    nav.classList.toggle('is-drawer', open && !desktop.matches);
    if (header) header.classList.toggle('has-drawer', open && !desktop.matches);
    if (backdrop) backdrop.hidden = !(open && !desktop.matches);
    document.body.style.overflow = open && !desktop.matches ? 'hidden' : '';
  }

  if (nav && toggle) {
    setOpen(false);

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a link (in-page anchors) on mobile
    nav.addEventListener('click', function (event) {
      if (event.target.closest('[data-nav-close]')) {
        setOpen(false);
        toggle.focus();
      } else if (event.target.closest('a') && !desktop.matches) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (desktop.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });

    desktop.addEventListener('change', function () {
      setOpen(false);
    });
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
