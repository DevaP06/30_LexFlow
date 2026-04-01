/**
 * Sidebar Utilities
 * Handles sidebar user profile display and logout functionality
 */

(function() {
    'use strict';

    function initSidebar() {
        // Update user profile display
        const userNameEl = document.getElementById('sidebar-user-name');
        const userRoleEl = document.getElementById('sidebar-user-role');
        
        if (userNameEl && userRoleEl) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name": "User", "role": "Guest"}');
            const roleLabels = { client: 'Client', firmAdmin: 'Firm Admin', lawyer: 'Lawyer' };
            userNameEl.textContent = currentUser.fullName || currentUser.name || 'User';
            userRoleEl.textContent = roleLabels[currentUser.role] || currentUser.role || 'Guest';
        }

        // Setup logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('userRole');
                    sessionStorage.removeItem('clientDraft');
                    sessionStorage.removeItem('active_cons_id');
                    window.location.href = 'index.html';
                }
            });
        }

        // Mark active nav item
        markActiveNavItem();
    }

    function markActiveNavItem() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.sidebar-nav a');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (currentPath.includes(href)) {
                item.classList.add('active');
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

})();
