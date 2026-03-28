/* ========================================
   LexFlow Law Firm – Tasks Page
   ======================================== */

let allTasks = [];
let filteredTasks = [];
let currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user')) || { name: 'Sarah Mitchell', avatar: 'SM', role: 'Firm Admin' };

// ----- Load Data from Shared Mock JSON -----
async function initTasks() {
  const adminUser = { name: 'Alexander Wright', avatar: 'AW', id: 'ADM_GLOBAL', role: 'admin' };
  sessionStorage.setItem('lexflow_current_user', JSON.stringify(adminUser));
  
  document.getElementById('sidebarName').textContent = adminUser.name;
  document.getElementById('sidebarAvatar').textContent = adminUser.avatar;

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
    
    // Show ALL tasks for Admin
    allTasks = data.tasks || [];
    window.allUsers = data.users || [];
    filteredTasks = [...allTasks];
    
    renderPage(1);
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
}

// Helper to save tasks to local storage
function saveTasks() {
    const stored = localStorage.getItem('lexflow_mock_data');
    if (stored) {
        let data = JSON.parse(stored);
        data.tasks = allTasks;
        localStorage.setItem('lexflow_mock_data', JSON.stringify(data));
    }
}

const TASKS_PER_PAGE = 5;
let currentPage = 1;

// DOM refs
const tasksTbody    = document.getElementById('tasksTbody');
const paginationInfo = document.getElementById('taskPaginationInfo');
const paginationPages = document.getElementById('taskPaginationPages');
const searchInput   = document.getElementById('taskSearchInput');
const prioFilter     = document.getElementById('taskPriorityFilter');
const statusFilter   = document.getElementById('taskStatusFilter');

function getInitials(name) {
    if(!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
}

function getStatusIcon(status) {
    if (status === 'Completed') {
        // Green Document with Checkmark
        return `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#D1FAE5" stroke="#10B981" stroke-width="2" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="17" cy="17" r="5" fill="#10B981"/>
                <path d="M15 17L16.5 18.5L19 15.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    } else {
        // Yellow Document with X (as seen in user image 2/4 for pending/reject)
        return `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="17" cy="17" r="5" fill="#F59E0B"/>
                <path d="M15.5 15.5L18.5 18.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M18.5 15.5L15.5 18.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`;
    }
}

function renderTaskRow(t) {
  const prioClass = t.priority ? t.priority.toLowerCase() : 'low';
  const statusClass = t.status === 'Completed' ? 'completed' : '';
  
  return `
    <tr class="page-item">
        <td style="padding-left: 20px; max-width: 250px;">
            <div class="task-name-col">
                <span class="task-title" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.name}</span>
                <span class="task-subtitle" style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.caseTitle || 'General Task'}</span>
            </div>
        </td>
        <td>
            <span class="task-id">${t.id}</span>
        </td>
        <td>
            <div class="task-user" style="white-space: nowrap;">
                <div class="task-avatar" style="background: ${t.status === 'Completed' ? '#f3f4f6' : '#dbeafe'}">${getInitials(t.assignedUser)}</div>
                <span>${t.assignedUser}</span>
            </div>
        </td>
        <td>
            <span class="task-priority ${prioClass}">${t.priority}</span>
        </td>
        <td>
            <span class="task-date" style="white-space: nowrap;">${t.dueDate}</span>
        </td>
        <td>
            <div class="task-status ${statusClass}" style="white-space: nowrap;">
                <div class="task-status-icon">
                    ${getStatusIcon(t.status)}
                </div>
                ${t.status}
            </div>
        </td>
        <td style="padding-right: 20px; text-align: right;">
            <div class="task-actions" style="justify-content: flex-end; white-space: nowrap;">
                <button title="View" onclick="openViewTaskModal('${t.id}')">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button title="Edit" onclick="openEditTaskModal('${t.id}')">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button title="Delete" onclick="deleteTask('${t.id}')">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        </td>
    </tr>
  `;
}

// ----- Render page -----
function renderPage(page) {
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE) || 1;
  page = Math.max(1, Math.min(page, totalPages));
  currentPage = page;

  const start = (page - 1) * TASKS_PER_PAGE;
  const pageTasks = filteredTasks.slice(start, start + TASKS_PER_PAGE);

  tasksTbody.style.opacity = '0';

  setTimeout(() => {
    if (pageTasks.length === 0) {
      tasksTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 40px;">No tasks found matching your criteria.</td></tr>';
    } else {
      tasksTbody.innerHTML = pageTasks.map(renderTaskRow).join('');
    }
    tasksTbody.style.opacity = '1';
    tasksTbody.style.transition = 'opacity 0.2s';
  }, 100);

  // Update info
  const showEnd = Math.min(start + TASKS_PER_PAGE, filteredTasks.length);
  paginationInfo.innerHTML = `Showing <strong>${filteredTasks.length === 0 ? 0 : start + 1}</strong> to <strong>${showEnd}</strong> of <strong>${filteredTasks.length}</strong> tasks`;

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

// ----- Filtering -----
function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const prio = prioFilter.value;
    const status = statusFilter.value;

    filteredTasks = allTasks.filter(t => {
        const matchesQuery = t.name.toLowerCase().includes(query) || (t.caseTitle && t.caseTitle.toLowerCase().includes(query)) || t.id.toLowerCase().includes(query);
        const matchesPrio = prio === 'All' || t.priority === prio;
        const matchesStatus = status === 'All' || t.status === status;
        return matchesQuery && matchesPrio && matchesStatus;
    });

    renderPage(1);
}

