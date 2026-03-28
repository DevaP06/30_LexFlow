/* ========================================
   LexFlow Law Firm – Case Details Page
   ======================================== */

let allData = {};
let currentCase = null;
let currentTasks = [];

// DOM Elements
const caseTopTitle = document.getElementById('caseTopTitle');
const caseTopSub = document.getElementById('caseTopSub');
const caseProgPct = document.getElementById('caseProgPct');
const caseProgFill = document.getElementById('caseProgFill');
const caseTopStatus = document.getElementById('caseTopStatus');
const teamContainer = document.getElementById('teamContainer');
const clientContact = document.getElementById('clientContact');
const opposingParty = document.getElementById('opposingParty');
const pendingCountBadge = document.getElementById('pendingCountBadge');
const pendingTasksContainer = document.getElementById('pendingTasksContainer');
const timelineContainer = document.getElementById('timelineContainer');
const documentsTbody = document.getElementById('documentsTbody');

async function initCaseDetails() {
  const currentUser = { name: 'Alexander Wright', avatar: 'AW', id: 'ADM_GLOBAL', role: 'admin' };
  sessionStorage.setItem('lexflow_current_user', JSON.stringify(currentUser));
  
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarAvatar').textContent = currentUser.avatar;

  try {
    let stored = localStorage.getItem('lexflow_mock_data');
    if (stored) {
      allData = JSON.parse(stored);
    } else {
      const response = await fetch('../../Client/case_management_client/data/mock-data.json');
      allData = await response.json();
      localStorage.setItem('lexflow_mock_data', JSON.stringify(allData));
    }

    const urlParams = new URLSearchParams(window.location.search);
    let cnr = urlParams.get('cnr');

    if (!cnr && allData.cases.length > 0) {
      cnr = allData.cases[0].cnr; // fallback
    }

    currentCase = allData.cases.find(c => c.cnr === cnr);
    if (!currentCase) return;

    if (allData.tasks) {
        currentTasks = allData.tasks.filter(t => t.caseCnr === currentCase.cnr);
    }

    // Safety checks for missing fields
    if (!currentCase.timeline) currentCase.timeline = [];
    if (!currentCase.documents) currentCase.documents = [];
    if (!currentCase.client) currentCase.client = { contact: 'Data Pending', type: 'Individual', opposingParty: 'None/Unknown' };
    if (!currentCase.team) {
        const leadUser = allData.users.find(u => u.id === currentCase.assignedAdvocateId) || { name: 'Assigned Lawyer' };
        currentCase.team = [{ id: currentCase.assignedAdvocateId || 'ADM001', name: leadUser.name, role: 'Lead Counsel' }];
    }

    renderHeader();
    renderOverview();
    renderTeam();
    renderClientInfo();
    renderPendingTasks();
    renderTimeline();
    renderDocuments();
    // renderPendingBanner(); // Removed as requested

  } catch (err) {
    console.error('Error loading case details:', err);
  }
}

