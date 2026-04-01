document.addEventListener('DOMContentLoaded', () => {
    // 1. Ensure storage is initialized
    if (!localStorage.getItem('lexflow_consultations')) {
        console.log('[Dashboard] Initializing storage...');
        initStorage();
        // Give it a moment to load
        setTimeout(() => refreshAll(), 100);
    } else {
        // 2. Initial Render
        refreshAll();
    }

    // 3. Global Event Listeners
    document.addEventListener('click', (e) => {
        const btnJoin = e.target.closest('.btn-join');
        const btnCancel = e.target.closest('.btn-cancel');
        const btnAccept = e.target.closest('.btn-accept');
        const btnReject = e.target.closest('.btn-reject');

        if (btnJoin) {
            const id = btnJoin.dataset.id;
            sessionStorage.setItem('active_cons_id', id);
            window.location.href = 'lawyer-join-consultation-interface.html';
        }

        if (btnCancel || btnReject) {
            const id = btnCancel ? btnCancel.dataset.id : btnReject.dataset.id;
            if (confirm('Are you sure you want to cancel/reject this request?')) {
                LexFlowStorage.updateConsultation(id, { status: 'CANCELLED' });
                refreshAll();
            }
        }

        if (btnAccept) {
            handleAccept(btnAccept.dataset.id);
        }
    });

    /**
     * Handles the lawyer assignment and consultation acceptance
     */
    function handleAccept(consId) {
        const select = document.getElementById(`assign-lawyer-${consId}`);
        const lawyerId = select.value;
        
        if (!lawyerId) {
            alert('Please assign a lawyer before accepting.');
            return;
        }

        const lawyer = LexFlowStorage.getLawyerById(lawyerId);
        if (!lawyer) return;

        // Update Consultation
        LexFlowStorage.updateConsultation(consId, {
            status: 'CONFIRMED',
            lawyerId: lawyer.id,
            lawyerName: lawyer.name
        });

        // Update Lawyer Workload
        LexFlowStorage.updateLawyer(lawyer.id, {
            activeCases: lawyer.activeCases + 1,
            capacity: Math.min(100, Math.floor(((lawyer.activeCases + 1) / 10) * 100))
        });

        // Log entry simulation
        console.log(`[LOG] Consultation ${consId} accepted. Assigned to: ${lawyer.name}`);
        
        refreshAll();
        alert(`Consultation ${consId} successfully assigned to ${lawyer.name}. Status updated in logs.`);
    }

    /**
     * Refreshes all dashboard sections
     */
    function refreshAll() {
        renderStats();
        renderIncomingRequests();
        renderActiveConsultations();
        renderLawyerAvailability();
    }

    /**
     * Updates the top stats metrics
     */
    function renderStats() {
        const allCons = LexFlowStorage.getConsultations();
        const pending = allCons.filter(c => c.status === 'PENDING').length;
        const active = allCons.filter(c => ['SCHEDULED', 'CONFIRMED', 'TODAY', 'IN PROGRESS'].includes(c.status)).length;
        const completed = allCons.filter(c => c.status === 'COMPLETED').length;

        const statPending = document.querySelector('#stat-pending .stat-card-value');
        const statActive = document.querySelector('#stat-active .stat-card-value');
        const statCompleted = document.querySelector('#stat-completed .stat-card-value');

        if (statPending) statPending.textContent = pending;
        if (statActive) statActive.textContent = active;
        if (statCompleted) statCompleted.textContent = completed;
    }

    /**
     * Renders new consultation requests awaiting assignment
     */
    function renderIncomingRequests() {
        const requestsGrid = document.querySelector('.requests-grid');
        if (!requestsGrid) return;

        const pending = LexFlowStorage.getConsultations().filter(c => c.status === 'PENDING');
        const lawyers = LexFlowStorage.getLawyers();

        requestsGrid.innerHTML = '';
        
        if (pending.length === 0) {
            requestsGrid.innerHTML = `
                <div class="no-data-notice" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #f9fafb; border-radius: 12px; border: 2px dashed #e5e7eb;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" style="margin-bottom: 12px;">
                        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p style="color: #6b7280; font-weight: 500;">No pending requests at the moment.</p>
                </div>
            `;
            return;
        }

        pending.forEach(req => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <div class="request-top">
                    <div class="request-client-row">
                        <div class="request-avatar ${req.avatarClass || 'blue'}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div class="request-client-info">
                            <span class="request-client-name">${req.clientName}</span>
                            <span class="request-client-type">Individual</span>
                        </div>
                        <span class="badge badge-pending">PENDING</span>
                    </div>
                    <div class="request-meta">
                        <div class="request-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>${req.date}</span>
                        </div>
                        <div class="request-meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            <span>${req.type}</span>
                        </div>
                    </div>
                    <p class="request-subject">${req.id}: New consultation request received.</p>
                </div>
                <div class="request-actions">
                    <div class="assign-dropdown">
                        <select id="assign-lawyer-${req.id}" class="assign-select">
                            <option value="">Assign Lawyer</option>
                            ${lawyers.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-accept" data-id="${req.id}">Accept</button>
                    <button class="btn btn-reject" data-id="${req.id}">Reject</button>
                </div>
            `;
            requestsGrid.appendChild(card);
        });
    }

    /**
     * Renders the table of ongoing consultations
     */
    function renderActiveConsultations() {
        const tableBody = document.querySelector('#active-consultations-table tbody');
        if (!tableBody) return;

        const activeCons = LexFlowStorage.getConsultations().filter(c => ['SCHEDULED', 'CONFIRMED', 'TODAY', 'IN PROGRESS'].includes(c.status));

        tableBody.innerHTML = '';
        
        if (activeCons.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; color: #6b7280;">No active consultations.</td></tr>';
            return;
        }

        activeCons.forEach(cons => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="#" class="link-id">${cons.id}</a></td>
                <td>
                    <div class="table-client">
                        <span class="table-client-name">${cons.clientName}</span>
                        <span class="table-client-type">Client</span>
                    </div>
                </td>
                <td>
                    <div class="table-lawyer">
                        <div class="table-lawyer-dot ${cons.lawyerId ? 'green' : 'yellow'}"></div>
                        <span>${cons.lawyerName || 'Unassigned'}</span>
                    </div>
                </td>
                <td>${cons.type}</td>
                <td>${cons.date} · ${cons.time}</td>
                <td><span class="mode-badge mode-chat">Chat</span></td>
                <td><span class="status-badge status-${cons.status.toLowerCase()}">${cons.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary btn-join" data-id="${cons.id}">Join Call</button>
                        <button class="btn btn-sm btn-outline btn-cancel" data-id="${cons.id}">Cancel</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Renders lawyer profile cards with workload visibility
     */
    function renderLawyerAvailability() {
        const lawyersGrid = document.querySelector('.lawyers-grid');
        if (!lawyersGrid) return;

        const lawyers = LexFlowStorage.getLawyers();
        lawyersGrid.innerHTML = '';

        lawyers.forEach(l => {
            const card = document.createElement('div');
            card.className = 'lawyer-card';
            const statusClass = l.capacity > 80 ? 'busy' : 'available';
            
            card.innerHTML = `
                <div class="lawyer-card-top">
                    <div class="lawyer-card-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div class="lawyer-card-info">
                        <h3>${l.name}</h3>
                        <span class="lawyer-card-spec">${l.specialties.join(' · ')}</span>
                    </div>
                    <span class="badge badge-${statusClass}">${statusClass.toUpperCase()}</span>
                </div>
                <div class="lawyer-workload">
                    <div class="workload-row">
                        <span class="workload-label">Active Cases</span>
                        <span class="workload-value">${l.activeCases}</span>
                    </div>
                    <div class="workload-row">
                        <span class="workload-label">Consultations Today</span>
                        <span class="workload-value">${l.consultationsToday}</span>
                    </div>
                    <div class="workload-bar-wrapper">
                        <div class="workload-bar ${l.capacity > 80 ? 'high' : ''}" style="width: ${l.capacity}%;"></div>
                    </div>
                    <span class="workload-capacity">${l.capacity}% Capacity</span>
                </div>
            `;
            lawyersGrid.appendChild(card);
        });
    }
});
