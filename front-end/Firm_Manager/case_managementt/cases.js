/* ========================================
   LexFlow Law Firm – Cases Page
   ======================================== */

let allCases = [];
let filteredCases = [];
let allTasks = [];
let filteredTasks = [];
let currentTab = 'all'; // 'all' or 'pending'

// ----- Load Data from Shared Mock JSON -----
async function initCases() {
  const currentUser = { name: 'Alexander Wright', avatar: 'AW', id: 'ADM_GLOBAL', role: 'admin' };
  sessionStorage.setItem('lexflow_current_user', JSON.stringify(currentUser));
  
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarAvatar').textContent = currentUser.avatar;

  try {
    let data;
    const stored = localStorage.getItem('lexflow_mock_data');
    if (stored) {
      data = JSON.parse(stored);
    } else {
      const response = await fetch('../../Client/case_management_client/data/mock-data.json');
      data = await response.json();
      localStorage.setItem('lexflow_mock_data', JSON.stringify(data));
    }
    
    // Show ALL cases for Admin
    allCases = data.cases || [];
    allTasks = data.tasks || [];
    allLawyers = data.users.filter(u => u.role === 'admin');
    
    // Default filter
    filteredCases = [...allCases];

    // Compute pending tasks badge for ALL cases (Admin view)
    const pendingTasks = allTasks.filter(t => t.status === 'Pending');
    document.getElementById('pendingTasksCount').textContent = pendingTasks.length;

    renderPage(1);
  } catch (err) {
    console.error('Error loading cases:', err);
  }
}

const ITEMS_PER_PAGE = 4;
let currentPage = 1;

// DOM refs
const caseListEl    = document.getElementById('caseList');
const noResultsEl   = document.getElementById('noResults');
const paginationInfo = document.getElementById('paginationInfo');
const paginationPages = document.getElementById('paginationPages');
const searchInput   = document.getElementById('searchInput');
const tabBtns       = document.querySelectorAll('.tab-btn');

// ----- Tab logic -----
tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        
        if (currentTab === 'pending') {
            searchInput.placeholder = "Enter Task Name to search";
            document.getElementById('caseFilterGroup').style.display = 'none';
            document.getElementById('taskFilterGroup').style.display = 'block';
        } else {
            searchInput.placeholder = "Enter CNR to search cases";
            document.getElementById('caseFilterGroup').style.display = 'block';
            document.getElementById('taskFilterGroup').style.display = 'none';
        }
        searchInput.value = '';
        
        applyFilters();
    });
});

// ----- Filter Dropdown logic -----
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const statusFilter = document.getElementById('statusFilter');
const taskPriorityFilter = document.getElementById('taskPriorityFilter');
const taskStatusFilter = document.getElementById('taskStatusFilter');

if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });
}

document.addEventListener('click', () => {
    if (filterDropdown) filterDropdown.style.display = 'none';
});

if (filterDropdown) {
    filterDropdown.addEventListener('click', (e) => e.stopPropagation());
}

if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
}
if (taskPriorityFilter) {
    taskPriorityFilter.addEventListener('change', applyFilters);
}
if (taskStatusFilter) {
    taskStatusFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    if (currentTab === 'all') {
        let temp = [...allCases];
        if (query !== '') {
            temp = temp.filter(c =>
                c.title.toLowerCase().includes(query) ||
                c.cnr.toLowerCase().includes(query)
            );
        }
        const selectedStatus = statusFilter ? statusFilter.value : 'All';
        if (selectedStatus !== 'All') {
            temp = temp.filter(c => c.status === selectedStatus);
        }
        filteredCases = temp;
    } else {
        const selectedPriority = taskPriorityFilter ? taskPriorityFilter.value : 'All';
        const selectedTaskStatus = taskStatusFilter ? taskStatusFilter.value : 'All';

        let temp = [...allTasks];
        
        if (query !== '') {
            temp = temp.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.caseTitle.toLowerCase().includes(query)
            );
        }
        
        if (selectedPriority !== 'All') {
            temp = temp.filter(t => t.priority === selectedPriority);
        }
        
        if (selectedTaskStatus !== 'All') {
            temp = temp.filter(t => t.status === selectedTaskStatus);
        } else {
            // Default behavior if 'All Statuses' is selected: still show 'Pending' tasks usually for this tab?
            // User said "pending task" tab, but also wants filters. 
            // If they select 'All Statuses', I'll show both Pending and Completed.
        }
        
        filteredTasks = temp;
    }

    renderPage(1);
}