function formatDate(isoString) {
  if (!isoString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(isoString).toLocaleDateString(undefined, options);
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
        // Yellow Document with X
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

function renderHeader() {
    document.querySelector('.breadcrumb .current').textContent = `Case #${currentCase.cnr}`;
    caseTopTitle.textContent = currentCase.title;
    caseTopSub.textContent = `${currentCase.type} | Opened: ${formatDate(currentCase.filedDate)}`;
    caseTopStatus.textContent = currentCase.status;
    if(currentCase.status === 'Ongoing' || currentCase.status === 'Active') {
        caseTopStatus.style.background = '#d1fae5';
        caseTopStatus.style.color = '#065f46';
    } else {
        caseTopStatus.style.background = '#fef3c7';
        caseTopStatus.style.color = '#92400e';
    }
}

function renderOverview() {
    caseProgPct.textContent = `${currentCase.progress}% Completed`;
    setTimeout(() => {
        caseProgFill.style.width = `${currentCase.progress}%`;
    }, 100);
    renderPhases();
}

function renderPhases() {
    const progress = currentCase.progress || 0;
    const phaseTitle = document.getElementById('phaseTitle');
    const phases = [
        { id: 'phase-1', name: 'Filing', min: 0, max: 20 },
        { id: 'phase-2', name: 'Preparation', min: 21, max: 40 },
        { id: 'phase-3', name: 'Discovery', min: 41, max: 60 },
        { id: 'phase-4', name: 'Mediation', min: 61, max: 80 },
        { id: 'phase-5', name: 'Trial', min: 81, max: 100 }
    ];

    let currentPhase = phases[0];
    phases.forEach((p, idx) => {
        const el = document.getElementById(p.id);
        if (el) {
            if (progress >= p.min) {
                el.style.color = '#3b5bdb';
                el.style.fontWeight = '800';
                currentPhase = { ...p, index: idx + 1 };
            } else {
                el.style.color = '#9ca3af';
                el.style.fontWeight = '700';
            }
        }
    });

    if (phaseTitle) {
        let suffix = "";
        if (currentPhase.name === 'Discovery') suffix = ' & Evidence Collection';
        if (currentPhase.name === 'Filing') suffix = ' & Documentation';
        phaseTitle.textContent = `Phase ${currentPhase.index}: ${currentPhase.name}${suffix}`;
    }
}

function renderTeam() {
    teamContainer.innerHTML = currentCase.team.map(m => `
        <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #eef2ff; color: #3b5bdb; display: flex; align-items:center; justify-content:center; font-size: 11px; font-weight:700;">${(m.name || 'AL').substring(0,2).toUpperCase()}</div>
            <div style="display:flex; flex-direction:column;">
                <span style="font-size:13px; font-weight:700; color:#1a1a2e;">${m.name}</span>
                <span style="font-size:11px; color:#6b7280;">${m.role}</span>
            </div>
        </div>
    `).join('');
}

function renderClientInfo() {
    clientContact.textContent = currentCase.client.contact;
    const clientTypeEl = document.getElementById('clientType');
    if (clientTypeEl) clientTypeEl.textContent = currentCase.client.type;
    opposingParty.textContent = currentCase.client.opposingParty;
}

function renderPendingBanner() {
    const pending = currentTasks.filter(t => t.status === 'Pending');
    const contentArea = document.querySelector('.content');
    
    // Remove existing banner if any
    const existing = document.getElementById('pendingTasksBanner');
    if (existing) existing.remove();

    if (pending.length > 0) {
        const banner = document.createElement('div');
        banner.id = 'pendingTasksBanner';
        banner.className = 'hearing-banner'; // Reuse hearing-banner style but customize
        banner.style.background = '#fffbeb';
        banner.style.border = '1px solid #fde68a';
        banner.style.marginBottom = '24px';
        banner.style.padding = '12px 20px';
        banner.style.cursor = 'pointer';
        banner.onclick = () => document.getElementById('pendingTasksContainer').scrollIntoView({ behavior: 'smooth' });

        banner.innerHTML = `
            <div class="task-status-icon" style="width:32px; height:32px;">
                ${getStatusIcon('Pending')}
            </div>
            <div class="hearing-info">
                <div class="title" style="color: #92400e;">You have ${pending.length} pending tasks for this case</div>
                <div class="sub" style="color: #b45309;">Please review and update the status of these responsibilities.</div>
            </div>
            <div style="margin-left:auto; color:#d97706;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
        `;
        contentArea.prepend(banner);
    }
}

function renderPendingTasks() {
    // Admin sees ALL pending tasks for this case
    const pending = currentTasks.filter(t => t.status === 'Pending');
    pendingCountBadge.textContent = pending.length;
    
    if (pending.length === 0) {
        pendingTasksContainer.innerHTML = `<div style="font-size:12px; color:#9ca3af; padding:12px; text-align:center;">No pending tasks.</div>`;
        return;
    }

    pendingTasksContainer.innerHTML = pending.map(t => {
        return `
            <div style="display:flex; gap:12px; align-items:center; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px; background: #fffaf0; border-left: 4px solid #f59e0b;">
                <div class="task-status-icon" style="width:24px; height:24px; flex-shrink:0;">
                    ${getStatusIcon('Pending')}
                </div>
                <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:13px; font-weight:700; color:#1a1a2e;">${t.name}</span>
                        <span style="font-size:10px; font-weight:700; color:#3b5bdb; background:#eef2ff; padding:2px 6px; border-radius:4px;">${t.assignedUser}</span>
                    </div>
                    <span style="font-size:11px; font-weight:600; color:#92400e; display:flex; align-items:center; gap:4px;">
                        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Due: ${t.dueDate}
                    </span>
                </div>
                <input type="checkbox" style="width:16px; height:16px; cursor:pointer;" onclick="event.stopPropagation(); markTaskAsDone('${t.id}')" />
            </div>
        `;
    }).join('');

    // Add markTaskAsDone helper if not exists
    if (!window.markTaskAsDone) {
        window.markTaskAsDone = (id) => {
            const task = allData.tasks.find(tk => tk.id === id);
            if (task) {
                task.status = 'Completed';
                localStorage.setItem('lexflow_mock_data', JSON.stringify(allData));
                initCaseDetails();
            }
        };
    }
}

function renderTimeline() {
    if(!currentCase.timeline || currentCase.timeline.length === 0) {
        timelineContainer.innerHTML = '<p style="color:#6b7280; font-size:13px; margin:24px;">No timeline events recorded.</p>';
        return;
    }

    timelineContainer.innerHTML = currentCase.timeline.map((t, index) => `
        <div class="timeline-item ${t.grey ? 'grey' : ''}" style="margin-bottom: 32px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                   <div class="t-title" style="font-size:14px; font-weight:700; color:#1a1a2e; display:flex; align-items:center; gap:8px;">
                      ${t.title}
                      <button onclick="editTimelineEvent(${index})" style="background:none;border:none;color:#9ca3af;cursor:pointer;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                      <button onclick="deleteTimelineEvent(${index})" style="background:none;border:none;color:#ef4444;cursor:pointer;"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                   </div>
                   <div style="font-size:12px; color:#6b7280; margin-top:4px; max-width:80%; line-height:1.5;">${t.note || 'Status updated automatically.'}</div>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:10px; font-weight:700; color:#cbd5e1; text-transform:uppercase;">${t.date}</span>
                    ${t.upcoming ? '<div style="margin-top:6px;"><span class="badge-upcoming">UPCOMING</span></div>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ----- Document CRUD Logic -----
function renderDocuments() {
    if(!currentCase.documents) currentCase.documents = [];

    if(currentCase.documents.length === 0) {
        documentsTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color:#9ca3af;">No documents available.</td></tr>`;
        return;
    }

    documentsTbody.innerHTML = currentCase.documents.map((d, index) => {
        let docType = d.type ? d.type.toUpperCase() : 'DOC';
        let docClass = d.type ? d.type.toLowerCase() : 'pdf';
        if(docClass !== 'pdf' && docClass !== 'zip') docClass = 'pdf';

        return `
        <tr>
            <td>
                <div class="doc-name">
                    <div class="doc-icon ${docClass}">${docType}</div>
                    <span>${d.name}</span>
                </div>
            </td>
            <td>${d.date || 'Today'}</td>
            <td>
                <span class="badge-${d.status === 'Reviewing' ? 'reviewing' : 'verified'}">
                    ${d.status || 'Verified'}
                </span>
            </td>
            <td>
                <div style="display:flex; gap: 8px;">
                    <a href="../../Client/case_management_client/legalheir.pdf" download="legalheir.pdf" class="download-btn" title="Download"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/></svg></a>
                    <button class="download-btn" title="Delete Document" onclick="deleteDocument(${index})" style="color:#ef4444;"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// ----- Modal & Data Saving Logic -----
function saveData() {
    // Ensure the main array reflects the modified object
    const caseIndex = allData.cases.findIndex(c => c.cnr === currentCase.cnr);
    if(caseIndex !== -1) {
        allData.cases[caseIndex] = currentCase;
    }
    localStorage.setItem('lexflow_mock_data', JSON.stringify(allData));
    initCaseDetails(); // re-init to refresh topbar correctly if edited
}

window.openModal = function(id) {
    document.getElementById(id).classList.add('active');
};
window.closeModal = function(id) {
    const modal = document.getElementById(id);
    LexValidation.clearAllErrors(modal);
    modal.classList.remove('active');
};

// EXPORT
window.exportCSV = function() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Case ID,Title,Court,Status,Opened\n";
    csvContent += `"${currentCase.cnr}","${currentCase.title}","${currentCase.court}","${currentCase.status}","${currentCase.filedDate}"`;
    
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `case_export_${currentCase.cnr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// EDIT DETAILS MODAL
window.openEditCaseModal = function() {
    document.getElementById('editCaseTitle').value = currentCase.title;
    document.getElementById('editCaseStatus').value = currentCase.status;
    document.getElementById('editCaseProgress').value = currentCase.progress;
    openModal('editCaseModal');
};
window.saveCaseDetailsModal = function() {
    const titleInput = document.getElementById('editCaseTitle');
    const progressInput = document.getElementById('editCaseProgress');
    const modal = document.getElementById('editCaseModal');
    LexValidation.clearAllErrors(modal);

    const rules = [
        { input: titleInput, validator: (v) => LexValidation.validateRequired(v, 'Case title') },
        { input: progressInput, validator: LexValidation.validateProgress },
    ];
    if (!LexValidation.validateForm(rules)) {
        modal.querySelector('.modal-content').classList.add('form-shake');
        setTimeout(() => modal.querySelector('.modal-content').classList.remove('form-shake'), 450);
        return;
    }

    currentCase.title = titleInput.value.trim();
    currentCase.status = document.getElementById('editCaseStatus').value;
    currentCase.progress = parseInt(progressInput.value, 10);
    saveData();
    closeModal('editCaseModal');
};

// DOCUMENTS MODAL
window.addDocumentPrompt = function() {
    document.getElementById('docClientName').value = currentCase.title.split('vs.')[0].trim();
    document.getElementById('docCaseCnr').value = currentCase.cnr;
    document.getElementById('docDescription').value = '';
    document.getElementById('selectedFileName').innerHTML = 'Drag & Drop Files Here or <span style="color:#3b5bdb; text-decoration:underline;">Click to Upload</span>';
    openModal('documentModal');
};
window.saveDocumentModal = function() {
    const typeD = document.getElementById('docTypeSelect').value;
    let name = "New_Document_" + typeD + "." + typeD.toLowerCase(); // fallback name
    
    const fileText = document.getElementById('selectedFileName').innerText;
    if(fileText.includes('Selected:')) {
        name = fileText.replace('Selected:', '').trim();
    }
    
    if(!currentCase.documents) currentCase.documents = [];
    currentCase.documents.push({
        name: name,
        type: typeD,
        date: new Date().toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}),
        status: 'Reviewing'
    });
    saveData();
    closeModal('documentModal');
};
window.deleteDocument = function(index) {
    if(confirm('Are you sure you want to delete this document?')) {
        currentCase.documents.splice(index, 1);
        saveData();
        renderDocuments();
    }
};

// TIMELINE MODALS
window.addTimelineEvent = function() {
    document.getElementById('timelineModalTitle').textContent = 'Add Timeline Event';
    document.getElementById('timelineEditIndex').value = '-1';
    document.getElementById('timelineTitle').value = '';
    document.getElementById('timelineDate').value = '';
    document.getElementById('timelineNotes').value = '';
    document.getElementById('timelineUpcoming').checked = false;
    openModal('timelineModal');
};
window.editTimelineEvent = function(index) {
    const t = currentCase.timeline[index];
    document.getElementById('timelineModalTitle').textContent = 'Edit Timeline Event';
    document.getElementById('timelineEditIndex').value = index;
    document.getElementById('timelineTitle').value = t.title;
    
    let d = new Date(t.date);
    if (!isNaN(d.getTime())) {
       document.getElementById('timelineDate').value = d.toISOString().split('T')[0];
    } else {
       document.getElementById('timelineDate').value = '';
    }
    document.getElementById('timelineNotes').value = t.note || '';
    document.getElementById('timelineUpcoming').checked = !!t.upcoming;
    openModal('timelineModal');
};
window.deleteTimelineEvent = function(index) {
    if(confirm('Delete this event?')) {
        currentCase.timeline.splice(index, 1);
        saveData();
        renderTimeline();
    }
};
window.saveTimelineModal = function() {
    const titleInput = document.getElementById('timelineTitle');
    const dateInput = document.getElementById('timelineDate');
    const modal = document.getElementById('timelineModal');
    LexValidation.clearAllErrors(modal);

    const rules = [
        { input: titleInput, validator: (v) => LexValidation.validateRequired(v, 'Event title') },
        { input: dateInput, validator: (v) => LexValidation.validateDate(v, 'Date') },
    ];
    if (!LexValidation.validateForm(rules)) {
        modal.querySelector('.modal-content').classList.add('form-shake');
        setTimeout(() => modal.querySelector('.modal-content').classList.remove('form-shake'), 450);
        return;
    }

    const idx = parseInt(document.getElementById('timelineEditIndex').value);
    const notes = document.getElementById('timelineNotes').value;
    const upc = document.getElementById('timelineUpcoming').checked;
    
    let formattedDate = new Date(dateInput.value).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});

    const eventObj = {
        title: titleInput.value.trim(),
        date: formattedDate,
        note: notes,
        upcoming: upc
    };

    if(!currentCase.timeline) currentCase.timeline = [];
    
    if(idx >= 0) {
        currentCase.timeline[idx] = eventObj;
    } else {
        currentCase.timeline.unshift(eventObj);
    }
    
    saveData();
    closeModal('timelineModal');
};

// --- Admin Specific Modals ---

// Client Detail Editing
window.openEditClientModal = function() {
    document.getElementById('editClientContact').value = currentCase.client.contact;
    document.getElementById('editClientType').value = currentCase.client.type;
    document.getElementById('editOpposingParty').value = currentCase.client.opposingParty;
    openModal('editClientModal');
};
window.saveClientDetails = function() {
    const contactInput = document.getElementById('editClientContact');
    const modal = document.getElementById('editClientModal');
    LexValidation.clearAllErrors(modal);

    const rules = [
        { input: contactInput, validator: (v) => LexValidation.validateRequired(v, 'Primary contact') },
    ];
    if (!LexValidation.validateForm(rules)) {
        modal.querySelector('.modal-content').classList.add('form-shake');
        setTimeout(() => modal.querySelector('.modal-content').classList.remove('form-shake'), 450);
        return;
    }

    currentCase.client = {
        contact: contactInput.value.trim(),
        type: document.getElementById('editClientType').value,
        opposingParty: document.getElementById('editOpposingParty').value.trim()
    };
    saveData();
    closeModal('editClientModal');
};

// Team Management
window.openEditTeamModal = function() {
    renderEditTeamList();
    const select = document.getElementById('addTeamMemberSelect');
    select.innerHTML = allData.users.filter(u => u.role === 'admin' || u.role === 'lawyer').map(u => 
        `<option value="${u.id}">${u.name}</option>`
    ).join('');
    openModal('editTeamModal');
};
function renderEditTeamList() {
    const list = document.getElementById('editTeamList');
    list.innerHTML = currentCase.team.map((m, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f9fafb; padding:8px 12px; border-radius:6px;">
            <div style="font-size:13px; font-weight:600;">${m.name} <span style="font-weight:400; color:#6b7280;">(${m.role})</span></div>
            <button onclick="removeTeamMember(${idx})" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold;">&times;</button>
        </div>
    `).join('');
}
window.addTeamMember = function() {
    const select = document.getElementById('addTeamMemberSelect');
    const role = document.getElementById('addTeamMemberRole').value || 'Legal Counsel';
    const user = allData.users.find(u => u.id === select.value);
    if(user) {
        currentCase.team.push({ id: user.id, name: user.name, role: role });
        saveData();
        renderEditTeamList();
    }
};
window.removeTeamMember = function(idx) {
    currentCase.team.splice(idx, 1);
    saveData();
    renderEditTeamList();
};

// Global Task Assignment
window.openAddTaskModal = function() {
    const select = document.getElementById('newTaskAssignee');
    select.innerHTML = allData.users.map(u => 
        `<option value="${u.name}">${u.name}</option>`
    ).join('');
    openModal('addTaskModal');
};
window.saveNewTask = function() {
    const nameInput = document.getElementById('newTaskName');
    const dateInput = document.getElementById('newTaskDueDate');
    const modal = document.getElementById('addTaskModal');
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

    const assignee = document.getElementById('newTaskAssignee').value;
    const priority = document.getElementById('newTaskPriority').value;

    const newTask = {
        id: "T-" + (1000 + allData.tasks.length),
        name: nameInput.value.trim(),
        caseTitle: currentCase.title,
        assignedUser: assignee,
        priority: priority,
        dueDate: new Date(dateInput.value).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}),
        status: 'Pending',
        caseCnr: currentCase.cnr
    };

    allData.tasks.push(newTask);
    localStorage.setItem('lexflow_mock_data', JSON.stringify(allData));
    currentTasks.push(newTask);
    saveData();
    closeModal('addTaskModal');
};

// Start
window.addEventListener('DOMContentLoaded', initCaseDetails);
