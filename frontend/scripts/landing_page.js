/* =========================================================
    Landing Page Script
   ========================================================= */

(function () {
  'use strict';

  /* ---- Helper: dropdown toggle ---- */
  function makeDropdown(btnId, dropdownId, anchorId) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    const anchor = document.getElementById(anchorId);
    if (!btn || !dropdown || !anchor) return { btn, dropdown, anchor };

    function open() {
      dropdown.classList.add('is-open');
      btn.classList.add('is-open');
    }
    function close() {
      dropdown.classList.remove('is-open');
      btn.classList.remove('is-open');
    }
    function toggle() {
      dropdown.classList.contains('is-open') ? close() : open();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    return { btn, dropdown, anchor, open, close };
  }

  /* ---- Close all dropdowns when clicking outside ---- */
  const allAnchors = [];

  document.addEventListener('click', function (e) {
    allAnchors.forEach(function (a) {
      if (!a.anchor.contains(e.target)) a.close();
    });
  });

 /* Close when pressing ESC */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') allAnchors.forEach(function (a) { a.close(); });
  });

  /* ================================================================
     1. LOGIN DROPDOWN
     ================================================================ */
  const login = makeDropdown('login-btn', 'login-dropdown', 'login-anchor');
  if (login.close) allAnchors.push(login);

  const loginClientBtn = document.getElementById('login-client-btn');
  const loginLawfirmBtn = document.getElementById('login-lawfirm-btn');

  if (loginClientBtn) {
    loginClientBtn.addEventListener('click', function () {
      localStorage.setItem('userRole', 'client');
      login.close();
      window.location.href = '../pages/SignIn.html';
    });
  }

  if (loginLawfirmBtn) {
    loginLawfirmBtn.addEventListener('click', function () {
      localStorage.setItem('userRole', 'firmAdmin');
      login.close();
      window.location.href = '../pages/SignIn.html';
    });
  }

  /* ================================================================
     2. LANGUAGE DROPDOWN
     ================================================================ */
  const lang = makeDropdown('lang-btn', 'lang-dropdown', 'lang-anchor');
  if (lang.close) allAnchors.push(lang);

  const langLabel = document.getElementById('lang-label');
  const langOptions = document.querySelectorAll('#lang-dropdown .nav-dropdown__item');

  langOptions.forEach(function (optBtn) {
    optBtn.addEventListener('click', function () {
      langOptions.forEach(function (b) { b.classList.remove('is-active'); });
      optBtn.classList.add('is-active');

      if (langLabel) langLabel.textContent = optBtn.dataset.label;

      lang.close();
    });
  });

})();