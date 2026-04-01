// LexFlow Super Admin - Unified Interactions

const SA_Storage = window.LexFlowSuperAdminStorage;
const SA_INVOICE_KEY = 'lexflow_superadmin_invoices';

function initDB() {
    if (!SA_Storage) {
        return {
            firms: [],
            lawyers: [],
            users: [],
            consults: [],
            invoices: [],
            settings: {
                commission_rate: 10,
                support_email: 'support@lexflow.legal',
                maintenance: false,
                disable_signup: false
            }
        };
    }

    let invoices = JSON.parse(localStorage.getItem(SA_INVOICE_KEY) || '[]');
    if (invoices.length === 0) {
        invoices = [
            { id: 'INV-2023-0901', firmId: 'firm-1', firmName: 'JV Ross Associates', client: 'Acme Corp', amount: 250, status: 'pending' },
            { id: 'INV-2023-0902', firmId: 'firm-2', firmName: 'Jenkins Family Law', client: 'John Doe', amount: 150, status: 'paid' }
        ];
        localStorage.setItem(SA_INVOICE_KEY, JSON.stringify(invoices));
    }

    return {
        firms: SA_Storage.getFirms(),
        lawyers: SA_Storage.getLawyers(),
        users: SA_Storage.getUsers(),
        consults: SA_Storage.getConsultations(),
        invoices,
        settings: SA_Storage.getSettings()
    };
}

function saveDB(db) {
    SA_Storage.saveFirms(db.firms);
    SA_Storage.saveLawyers(db.lawyers);
    SA_Storage.saveUsers(db.users);
    SA_Storage.saveConsultations(db.consults);
    SA_Storage.saveSettings(db.settings);
    localStorage.setItem(SA_INVOICE_KEY, JSON.stringify(db.invoices));
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!SA_Storage) {
        console.error('SuperAdminStorage not available');
        return;
    }

    const db = initDB();
    const path = window.location.pathname;

    const masterToggle = document.getElementById('action-toggle');
    if (masterToggle) {
        masterToggle.addEventListener('change', (e) => {
            document.querySelectorAll('.action-select').forEach(check => check.checked = e.target.checked);
        });
    }

    if (path.includes('index.html')) initDashboard(db);
    else if (path.includes('firm-list.html')) initFirmList(db);
    else if (path.includes('firm-edit.html')) initFirmEdit(db);
    else if (path.includes('invoice-list.html')) initInvoiceList(db);
    else if (path.includes('invoice-edit.html')) initInvoiceEdit(db);
    else if (path.includes('lawyer-verification.html')) initLawyerList(db);
    else if (path.includes('lawyer-edit.html')) initLawyerEdit(db);
    else if (path.includes('lawyer-list.html')) initLawyerList(db);
    else if (path.includes('user-list.html')) initUserList(db);
    else if (path.includes('user-edit.html')) initUserEdit(db);
    else if (path.includes('platform-settings.html')) initSettings(db);
    else if (path.includes('consultation-list.html')) initConsultationList(db);
    else if (path.includes('consultation-edit.html')) initConsultationEdit(db);
});

function initDashboard(db) {
    const kpiValues = document.querySelectorAll('.kpi-value');
    if (kpiValues.length >= 4) {
        kpiValues[0].textContent = db.firms.length;
        kpiValues[1].textContent = db.lawyers.length;
        kpiValues[2].textContent = db.users.length;
        kpiValues[3].textContent = db.lawyers.filter(l => (l.status || 'approved') === 'pending').length;
    }

    const pendingLawyers = db.lawyers.filter(l => (l.status || 'approved') === 'pending').length;
    const pendingChip = document.getElementById('pending-chip');
    if (pendingChip) {
        pendingChip.textContent = `${pendingLawyers} Pending`;
        if (pendingLawyers === 0) pendingChip.style.display = 'none';
    }
}

