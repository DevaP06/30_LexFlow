document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Render
    renderConsultations();

    // 2. Elements
    const btnBookCons = document.getElementById('btn-book-consultation');
    if (btnBookCons) {
        btnBookCons.addEventListener('click', () => {
            window.location.href = 'client-law_firm-search.html';
        });
    }

    // 3. Rendering Functions
    function renderConsultations() {
        const allCons = LexFlowStorage.getConsultations();
        const scheduledGrid = document.querySelector('.scheduled-grid');
        const pastTableBody = document.querySelector('#past-consultations-table tbody');
        
        if (scheduledGrid) {
            scheduledGrid.innerHTML = '';
            const activeCons = allCons.filter(c => c.status === 'SCHEDULED' || c.status === 'CONFIRMED' || c.status === 'TODAY');
            
            if (activeCons.length === 0) {
                scheduledGrid.innerHTML = '<p class="no-data">No upcoming consultations.</p>';
            } else {
                activeCons.forEach(cons => {
                    const card = document.createElement('div');
                    card.className = 'consultation-card';
                    card.id = `consultation-card-${cons.id}`;
                    card.innerHTML = `
                        <div class="card-top-row">
                            <div class="card-avatar ${cons.avatarClass || 'blue'}">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <div class="card-info">
                                <div class="card-badges">
                                    <span class="badge badge-id">${cons.id}</span>
                                    <span class="badge badge-${cons.status.toLowerCase()}">${cons.status}</span>
                                </div>
                                <h3 class="card-lawyer-name">${cons.lawyerName}</h3>
                                <span class="card-firm-detail">${cons.firmName} • ${cons.type.charAt(0).toUpperCase() + cons.type.slice(1)}</span>
                            </div>
                            <div class="card-date-block">
                                <span class="card-date">${cons.date}</span>
                                <span class="card-time">${cons.time}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-primary btn-join" data-id="${cons.id}">Consultation</button>
                            <button class="btn btn-outline" data-id="${cons.id}">View Details</button>
                            <button class="btn btn-ghost btn-reschedule" data-id="${cons.id}">Reschedule</button>
                            <button class="btn btn-cancel-text btn-cancel" data-id="${cons.id}">Cancel</button>
                        </div>
                    `;
                    scheduledGrid.appendChild(card);
                });
            }
        }

        if (pastTableBody) {
            pastTableBody.innerHTML = '';
            const pastCons = allCons.filter(c => c.status === 'COMPLETED' || c.status === 'CANCELLED');
            
            if (pastCons.length === 0) {
                pastTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No past history found.</td></tr>';
            } else {
                pastCons.forEach(cons => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><a href="#" class="link-id">${cons.id}</a></td>
                        <td>${cons.lawyerName}</td>
                        <td>Legal Advice</td>
                        <td>${cons.date}</td>
                        <td>${cons.time.includes('min') ? cons.time : '30 min'}</td>
                        <td><span class="status-badge status-${cons.status.toLowerCase()}">${cons.status}</span></td>
                        <td><a href="#" class="link-action">View Summary</a></td>
                    `;
                    pastTableBody.appendChild(row);
                });
            }
        }
    }

    // 4. Global Event Listeners
    document.addEventListener('click', (e) => {
        const btnJoin = e.target.closest('.btn-join');
        const btnCancel = e.target.closest('.btn-cancel');
        const btnReschedule = e.target.closest('.btn-reschedule');

        if (btnJoin) {
            const id = btnJoin.dataset.id;
            sessionStorage.setItem('active_cons_id', id);
            window.location.href = 'client-join-consultation-interface.html';
        }

        if (btnCancel) {
            const id = btnCancel.dataset.id;
            if (confirm('Are you sure you want to cancel this consultation?')) {
                LexFlowStorage.updateConsultation(id, { status: 'CANCELLED' });
                renderConsultations();
            }
        }

        if (btnReschedule) {
            const id = btnReschedule.dataset.id;
            alert('Rescheduling feature coming soon! For now, please cancel and book again.');
        }
    });

    // 5. Modal Logic (re-implementing from original for completeness)
    const overlay = document.getElementById('modal-overlay');
    const closeBtns = [
        document.getElementById('modal-close-btn'),
        document.getElementById('modal-cancel-btn')
    ];
    
    function closeBookingModal() {
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    closeBtns.forEach(btn => btn && btn.addEventListener('click', closeBookingModal));
    if (overlay) {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBookingModal(); });
    }
});
