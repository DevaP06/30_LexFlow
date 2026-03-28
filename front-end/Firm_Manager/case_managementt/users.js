/**
 * Firm Admin – User Management
 * Persists to localStorage lexflow_mock_data (same as cases.js).
 */

const MOCK_PATH = '../../shared/data/mock-data.json';
const STORAGE_KEY = 'lexflow_mock_data';

const ITEMS_PER_PAGE = 8;

let appData = null;
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let editingUserId = null;

let formAccountStatus = 'active';
let formAvailability = 'available';

/** Defaults for rows missing optional fields (legacy or partial). */
function normalizeUser(u) {
  const out = { ...u };
  if (!out.accountStatus) out.accountStatus = 'active';
  if (!out.availability) out.availability = 'available';
  if (!out.badgeRole) {
    out.badgeRole = out.role === 'admin' ? 'lawyer' : 'client';
  }
  if (!out.phone) out.phone = '';
  if (!out.avatar && out.name) {
    const parts = out.name.trim().split(/\s+/);
    out.avatar = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : out.name.slice(0, 2).toUpperCase();
  }
  return out;
}

function assignMissingFirmUserIds(users) {
  let maxNum = 0;
  users.forEach((u) => {
    const m = u.firmUserId && String(u.firmUserId).match(/^LF-(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  users.forEach((u) => {
    if (!u.firmUserId) {
      maxNum += 1;
      u.firmUserId = `LF-${String(maxNum).padStart(3, '0')}`;
    }
  });
}

function syncRoleFromBadge(user) {
  const br = user.badgeRole;
  if (br === 'client') {
    user.role = 'end-user';
  } else {
    user.role = 'admin';
  }
}

function nextInternalId(users, badgeRole) {
  const prefix = badgeRole === 'client' ? 'USR' : 'ADM';
  let max = 0;
  users.forEach((u) => {
    if (String(u.id).startsWith(prefix)) {
      const n = parseInt(String(u.id).replace(prefix, ''), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  });
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function nextFirmUserId(users) {
  let maxNum = 0;
  users.forEach((u) => {
    const m = u.firmUserId && String(u.firmUserId).match(/^LF-(\d+)$/i);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  });
  return `LF-${String(maxNum + 1).padStart(3, '0')}`;
}

function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return null;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

async function initUsers() {
  const sessionUser = { name: 'Sarah Mitchell', avatar: 'SM', id: 'ADM001', role: 'admin' };
  sessionStorage.setItem('lexflow_current_user', JSON.stringify(sessionUser));
  const nameEl = document.getElementById('sidebarName');
  const avEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = sessionUser.name;
  if (avEl) avEl.textContent = sessionUser.avatar;

  try {
    let data = loadFromStorage();
    if (!data) {
      const response = await fetch(MOCK_PATH);
      data = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    appData = data;
    if (!Array.isArray(appData.users)) appData.users = [];

    appData.users = appData.users.map((u) => normalizeUser(u));
    assignMissingFirmUserIds(appData.users);
    appData.users.forEach(syncRoleFromBadge);
    saveData();

    allUsers = appData.users;
    applyFilters();
  } catch (err) {
    console.error('User management init failed:', err);
  }
}

function computeStats(users) {
  const total = users.length;
  const activeLawyers = users.filter(
    (u) =>
      u.accountStatus === 'active' &&
      (u.badgeRole === 'lawyer' || u.badgeRole === 'manager')
  ).length;
  const activeClients = users.filter(
    (u) => u.accountStatus === 'active' && u.badgeRole === 'client'
  ).length;
  return { total, activeLawyers, activeClients };
}

function updateStatsDisplay() {
  const { total, activeLawyers, activeClients } = computeStats(allUsers);
  document.getElementById('statTotal').textContent = String(total).padStart(3, '0');
  document.getElementById('statLawyers').textContent = String(activeLawyers).padStart(3, '0');
  document.getElementById('statClients').textContent = String(activeClients).padStart(3, '0');
}

const BADGE_LABELS = { manager: 'Manager', lawyer: 'Lawyer', client: 'Client' };

function badgeClass(role) {
  if (role === 'manager') return 'users-badge users-badge--manager';
  if (role === 'lawyer') return 'users-badge users-badge--lawyer';
  return 'users-badge users-badge--client';
}

function renderUserRow(u) {
  const availDot =
    u.availability === 'available'
      ? '<span class="users-dot users-dot--ok"></span>'
      : '<span class="users-dot users-dot--muted"></span>';
  const availText = u.availability === 'available' ? 'Available' : 'Not available';
  const statusLine =
    u.accountStatus === 'active'
      ? `<span class="users-status-pill users-status-pill--active">Active</span>`
      : `<span class="users-status-pill users-status-pill--inactive">Inactive</span>`;

  const safeName = escapeHtml(u.name || '');
  const safeEmail = escapeHtml(u.email || '');
  const safeFirm = escapeHtml(u.firmUserId || '');
  const idAttr = escapeAttr(u.id);

  return `
    <tr data-id="${idAttr}">
      <td>
        <div class="users-cell-name">
          <div class="users-avatar">${escapeHtml(u.avatar || '?')}</div>
          <div>
            <div class="users-name">${safeName}</div>
            <div class="users-id-sub">ID: ${safeFirm}</div>
          </div>
        </div>
      </td>
      <td>${safeEmail}</td>
      <td><span class="${badgeClass(u.badgeRole)}">${BADGE_LABELS[u.badgeRole] || u.badgeRole}</span></td>
      <td>
        <div class="users-status-cell">${availDot}<span>${availText}</span></div>
        <div class="users-account-line">${statusLine}</div>
      </td>
      <td class="users-td-actions">
        <button type="button" class="users-action-btn" data-action="edit" data-id="${idAttr}" title="Edit">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </button>
        <button type="button" class="users-action-btn users-action-btn--danger" data-action="delete" data-id="${idAttr}" title="Delete">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    </tr>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function applyFilters() {
  const q = (document.getElementById('userSearchInput').value || '').trim().toLowerCase();
  const roleFilter = document.getElementById('roleFilterSelect').value;

  filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.badgeRole !== roleFilter) return false;
    if (!q) return true;
    const hay = `${u.name} ${u.email} ${u.firmUserId} ${u.badgeRole} ${u.accountStatus} ${u.availability}`.toLowerCase();
    return hay.includes(q);
  });
  currentPage = 1;
  renderUserPage(currentPage);
  updateStatsDisplay();
}

function renderUserPage(page) {
  const tbody = document.getElementById('usersTableBody');
  const noResults = document.getElementById('usersNoResults');
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  page = Math.max(1, Math.min(page, totalPages));
  currentPage = page;

  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredUsers.slice(start, start + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
  } else {
    noResults.style.display = 'none';
    tbody.innerHTML = pageItems.map(renderUserRow).join('');
    tbody.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') openEditModal(id);
        if (action === 'delete') deleteUser(id);
      });
    });
  }

  const showEnd = Math.min(start + ITEMS_PER_PAGE, filteredUsers.length);
  const info = document.getElementById('usersPaginationInfo');
  info.innerHTML =
    filteredUsers.length === 0
      ? 'Showing <strong>0</strong> users'
      : `Showing <strong>${start + 1}</strong> to <strong>${showEnd}</strong> of <strong>${filteredUsers.length}</strong> users`;

  const pagesEl = document.getElementById('usersPaginationPages');
  let btns = `<button class="pg-arrow users-pg-text" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button type="button" data-page="${i}" class="${i === page ? 'active' : ''}">${i}</button>`;
  }
  btns += `<button class="pg-arrow users-pg-text" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>`;
  pagesEl.innerHTML = btns;

  pagesEl.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', function () {
      const p = parseInt(this.dataset.page, 10);
      if (!isNaN(p)) renderUserPage(p);
    });
  });
}

function openModal() {
  document.getElementById('userModal').classList.add('active');
}

function closeModal() {
  document.getElementById('userModal').classList.remove('active');
  editingUserId = null;
}

function setToggleGroup(field, value) {
  if (field === 'accountStatus') formAccountStatus = value;
  if (field === 'availability') formAvailability = value;

  document.querySelectorAll(`[data-field="${field}"]`).forEach((btn) => {
    const v = btn.getAttribute('data-value');
    btn.classList.toggle('active', v === value);
  });
}

function resetFormForCreate() {
  editingUserId = null;
  LexValidation.clearAllErrors(document.querySelector('#userModal .modal-body'));
  document.getElementById('userFormId').value = '';
  document.getElementById('userFormName').value = '';
  document.getElementById('userFormEmail').value = '';
  document.getElementById('userFormPhone').value = '';
  document.getElementById('userFormBadgeRole').value = '';
  formAccountStatus = 'active';
  formAvailability = 'available';
  setToggleGroup('accountStatus', 'active');
  setToggleGroup('availability', 'available');
  document.getElementById('userModalTitle').textContent = 'Add New User';
  document.getElementById('userFormSubmit').textContent = 'Create User';
}

function openCreateModal() {
  resetFormForCreate();
  openModal();
}

function openEditModal(id) {
  const u = allUsers.find((x) => x.id === id);
  if (!u) return;
  editingUserId = id;
  document.getElementById('userFormId').value = u.id;
  document.getElementById('userFormName').value = u.name || '';
  document.getElementById('userFormEmail').value = u.email || '';
  document.getElementById('userFormPhone').value = u.phone || '';
  document.getElementById('userFormBadgeRole').value = u.badgeRole || '';
  formAccountStatus = u.accountStatus || 'active';
  formAvailability = u.availability || 'available';
  setToggleGroup('accountStatus', formAccountStatus);
  setToggleGroup('availability', formAvailability);
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userFormSubmit').textContent = 'Save Changes';
  openModal();
}

function validateEmailUnique(email, excludeId) {
  const e = email.trim().toLowerCase();
  return !allUsers.some((u) => u.email.trim().toLowerCase() === e && u.id !== excludeId);
}

function submitUserForm() {
  const nameInput = document.getElementById('userFormName');
  const emailInput = document.getElementById('userFormEmail');
  const phoneInput = document.getElementById('userFormPhone');
  const roleInput = document.getElementById('userFormBadgeRole');
  const modalBody = document.querySelector('#userModal .modal-body');

  // Clear previous errors
  LexValidation.clearAllErrors(modalBody);

  // Build validation rules
  const rules = [
    { input: nameInput, validator: (v) => LexValidation.validateName(v, 'Full name') },
    { input: emailInput, validator: (v) => {
      const fmtErr = LexValidation.validateEmail(v);
      if (fmtErr) return fmtErr;
      if (!validateEmailUnique(v, editingUserId)) return 'Another user already uses this email address';
      return null;
    }},
    { input: phoneInput, validator: LexValidation.validatePhone },
    { input: roleInput, validator: (v) => LexValidation.validateSelect(v, 'role') },
  ];

  if (!LexValidation.validateForm(rules)) {
    // Shake the modal to draw attention
    const content = document.querySelector('#userModal .modal-content');
    content.classList.add('form-shake');
    setTimeout(() => content.classList.remove('form-shake'), 450);
    return;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const badgeRole = roleInput.value;

  if (editingUserId) {
    const idx = appData.users.findIndex((u) => u.id === editingUserId);
    if (idx === -1) return;
    const prev = appData.users[idx];
    appData.users[idx] = {
      ...prev,
      name,
      email,
      phone,
      badgeRole,
      accountStatus: formAccountStatus,
      availability: formAvailability,
    };
    syncRoleFromBadge(appData.users[idx]);
    const parts = name.split(/\s+/);
    appData.users[idx].avatar =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
  } else {
    const newUser = {
      id: nextInternalId(appData.users, badgeRole),
      name,
      email,
      password: 'changeme123',
      phone,
      firmUserId: nextFirmUserId(appData.users),
      badgeRole,
      accountStatus: formAccountStatus,
      availability: formAvailability,
    };
    syncRoleFromBadge(newUser);
    const parts = name.split(/\s+/);
    newUser.avatar =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    if (newUser.role === 'admin') {
      newUser.barCouncilId = '';
      newUser.specialisation = '';
      newUser.winRate = 0;
      newUser.totalCases = 0;
      newUser.won = 0;
      newUser.lost = 0;
      newUser.ongoing = 0;
    }
    appData.users.push(newUser);
  }

  saveData();
  allUsers = appData.users;
  closeModal();
  applyFilters();
}

function deleteUser(id) {
  const u = allUsers.find((x) => x.id === id);
  if (!u) return;
  if (!confirm(`Remove ${u.name} from the firm? This cannot be undone.`)) return;
  appData.users = appData.users.filter((x) => x.id !== id);
  saveData();
  allUsers = appData.users;
  applyFilters();
}

function exportUsersJson() {
  const blob = new Blob([JSON.stringify(allUsers, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lexflow-users-export.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('userSearchInput').addEventListener('input', applyFilters);
document.getElementById('roleFilterSelect').addEventListener('change', applyFilters);
document.getElementById('addUserBtn').addEventListener('click', openCreateModal);
document.getElementById('exportUsersBtn').addEventListener('click', exportUsersJson);

document.getElementById('userModalClose').addEventListener('click', closeModal);
document.getElementById('userFormCancel').addEventListener('click', closeModal);
document.getElementById('userFormSubmit').addEventListener('click', submitUserForm);

document.getElementById('userModal').addEventListener('click', (e) => {
  if (e.target.id === 'userModal') closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('userModal').classList.contains('active')) {
    closeModal();
  }
});

document.querySelectorAll('.users-toggle-btn[data-field]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const field = btn.getAttribute('data-field');
    const value = btn.getAttribute('data-value');
    setToggleGroup(field, value);
  });
});

initUsers();