function initFirmList(db) {
    const tbody = document.querySelector('#result_list tbody');
    if (!tbody) return;

    function render() {
        tbody.innerHTML = '';
        db.firms.forEach(firm => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="action-checkbox"><input type="checkbox" name="_selected_action" value="${firm.id}" class="action-select"></td>
                <th class="field-title"><a href="firm-edit.html?id=${firm.id}">${firm.name}</a></th>
            `;
            tbody.appendChild(tr);
        });

        const paginator = document.querySelector('.paginator');
        if (paginator) paginator.textContent = `${db.firms.length} law firms`;
        const counter = document.querySelector('.action-counter');
        if (counter) counter.textContent = `0 of ${db.firms.length} selected`;
    }

    render();

    document.getElementById('run-action-btn')?.addEventListener('click', () => {
        const action = document.getElementById('action-select-dropdown')?.value;
        if (action === 'delete_selected') {
            const selectedIds = Array.from(document.querySelectorAll('.action-select:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) return alert('Select items first.');
            if (confirm(`Are you sure you want to delete ${selectedIds.length} firms?`)) {
                db.firms = db.firms.filter(f => !selectedIds.includes(f.id));
                saveDB(db);
                render();
            }
        }
    });
}

function initFirmEdit(db) {
    const firmId = getQueryParam('id');
    const form = document.getElementById('firm_form');
    const isNew = !firmId;

    if (!form) return;

    if (!isNew) {
        const firm = db.firms.find(f => f.id === firmId);
        if (firm) {
            document.getElementById('id_name').value = firm.name || '';
            document.getElementById('id_admin_user').value = firm.admin || '';
            document.getElementById('id_description').value = firm.description || '';
            document.getElementById('id_reg_no').value = firm.reg_no || '';
            const h1 = document.querySelector('h1');
            if (h1) h1.textContent = `Change law firm: ${firm.name}`;
        }
    } else {
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Add law firm';
        const del = document.querySelector('.deletelink-box');
        if (del) del.style.display = 'none';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const action = e.submitter ? e.submitter.name : '_save';
        const existing = db.firms.find(f => f.id === firmId);

        const newFirm = {
            id: isNew ? `firm-${Date.now()}` : firmId,
            name: document.getElementById('id_name')?.value || '',
            admin: document.getElementById('id_admin_user')?.value || '',
            description: document.getElementById('id_description')?.value || '',
            reg_no: document.getElementById('id_reg_no')?.value || '',
            rating: existing ? existing.rating : 5.0,
            price: existing ? existing.price : 150,
            availability: existing ? existing.availability : 'AVAILABLE'
        };

        if (isNew) db.firms.push(newFirm);
        else {
            const idx = db.firms.findIndex(f => f.id === firmId);
            if (idx >= 0) db.firms[idx] = { ...db.firms[idx], ...newFirm };
        }

        saveDB(db);
        alert('Firm saved successfully.');

        if (action === '_save') window.location.href = 'firm-list.html';
        else if (action === '_addanother') window.location.href = 'firm-edit.html';
        else window.location.reload();
    });

    document.querySelector('.deletelink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this firm?')) {
            db.firms = db.firms.filter(f => f.id !== firmId);
            saveDB(db);
            window.location.href = 'firm-list.html';
        }
    });
}

function initInvoiceList(db) {
    const tbody = document.querySelector('#result_list tbody');
    if (!tbody) return;

    function getStatusBadge(status) {
        if (status === 'pending') return '<span style="color:#f59e0b; font-weight:600;">Pending Payout</span>';
        if (status === 'paid') return '<span style="color:#10b981; font-weight:600;">Paid</span>';
        if (status === 'refunded') return '<span style="color:#ef4444; font-weight:600;">Refunded</span>';
        return status;
    }

    function render() {
        tbody.innerHTML = '';
        db.invoices.forEach(inv => {
            const fee = inv.amount * (db.settings.commission_rate / 100);
            const payout = inv.amount - fee;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="action-checkbox"><input type="checkbox" name="_selected_action" value="${inv.id}" class="action-select"></td>
                <th class="field-title"><a href="invoice-edit.html?id=${inv.id}">${inv.id}</a></th>
                <td>${inv.firmName}</td>
                <td>$${inv.amount.toFixed(2)}</td>
                <td style="color: #10b981; font-weight:600;">$${fee.toFixed(2)}</td>
                <td>$${payout.toFixed(2)}</td>
                <td>${getStatusBadge(inv.status)}</td>
            `;
            tbody.appendChild(tr);
        });
        const paginator = document.querySelector('.paginator');
        if (paginator) paginator.textContent = `${db.invoices.length} invoices`;
    }

    render();

    document.getElementById('run-action-btn')?.addEventListener('click', () => {
        const action = document.getElementById('action-select-dropdown')?.value;
        const selectedIds = Array.from(document.querySelectorAll('.action-select:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return alert('Select invoices first.');

        if (action === 'refund_selected' || action === 'payout_selected') {
            const newStatus = action === 'refund_selected' ? 'refunded' : 'paid';
            db.invoices.forEach(inv => { if (selectedIds.includes(inv.id)) inv.status = newStatus; });
            saveDB(db);
            render();
            alert(`Updated ${selectedIds.length} invoices to ${newStatus}.`);
        }
    });
}

function initInvoiceEdit(db) {
    const invId = getQueryParam('id');
    const form = document.getElementById('firm_form');
    if (!form) return;

    const inv = db.invoices.find(i => i.id === invId);
    if (inv) {
        const fee = inv.amount * (db.settings.commission_rate / 100);
        const payout = inv.amount - fee;
        document.getElementById('id_invoice_no').value = inv.id;
        document.getElementById('id_firm').value = inv.firmName;
        document.getElementById('id_client').value = inv.client;
        document.getElementById('id_amount').value = `$${inv.amount.toFixed(2)}`;
        document.getElementById('id_fee').value = `$${fee.toFixed(2)}`;
        document.getElementById('id_payout').value = `$${payout.toFixed(2)}`;
        document.getElementById('id_status').value = inv.status;
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = `Change invoice: ${inv.id}`;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const action = e.submitter ? e.submitter.name : '_save';
        if (inv) {
            inv.status = document.getElementById('id_status').value;
            saveDB(db);
            alert('Invoice updated successfully.');
            if (action === '_save') window.location.href = 'invoice-list.html';
        }
    });

    document.getElementById('btn-issue-refund')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (inv && confirm(`Are you sure you want to issue a full refund to ${inv.client}?`)) {
            inv.status = 'refunded';
            saveDB(db);
            alert('Refund processed.');
            window.location.reload();
        }
    });
}

