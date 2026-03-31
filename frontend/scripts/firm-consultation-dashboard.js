document.addEventListener('DOMContentLoaded', () => {

    /* ---- Sidebar Navigation Active State ---- */
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Prevent default if it's an empty link
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
            }
            // Remove active class from all
            navItems.forEach(n => n.classList.remove('active'));
            // Add to clicked
            item.classList.add('active');
        });
    });

    /* ---- Incoming Requests Actions ---- */
    // Helper function to handle card removal
    const handleRequestAction = (btnIdPrefix, actionName) => {
        const buttons = document.querySelectorAll(`[id^="${btnIdPrefix}"]`);
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.request-card');
                const dropdown = card.querySelector('.assign-select');
                
                if (actionName === 'Accepted' && dropdown && dropdown.value === '') {
                    alert('Please assign a lawyer before accepting the request.');
                    dropdown.focus();
                    return;
                }

                const clientName = card.querySelector('.request-client-name').textContent;
                
                // Add fade out animation class, then remove
                card.style.opacity = '1';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    card.remove();
                    // Optional: show a toast/alert
                    console.log(`Request from ${clientName} was ${actionName.toLowerCase()}.`);
                }, 300);
            });
        });
    };

    handleRequestAction('btn-accept-', 'Accepted');
    handleRequestAction('btn-reject-', 'Rejected');

    /* ---- Active Consultations Table Actions ---- */
    // View Details Button
    document.querySelectorAll('[id^="btn-view-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const id = row.querySelector('.link-id').textContent;
            alert(`Viewing details for ${id}`);
        });
    });

    // Reschedule Button
    document.querySelectorAll('[id^="btn-reschedule-"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const id = row.querySelector('.link-id').textContent;
            alert(`Reschedule flow triggered for ${id}`);
        });
    });

    /* ---- Active Dropdown Styling ---- */
    const assignSelects = document.querySelectorAll('.assign-select');
    assignSelects.forEach(select => {
        select.addEventListener('change', () => {
            if (select.value !== '') {
                select.style.borderColor = 'var(--brand-accent)';
                select.style.color = 'var(--text-primary)';
                select.style.fontWeight = '500';
            } else {
                select.style.borderColor = 'var(--border-light)';
                select.style.color = 'var(--text-secondary)';
                select.style.fontWeight = 'normal';
            }
        });
    });

    /* ---- Logout Action ---- */
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                // Here you would handle actual logout logic via backend/auth
                alert('Logging out...');
            }
        });
    }

    /* ---- Join Video Call Redirection ---- */
    const joinBtns = document.querySelectorAll('[id^="btn-join-"]');
    joinBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'lawyer-join-consultation-interface.html';
        });
    });

});
