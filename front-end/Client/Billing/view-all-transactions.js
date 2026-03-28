document.addEventListener('DOMContentLoaded', () => {
    // Current user setup
    const currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
    if (currentUser) {
        document.getElementById('sidebarName').textContent = currentUser.name;
        document.getElementById('sidebarAvatar').textContent = currentUser.avatar || currentUser.name.charAt(0);
    } else {
        document.getElementById('sidebarName').textContent = 'John Doe';
        document.getElementById('sidebarAvatar').textContent = 'JD';
    }

    fetch('../Case_Management/data/mock-data.json')
        .then(res => res.json())
        .then(data => {
            if (data.payments) {
                renderTransactions(data.payments);
            }
        })
        .catch(err => console.error(err));

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    function renderTransactions(payments) {
        const tbody = document.getElementById('allTransactionsList');
        tbody.innerHTML = '';
        
        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#6b7280;">No transactions found.</td></tr>`;
            return;
        }

        payments.forEach(pay => {
            const tr = document.createElement('tr');
            
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