searchInput.addEventListener('input', applyFilters);
prioFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);

// ----- Modal Logic -----
window.openModal = function(id) {
    document.getElementById(id).classList.add('active');
};
window.closeModal = function(id) {
    const modal = document.getElementById(id);
    LexValidation.clearAllErrors(modal);
    modal.classList.remove('active');
};

// Create Task
window.openCreateTaskModal = function() {
    document.getElementById('taskModalTitle').textContent = 'Create New Task';
    document.getElementById('saveTaskBtn').textContent = 'Create Task';
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskCaseInput').value = '';
    document.getElementById('taskDateInput').value = '';
    document.getElementById('taskDescInput').value = '';
    
    // Populate Assignee select
    const assignSelect = document.getElementById('taskAssigneeInput');
    assignSelect.innerHTML = window.allUsers.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    
    setActivePriority('LOW');
    openModal('taskModal');
};

// Edit Task
window.openEditTaskModal = function(taskId) {
    const t = allTasks.find(task => task.id === taskId);
    if (!t) return;

    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('saveTaskBtn').textContent = 'Update Task';
    document.getElementById('taskEditId').value = t.id;
    document.getElementById('taskNameInput').value = t.name;
    document.getElementById('taskCaseInput').value = t.caseTitle || '';
    
    // Populate Assignee select
    const assignSelect = document.getElementById('taskAssigneeInput');
    assignSelect.innerHTML = window.allUsers.map(u => `<option value="${u.name}" ${u.name === t.assignedUser ? 'selected' : ''}>${u.name}</option>`).join('');

    // Date formatting for input type="date"
    if (t.dueDate && t.dueDate.includes(',')) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
            document.getElementById('taskDateInput').value = d.toISOString().split('T')[0];
        }
    } else {
        document.getElementById('taskDateInput').value = '';
    }
    
    document.getElementById('taskDescInput').value = t.description || '';
    setActivePriority(t.priority || 'LOW');
    openModal('taskModal');
};

// View Task
window.openViewTaskModal = function(taskId) {
    const t = allTasks.find(task => task.id === taskId);
    if (!t) return;

    document.getElementById('viewTaskId').textContent = t.id;
    document.getElementById('viewTaskTitle').textContent = t.name;
    document.getElementById('viewTaskStatus').innerHTML = `<div class="task-status-icon" style="width:16px; height:16px;">${getStatusIcon(t.status)}</div> ${t.status}`;
    document.getElementById('viewTaskDate').textContent = t.dueDate;
    document.getElementById('viewTaskPriority').textContent = t.priority;
    document.getElementById('viewTaskPriority').style.background = getPrioColor(t.priority).bg;
    document.getElementById('viewTaskPriority').style.color = getPrioColor(t.priority).text;
    document.getElementById('viewTaskDesc').textContent = t.description || 'No additional description provided.';
    document.getElementById('viewTaskAssignee').textContent = t.assignedUser;
    document.getElementById('viewTaskAvatar').textContent = getInitials(t.assignedUser);

    const completeBtn = document.getElementById('completeTaskBtn');
    if (t.status === 'Completed') {
        completeBtn.textContent = 'Completed';
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.5';
    } else {
        completeBtn.textContent = 'Mark as Completed';
        completeBtn.disabled = false;
        completeBtn.style.opacity = '1';
        completeBtn.onclick = () => markTaskAsCompleted(t.id);
    }

    openModal('viewTaskModal');
};