function initLawyerList(db) {
    const tbody = document.querySelector('#result_list tbody');
    if (!tbody) return;

    function getStatusBadge(status) {
        if (status === 'pending') return '<span style="color:#a16207; font-weight:600;">Pending Review</span>';
        if (status === 'approved') return '<span style="color:#10b981; font-weight:600;">Active</span>';
        if (status === 'rejected') return '<span style="color:#ef4444; font-weight:600;">Rejected</span>';
        return status;
    }

    function render() {
        tbody.innerHTML = '';
        db.lawyers.forEach(l => {
            const tr = document.createElement('tr');
            if ((l.status || 'approved') === 'pending') tr.style.background = '#fefce8';
            tr.innerHTML = `
                <td class="action-checkbox"><input type="checkbox" name="_selected_action" value="${l.id}" class="action-select"></td>
                <th class="field-title"><a href="lawyer-edit.html?id=${l.id}">${l.name}</a></th>
                <td>${l.bar || 'N/A'}</td>
                <td>${l.practice || (l.specialties ? l.specialties.join(', ') : 'General')}</td>
                <td>${l.date || 'Pending'}</td>
                <td>${getStatusBadge(l.status || 'approved')}</td>
                <td><a href="#" style="color:var(--primary-accent); font-weight:600;">Docs attached</a></td>
            `;
            tbody.appendChild(tr);
        });
    }

    render();

    document.getElementById('run-action-btn')?.addEventListener('click', () => {
        const action = document.getElementById('action-select-dropdown')?.value;
        const selectedIds = Array.from(document.querySelectorAll('.action-select:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return alert('Select lawyers first.');

        if (action === 'approve_selected') {
            db.lawyers.forEach(l => { if (selectedIds.includes(l.id)) l.status = 'approved'; });
            saveDB(db);
            render();
            alert(`Approved ${selectedIds.length} lawyers.`);
        } else if (action === 'reject_selected') {
            db.lawyers.forEach(l => { if (selectedIds.includes(l.id)) l.status = 'rejected'; });
            saveDB(db);
            render();
            alert(`Rejected ${selectedIds.length} lawyers.`);
        }
    });
}

function initLawyerEdit(db) {
    const lwId = getQueryParam('id');
    const isNew = getQueryParam('new');
    const form = document.getElementById('firm_form');
    if (!form) return;

    const l = db.lawyers.find(x => x.id === lwId);
    if (l && !isNew) {
        document.getElementById('id_name_display').innerHTML = `${l.name} (${l.email || 'N/A'})`;
        document.getElementById('id_phone_display').textContent = `Phone: ${l.phone || 'N/A'}`;
        document.getElementById('id_practice_display').innerHTML = `Requested Practice Area: <strong>${l.practice || (l.specialties ? l.specialties.join(', ') : 'General')}</strong>`;
        document.getElementById('id_bar_number').value = l.bar || '';
        document.getElementById('id_status').value = l.status || 'approved';
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = `Verify Lawyer Credentials: ${l.name}`;
    } else if (isNew) {
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Add New Lawyer';
        document.getElementById('id_name_display').innerHTML = '<input type="text" id="id_new_name" placeholder="Name" required style="margin-bottom:10px;">';
        document.getElementById('id_phone_display').innerHTML = '<input type="text" id="id_new_phone" placeholder="Phone" style="margin-bottom:10px;">';
        document.getElementById('id_practice_display').innerHTML = '<input type="text" id="id_new_practice" placeholder="Practice Area" style="margin-bottom:10px;">';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (isNew) {
            const newLawyer = {
                id: `lawyer-${Math.floor(Math.random() * 10000)}`,
                name: document.getElementById('id_new_name').value,
                phone: document.getElementById('id_new_phone').value,
                specialties: [document.getElementById('id_new_practice').value],
                status: 'pending',
                activeCases: 0,
                consultationsToday: 0,
                capacity: 60,
                avatarColor: 'blue'
            };
            db.lawyers.push(newLawyer);
            saveDB(db);
            alert('Lawyer added.');
        } else if (l) {
            l.status = document.getElementById('id_status').value;
            saveDB(db);
            alert(`Lawyer updated. Status is now: ${l.status}`);
        }

        window.location.href = 'lawyer-list.html';
    });

    document.getElementById('btn-reject')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (l) {
            l.status = 'rejected';
            saveDB(db);
            alert('Lawyer rejected.');
            window.location.href = 'lawyer-list.html';
        }
    });
}