// ----- Render a single case card with client animation classes -----
function renderCaseCard(c) {
  const hearingDate = c.nextHearing ? c.nextHearing.date : 'TBD';
  const lawyersOptions = (window.allLawyers || []).map(l => 
    `<option value="${l.id}" ${l.id === c.assignedAdvocateId ? 'selected' : ''}>Adv. ${l.name}</option>`
  ).join('');

  return `
    <div class="case-card page-item" data-title="${c.title.toLowerCase()}" data-cnr="${c.cnr.toLowerCase()}" onclick="window.location.href='case-details.html?cnr=${c.cnr}'" style="display:flex; justify-content:space-between; align-items:center; gap: 24px;">
      
      <div class="case-info-left" style="display:flex; align-items:center; gap: 20px; flex: 1; min-width: 0;">
          <div class="case-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 8H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V10a2 2 0 00-2-2zM16 8V6a3 3 0 00-6 0v2M7 13v3m10-3v3"/></svg>
          </div>
          <div style="display:flex; flex-direction:column; gap: 6px; min-width: 0; flex: 1;">
            <div class="meta-row" style="display:flex; align-items:center; gap: 8px;">
                <span class="badge-active">${c.status}</span>
                <span style="font-size:11px; color:#6b7280; font-family:monospace; letter-spacing:0.5px;">CNR: ${c.cnr}</span>
            </div>
            <div class="case-title" style="margin:0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.title}</div>
            <div class="case-meta" style="margin:0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5"/></svg> ${c.type} · ${c.court}</span>
            </div>
          </div>
      </div>

      <div class="case-info-right" style="display:flex; gap: 32px; align-items:center; flex-shrink: 0;">
          <div style="text-align: right;" onclick="event.stopPropagation()">
              <div style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 4px;">ASSIGNED LAWYER</div>
              <select class="form-input" style="padding: 4px 8px; font-size: 13px; font-weight: 600; min-width: 160px; border-color: #e5e7eb;" onchange="changeLawyer('${c.cnr}', this.value)">
                ${lawyersOptions}
              </select>
          </div>
          <div style="text-align: right; white-space: nowrap;">
              <div style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 4px;">NEXT HEARING</div>
              <div style="font-size:14px; font-weight:600; color:#3b5bdb; display:flex; align-items:center; gap: 4px; justify-content:flex-end;">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  ${hearingDate}
              </div>
          </div>
          <a class="view-details" href="case-details.html?cnr=${c.cnr}">View Details →</a>
      </div>
    </div>`;
}

async function changeLawyer(cnr, lawyerId) {
    const data = JSON.parse(localStorage.getItem('lexflow_mock_data'));
    const caseIdx = data.cases.findIndex(c => c.cnr === cnr);
    if (caseIdx !== -1) {
        data.cases[caseIdx].assignedAdvocateId = lawyerId;
        localStorage.setItem('lexflow_mock_data', JSON.stringify(data));
        allCases = data.cases;
        applyFilters(); // refresh UI
    }
}
window.changeLawyer = changeLawyer;

function renderTaskCard(t) {
  const prioClass = t.priority ? t.priority.toLowerCase() : 'low';
  
  return `
    <div class="case-card page-item" style="display:flex; justify-content:space-between; align-items:center; cursor:default;">
      
      <div class="case-info-left" style="display:flex; align-items:center; gap: 20px;">
          <div class="case-icon" style="background: #fef3c7; color: #d97706;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div style="display:flex; flex-direction:column; gap: 6px;">
            <div class="meta-row" style="display:flex; align-items:center; gap: 8px;">
                <span style="background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;">${t.status}</span>
                <span style="background: ${t.priority === 'HIGH' ? '#fee2e2' : '#dcfce3'}; color: ${t.priority === 'HIGH' ? '#dc2626' : '#166534'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${t.priority}</span>
            </div>
            <div class="case-title" style="margin:0;">${t.name}</div>
            <div class="case-meta" style="margin:0;">
                <span>${t.caseTitle}</span>
            </div>
          </div>
      </div>

      <div class="case-info-right" style="display:flex; gap: 32px; align-items:center;">
          <div style="text-align: right;">
              <div style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 4px;">DUE DATE</div>
              <div style="font-size:14px; font-weight:600; color:#1a1a2e; ${t.dueDate === 'Today' ? 'color:#ef4444;' : ''}">${t.dueDate}</div>
          </div>
          <button style="border: 1px solid #e5e7eb; background: #fff; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; color: #1a1a2e; cursor:pointer;" onclick="window.location.href='case-details.html?cnr=${t.caseCnr}'">View Case</button>
      </div>
    </div>`;
}

// ----- Render page -----
function renderPage(page) {
  const currentList = currentTab === 'all' ? filteredCases : filteredTasks;
  const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
  page = Math.max(1, Math.min(page, totalPages || 1));
  currentPage = page;

  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = currentList.slice(start, start + ITEMS_PER_PAGE);

  // Client-like animation: fade-out then fade-in with classes
  caseListEl.classList.add('fade-out');

  setTimeout(() => {
    if (pageItems.length === 0) {
      caseListEl.innerHTML = '';
      noResultsEl.style.display = 'flex';
      noResultsEl.style.flexDirection = 'column';
      noResultsEl.style.alignItems = 'center';
    } else {
      noResultsEl.style.display = 'none';
      if (currentTab === 'all') {
          caseListEl.innerHTML = pageItems.map(renderCaseCard).join('');
      } else {
          caseListEl.innerHTML = pageItems.map(renderTaskCard).join('');
      }
    }
    caseListEl.classList.remove('fade-out');
    caseListEl.classList.add('fade-in');
    setTimeout(() => caseListEl.classList.remove('fade-in'), 300);
  }, 200);

  // Update info
  const showEnd = Math.min(start + ITEMS_PER_PAGE, currentList.length);
  const typeStr = currentTab === 'all' ? 'cases' : 'tasks';
  paginationInfo.innerHTML = `Showing <strong>${currentList.length === 0 ? 0 : start + 1}</strong> to <strong>${showEnd}</strong> of <strong>${currentList.length}</strong> ${typeStr}`;

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
searchInput.addEventListener('input', applyFilters);

// Initial render
initCases();