function getPrioColor(prio) {
    if (prio === 'HIGH') return { bg: '#fee2e2', text: '#ef4444' };
    if (prio === 'MEDIUM') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#dcfce3', text: '#166534' };
}

window.openEditTaskFromView = function() {
    const taskId = document.getElementById('viewTaskId').textContent;
    closeModal('viewTaskModal');
    openEditTaskModal(taskId);
};

window.saveTaskModal = function() {
    const nameInput = document.getElementById('taskNameInput');
    const dateInput = document.getElementById('taskDateInput');
    const modal = document.getElementById('taskModal');
    LexValidation.clearAllErrors(modal);

    const rules = [
        { input: nameInput, validator: (v) => LexValidation.validateRequired(v, 'Task name') },
        { input: dateInput, validator: (v) => LexValidation.validateDate(v, 'Due date') },
    ];
    if (!LexValidation.validateForm(rules)) {
        modal.querySelector('.modal-content').classList.add('form-shake');
        setTimeout(() => modal.querySelector('.modal-content').classList.remove('form-shake'), 450);
        return;
    }

    const editId = document.getElementById('taskEditId').value;
    const caseTitle = document.getElementById('taskCaseInput').value;
    const assignee = document.getElementById('taskAssigneeInput').value;
    const desc = document.getElementById('taskDescInput').value;
    const priority = document.getElementById('taskPriorityInput').value;

    const formattedDate = new Date(dateInput.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    if (editId) {
        const t = allTasks.find(task => task.id === editId);
        if (t) {
            t.name = nameInput.value.trim();
            t.caseTitle = caseTitle;
            t.assignedUser = assignee;
            t.dueDate = formattedDate;
            t.description = desc;
            t.priority = priority;
        }
    } else {
        const newId = 'T-' + (1000 + Math.floor(Math.random() * 9000));
        allTasks.unshift({
            id: newId,
            name: nameInput.value.trim(),
            caseTitle: caseTitle,
            assignedUser: assignee,
            priority: priority,
            dueDate: formattedDate,
            status: 'Pending',
            description: desc,
            caseCnr: ''
        });
    }

    saveTasks();
    applyFilters();
    closeModal('taskModal');
};

window.markTaskAsCompleted = function(taskId) {
    const id = taskId || document.getElementById('viewTaskId').textContent;
    const t = allTasks.find(task => task.id === id);
    if (t) {
        t.status = 'Completed';
        saveTasks();
        applyFilters();
        if (taskId) {
            // If called from view modal, we might want to update it
            openViewTaskModal(id);
        } else {
            closeModal('viewTaskModal');
        }
    }
};

window.deleteTask = function(taskId) {
    if(confirm('Are you sure you want to delete task ' + taskId + '?')) {
        allTasks = allTasks.filter(t => t.id !== taskId);
        saveTasks();
        applyFilters();
    }
};

// Priority Toggle Logic
const prioToggles = document.querySelectorAll('.prio-toggle');
prioToggles.forEach(btn => {
    btn.addEventListener('click', function() {
        setActivePriority(this.dataset.prio);
    });
});

function setActivePriority(prio) {
    prioToggles.forEach(b => b.classList.remove('active'));
    const activeBtn = Array.from(prioToggles).find(b => b.dataset.prio === prio);
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('taskPriorityInput').value = prio;
}

// Filter Dropdown
const filterBtn = document.getElementById('taskFilterBtn');
const filterDropdown = document.getElementById('taskFilterDropdown');
if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });
}
document.addEventListener('click', () => {
    if (filterDropdown) filterDropdown.style.display = 'none';
});
if (filterDropdown) filterDropdown.addEventListener('click', (e) => e.stopPropagation());

// Initial render
initTasks();
