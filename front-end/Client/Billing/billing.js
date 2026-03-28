document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup User Profile in Sidebar
    const currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
    if (currentUser) {
        document.getElementById('sidebarName').textContent = currentUser.name;
        document.getElementById('sidebarAvatar').textContent = currentUser.avatar || currentUser.name.charAt(0);
    } else {
        document.getElementById('sidebarName').textContent = 'John Doe';
        document.getElementById('sidebarAvatar').textContent = 'JD';
    }

    let allInvoices = [];
    let allPayments = [];
    let currentFilter = 'All';

    // 2. Fetch Data
    fetch('../Case_Management/data/mock-data.json')
        .then(res => res.json())
        .then(data => {
            if (data.invoices) allInvoices = data.invoices;
            if (data.payments) allPayments = data.payments;
            
            calculateSummaries();
            renderInvoices();
            renderPayments();
        })
        .catch(err => console.error('Error loading billing data:', err));

    // 3. Summaries
    function calculateSummaries() {
        let totalBilled = 0;
        let totalPaid = 0;
        let pending = 0;
        let overdue = 0;

        allInvoices.forEach(inv => {
            totalBilled += inv.amount;
            if (inv.status === 'Paid') totalPaid += inv.amount;
            else if (inv.status === 'Pending') pending += inv.amount;
            else if (inv.status === 'Overdue') overdue += inv.amount;
        });

        // Add additional payments if not tracked by invoices exactly (for demo purposes)
        if(totalPaid === 0 && allPayments.length > 0) {
            allPayments.forEach(p => totalPaid += p.amountPaid);
        }

        const formatCurrency = (val) => '$' + val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        document.getElementById('valTotalBilled').textContent = formatCurrency(totalBilled);
        document.getElementById('valTotalPaid').textContent = formatCurrency(totalPaid);
        document.getElementById('valPending').textContent = formatCurrency(pending);
        document.getElementById('valOverdue').textContent = formatCurrency(overdue);
    }

    // 4. Render Invoices
    const searchInput = document.getElementById('searchInvoiceInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('input', () => renderInvoices());

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderInvoices();
        });
    });

    function getProximityColorClass(dueDateStr, status) {
        if (status === 'Paid') return 'due-green';
        
        const due = new Date(dueDateStr);
        const today = new Date(); // Using actual current date
        
        const diffMs = due - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'due-red';
        if (diffDays <= 14) return 'due-yellow';
        return 'due-green';
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    function renderInvoices() {
        const query = searchInput.value.toLowerCase().trim();
        const tbody = document.getElementById('invoicesList');
        tbody.innerHTML = '';

        const filtered = allInvoices.filter(inv => {
            const matchFilter = currentFilter === 'All' || inv.status === currentFilter;
            const matchSearch = inv.id.toLowerCase().includes(query) || inv.caseName.toLowerCase().includes(query);
            return matchFilter && matchSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#6b7280;">No invoices found.</td></tr>`;
            return;
        }

        filtered.forEach(inv => {
            const tr = document.createElement('tr');
            
            const badgeClass = inv.status === 'Paid' ? 'badge-paid' : 
                               inv.status === 'Pending' ? 'badge-pending' : 'badge-overdue';
            
            const dueColor = getProximityColorClass(inv.dueDate, inv.status);
            
            let actionsHtml = '';
            if (inv.status !== 'Paid') {
                actionsHtml += `<button class="btn-pay-now" onclick="window.location.href='pay-now.html?id=${encodeURIComponent(inv.id)}'">Pay Now</button>`;
            }
            
            // Eye icon for viewing image.png
            actionsHtml += `
                <button class="icon-btn" title="View details" onclick="window.open('image.png', '_blank')">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
            `;
            // Download icon for downloading image.png
            actionsHtml += `
                <a href="image.png" download="Invoice_${inv.id}.png" class="icon-btn" title="Download invoice">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </a>
            `;

            tr.innerHTML = `
                <td><a href="#" class="dt-id" onclick="window.open('image.png', '_blank')">${inv.id}</a></td>
                <td>
                    <div style="font-weight:600;">${inv.caseName}</div>
                </td>
                <td style="color:#6b7280;">${inv.lawFirm}</td>
                <td style="font-weight:700; color:#1a1a2e;">$${inv.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td><span class="badge-status ${badgeClass}">${inv.status}</span></td>
                <td class="${dueColor}" style="font-weight:600;">
                    ${formatDate(inv.dueDate)}
                </td>
                <td class="action-cell">
                    ${actionsHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 5. Render Payments
    function renderPayments() {
        const tbody = document.getElementById('paymentHistoryList');
        tbody.innerHTML = '';
        
        if (allPayments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280;">No payment history.</td></tr>`;
            return;
        }

        // Just show top 2-3 recent for main board
        const recentPayments = allPayments.slice(0, 3);

        recentPayments.forEach(pay => {
            const tr = document.createElement('tr');
            
            // simple check for card vs bank
            const isBank = pay.paymentMethod.toLowerCase().includes('bank');
            const iconSvg = isBank ? 
                `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>` : 
                `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>`;

            tr.innerHTML = `
                <td style="font-weight:600; color:#1a1a2e;">${pay.id}</td>
                <td><a href="#" class="dt-id" onclick="window.open('image.png', '_blank')">${pay.invoiceId}</a></td>
                <td style="font-weight:700; color:#1a1a2e;">$${pay.amountPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td style="color:#6b7280;">${formatDate(pay.paymentDate)}</td>
                <td>
                    <div class="pay-method">
                        ${iconSvg} ${pay.paymentMethod}
                    </div>
                </td>
                <td><span class="badge-status badge-completed">${pay.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

});