function initUserList(db) {
    const tbody = document.querySelector('#result_list tbody');
    if (!tbody) return;

    function render() {
        tbody.innerHTML = '';
        db.users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="action-checkbox"><input type="checkbox" name="_selected_action" value="${u.id}" class="action-select"></td>
                <th class="field-title"><a href="user-edit.html?id=${u.id}">${u.name || u.email || u.id}</a></th>
            `;
            tbody.appendChild(tr);
        });
        const paginator = document.querySelector('.paginator');
        if (paginator) paginator.textContent = `${db.users.length} users`;
    }

    render();

    document.getElementById('run-action-btn')?.addEventListener('click', () => {
        const action = document.getElementById('action-select-dropdown')?.value;
        if (action === 'delete_selected') {
            const selectedIds = Array.from(document.querySelectorAll('.action-select:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) return alert('Select users first.');
            if (confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
                db.users = db.users.filter(u => !selectedIds.includes(u.id));
                saveDB(db);
                render();
            }
        }
    });
}

function initUserEdit(db) {
    const userId = getQueryParam('id');
    const form = document.getElementById('firm_form');
    if (!form) return;

    const isNew = !userId;
    const user = db.users.find(u => u.id === userId);

    if (!isNew && user) {
        document.getElementById('id_name').value = user.name || user.email || '';
        document.getElementById('id_description').value = user.role || '';
        document.getElementById('id_reg_no').value = user.firmId || '';
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = `Change user: ${user.name || user.id}`;
    } else {
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Add user';
        const del = document.querySelector('.deletelink-box');
        if (del) del.style.display = 'none';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const action = e.submitter ? e.submitter.name : '_save';

        const newUser = {
            id: isNew ? `USR-${String(db.users.length + 1).padStart(3, '0')}` : userId,
            name: document.getElementById('id_name').value,
            role: document.getElementById('id_description').value || 'client',
            firmId: document.getElementById('id_reg_no').value || null
        };

        if (isNew) db.users.push(newUser);
        else {
            const idx = db.users.findIndex(u => u.id === userId);
            if (idx >= 0) db.users[idx] = { ...db.users[idx], ...newUser };
        }

        saveDB(db);
        alert('User saved successfully.');

        if (action === '_save') window.location.href = 'user-list.html';
        else if (action === '_addanother') window.location.href = 'user-edit.html';
        else window.location.reload();
    });

    document.querySelector('.deletelink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this user?')) {
            db.users = db.users.filter(u => u.id !== userId);
            saveDB(db);
            window.location.href = 'user-list.html';
        }
    });
}

function initSettings(db) {
    const form = document.getElementById('firm_form');
    if (!form) return;

    document.getElementById('id_comm_rate').value = db.settings.commission_rate;
    document.getElementById('id_support_email').value = db.settings.support_email;
    document.getElementById('id_maintenance').checked = db.settings.maintenance;
    document.getElementById('id_disable_signup').checked = db.settings.disable_signup;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        db.settings.commission_rate = parseFloat(document.getElementById('id_comm_rate').value);
        db.settings.support_email = document.getElementById('id_support_email').value;
        db.settings.maintenance = document.getElementById('id_maintenance').checked;
        db.settings.disable_signup = document.getElementById('id_disable_signup').checked;
        saveDB(db);
        alert('Global Platform Settings saved successfully!');
    });
}

function initConsultationList(db) {
    const tbody = document.querySelector('#result_list tbody');
    if (!tbody) return;

    function render() {
        tbody.innerHTML = '';
        db.consults.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="action-checkbox"><input type="checkbox" name="_selected_action" value="${c.id}" class="action-select"></td>
                <th class="field-title"><a href="consultation-edit.html?id=${c.id}">${c.id}</a></th>
                <td>${c.client || 'Unknown Client'}</td>
                <td>${c.firmId || 'N/A'}</td>
                <td>${c.date || 'N/A'}</td>
                <td><span style="color:#2563eb; font-weight:600;">${c.status || 'upcoming'}</span></td>
            `;
            tbody.appendChild(tr);
        });
        const paginator = document.querySelector('.paginator');
        if (paginator) paginator.textContent = `${db.consults.length} consultations`;
    }

    render();

    document.getElementById('run-action-btn')?.addEventListener('click', () => {
        const action = document.getElementById('action-select-dropdown')?.value;
        const selectedIds = Array.from(document.querySelectorAll('.action-select:checked')).map(cb => cb.value);
        if (selectedIds.length === 0) return alert('Select items first.');

        if (action === 'delete_selected') {
            if (confirm(`Are you sure you want to delete ${selectedIds.length} consultations?`)) {
                db.consults = db.consults.filter(c => !selectedIds.includes(c.id));
                saveDB(db);
                render();
            }
        }
    });
}

