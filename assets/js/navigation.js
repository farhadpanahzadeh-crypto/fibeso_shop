/* Site header: sticky shadow, mobile menu drawer, category mega menu, back-to-top */
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

  /* ---------- Category mega menu ----------
     Desktop: disclosure panel; hovering or focusing a main category shows its
     subcategories (exactly one is always shown). Mobile: main categories are an
     accordion inside the navigation drawer. */
  var catMenu = document.querySelector('[data-cat-menu]');
  var catTrigger = document.querySelector('[data-cat-menu-trigger]');
  var catPanel = catTrigger && document.getElementById(catTrigger.getAttribute('aria-controls'));
  var mains = Array.prototype.slice.call(document.querySelectorAll('[data-cat-main]'));

  function setMain(main, open) {
    main.setAttribute('aria-expanded', String(open));
    document.getElementById(main.getAttribute('aria-controls')).hidden = !open;
  }

  function selectMain(main) {
    mains.forEach(function (m) { setMain(m, m === main); });
  }

  function closeCatMenu() {
    if (!catTrigger || catTrigger.getAttribute('aria-expanded') !== 'true') return;
    catTrigger.setAttribute('aria-expanded', 'false');
    catPanel.hidden = true;
  }

  if (catTrigger && catPanel) {
    catTrigger.addEventListener('click', function () {
      var open = catTrigger.getAttribute('aria-expanded') === 'true';
      catTrigger.setAttribute('aria-expanded', String(!open));
      catPanel.hidden = open;
    });

    mains.forEach(function (main) {
      main.addEventListener('click', function () {
        if (desktop.matches) selectMain(main);
        else setMain(main, main.getAttribute('aria-expanded') !== 'true');
      });
      main.addEventListener('mouseenter', function () {
        if (desktop.matches) selectMain(main);
      });
      main.addEventListener('focus', function () {
        if (desktop.matches) selectMain(main);
      });
    });

    // Desktop always shows one submenu; mobile starts fully collapsed
    var resetMains = function () {
      if (desktop.matches) selectMain(mains[0]);
      else mains.forEach(function (m) { setMain(m, false); });
    };
    resetMains();
    desktop.addEventListener('change', function () {
      closeCatMenu();
      resetMains();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && catTrigger.getAttribute('aria-expanded') === 'true') {
        closeCatMenu();
        catTrigger.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (desktop.matches && !catMenu.contains(event.target)) closeCatMenu();
    });
    catMenu.addEventListener('focusout', function (event) {
      if (desktop.matches && event.relatedTarget && !catMenu.contains(event.relatedTarget)) closeCatMenu();
    });
  }


  /* ---------- Back to top ---------- */
  var toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    var onScroll = function () { toTop.hidden = window.scrollY < 600; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
