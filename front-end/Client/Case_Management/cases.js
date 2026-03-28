/* ========================================
   LexFlow – Cases Page (Dynamic Pagination + Search)
   ======================================== */

let allCases = [];
let filteredCases = [];

// ----- Load Data from Mock JSON -----
async function initCases() {
  // Update Sidebar User Profile
  const currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
  if (currentUser) {
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarAvatar').textContent = currentUser.avatar || currentUser.name.charAt(0);
  } else {
    document.getElementById('sidebarName').textContent = 'John Doe';
    document.getElementById('sidebarAvatar').textContent = 'JD';
  }

  try {
    const response = await fetch('data/mock-data.json');
    const data = await response.json();
    allCases = data.cases;
    filteredCases = [...allCases];
    renderPage(1);
  } catch (err) {
    console.error('Error loading cases:', err);
  }
}

const CASES_PER_PAGE = 3;
let currentPage = 1;

// DOM refs
const caseListEl    = document.getElementById('caseList');
const noResultsEl   = document.getElementById('noResults');
const paginationInfo = document.getElementById('paginationInfo');
const paginationPages = document.getElementById('paginationPages');
const searchInput   = document.getElementById('searchInput');

// ----- Render a single case card -----
function renderCaseCard(c) {
  const avatarsHtml = (c.avatars || []).map((a, i) => {
    const cls = a.startsWith('+') ? 'av av-more' : 'av';
    return `<div class="${cls}">${a}</div>`;
  }).join('');

  // Fix: handle nextHearing object from JSON
  const hearingDate = c.nextHearing ? c.nextHearing.date : 'TBD';

  return `
    <div class="case-card page-item" data-title="${c.title.toLowerCase()}" data-cnr="${c.cnr.toLowerCase()}">
      <div class="case-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 8H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V10a2 2 0 00-2-2zM16 8V6a3 3 0 00-6 0v2M7 13v3m10-3v3"/></svg>
      </div>
      <div class="case-info">
        <div class="case-badges">
          <span class="badge-active">${c.status}</span>
          <span class="badge-type">${c.type}</span>
        </div>
        <div class="case-title">${c.title}</div>
        <div class="case-meta">
          <span><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/></svg> CNR: ${c.cnr}</span>
          <span><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5"/></svg> ${c.court}</span>
        </div>
        <div class="avatars">${avatarsHtml}</div>
      </div>
      <div class="case-right">
        <div class="hearing-box">
          <div class="label">NEXT HEARING</div>
          <div class="date">${hearingDate}</div>
        </div>
        <a class="view-details" href="case-details.html?cnr=${c.cnr}">View Details →</a>
      </div>
    </div>`;
}

// ----- Render page -----
function renderPage(page) {
  const totalPages = Math.ceil(filteredCases.length / CASES_PER_PAGE);
  page = Math.max(1, Math.min(page, totalPages || 1));
  currentPage = page;

  const start = (page - 1) * CASES_PER_PAGE;
  const pageCases = filteredCases.slice(start, start + CASES_PER_PAGE);

  // Animate out, then in
  caseListEl.classList.add('fade-out');

  setTimeout(() => {
    if (pageCases.length === 0) {
      caseListEl.innerHTML = '';
      noResultsEl.style.display = 'flex';
    } else {
      noResultsEl.style.display = 'none';
      caseListEl.innerHTML = pageCases.map(renderCaseCard).join('');
    }
    caseListEl.classList.remove('fade-out');
    caseListEl.classList.add('fade-in');
    setTimeout(() => caseListEl.classList.remove('fade-in'), 300);
  }, 200);

  // Update info
  const showEnd = Math.min(start + CASES_PER_PAGE, filteredCases.length);
  paginationInfo.innerHTML = `Showing <strong>${filteredCases.length === 0 ? 0 : start + 1}–${showEnd}</strong> of <strong>${filteredCases.length}</strong> cases`;

  // Build pagination buttons
  let btns = '';
  btns += `<button class="pg-arrow" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">&#8249;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`;
  }
  btns += `<button class="pg-arrow" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">&#8250;</button>`;
  paginationPages.innerHTML = btns;

  // Attach click handlers
  paginationPages.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', function () {
      const p = parseInt(this.dataset.page, 10);
      if (!isNaN(p)) renderPage(p);
    });
  });
}

// ----- Search -----
searchInput.addEventListener('input', function () {
  const query = this.value.toLowerCase().trim();
  if (query === '') {
    filteredCases = [...allCases];
  } else {
    filteredCases = allCases.filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.cnr.toLowerCase().includes(query)
    );
  }
  renderPage(1);
});

// ----- New Consultation -----
document.getElementById('btnNewConsultation').addEventListener('click', function () {
  alert('New Consultation flow coming soon!');
});

// Initial render
initCases();