function initConsultationEdit(db) {
    const consId = getQueryParam('id');
    const form = document.getElementById('firm_form');
    if (!form) return;

    const isNew = !consId;
    const cons = db.consults.find(c => c.id === consId);

    if (!isNew && cons) {
        document.getElementById('id_name').value = cons.client || '';
        document.getElementById('id_description').value = cons.status || 'upcoming';
        document.getElementById('id_reg_no').value = cons.date || '';
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = `Change Consultation: ${cons.id}`;
    } else {
        const h1 = document.querySelector('h1');
        if (h1) h1.textContent = 'Add Consultation';
        const del = document.querySelector('.deletelink-box');
        if (del) del.style.display = 'none';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const action = e.submitter ? e.submitter.name : '_save';

        const newCons = {
            id: isNew ? `CONS-${Date.now()}` : consId,
            client: document.getElementById('id_name').value,
            status: document.getElementById('id_description').value,
            date: document.getElementById('id_reg_no').value,
            firmId: 'firm-1',
            lawyerId: 'lawyer-1'
        };

        if (isNew) db.consults.push(newCons);
        else {
            const idx = db.consults.findIndex(c => c.id === consId);
            if (idx >= 0) db.consults[idx] = newCons;
        }

        saveDB(db);
        alert('Consultation saved successfully.');

        if (action === '_save') window.location.href = 'consultation-list.html';
        else window.location.reload();
    });

    document.querySelector('.deletelink')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this consultation?')) {
            db.consults = db.consults.filter(c => c.id !== consId);
            saveDB(db);
            window.location.href = 'consultation-list.html';
        }
    });
}
