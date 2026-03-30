/**
 * sidebar.js
 * Fetches the shared sidebar HTML and injects it into #sidebar-container,
 * then auto-highlights the nav item that matches the current page.
 */

(function () {

  // Maps page filename (lowercase) → nav item ID in sidebar.html
  const PAGE_TO_NAV = {
    'ScheduleManagement.html': 'nav-scheduling',
    'consultations.html':      'nav-consultations',
    'cases.html':              'nav-cases',
    'documents.html':          'nav-documents',
    'billing.html':            'nav-billing',
  };

  async function loadComponent(selector, url) {
    const container = document.querySelector(selector);
    if (!container) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[sidebar.js] Failed to load "${url}": ${response.status} ${response.statusText}`);
        return;
      }

      const html = await response.text();

      // Extract only what's inside <body>…</body> if this is a full HTML doc
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      container.innerHTML = bodyMatch ? bodyMatch[1].trim() : html.trim();

      // Auto-set active nav item based on current page filename
      const page = location.pathname.split('/').pop();
      const navId = PAGE_TO_NAV[page];
      if (navId) {
        const el = document.getElementById(navId);
        if (el) el.classList.add('active');
      }

    } catch (err) {
      console.error(`[sidebar.js] Network error loading "${url}":`, err);
    }
  }

  loadComponent('#sidebar-container', '../pages/sidebar.html');

})();
