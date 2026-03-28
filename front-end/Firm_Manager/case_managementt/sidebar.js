/**
 * Global Sidebar Toggle System
 * Handles collapsed/expanded states natively across all pages.
 */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    
    // 1. Initialize from LocalStorage
    const isCollapsed = localStorage.getItem('lexflow_sidebar_collapsed') === 'true';
    if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    // 2. Toggle Handler
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            
            // Persist the state
            const nowCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('lexflow_sidebar_collapsed', nowCollapsed);
            
            // Trigger a resize event to layout tables/components if needed
            window.dispatchEvent(new Event('resize'));
        });
    }

    // 3. Optional: Sync user profile if not handled by page JS
    // Ensure all sidebar names use IDs consistent with our templates
    const storedUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
    if (storedUser) {
        const nameEl = document.getElementById('sidebarName');
        const avatarEl = document.getElementById('sidebarAvatar');
        if (nameEl) nameEl.textContent = storedUser.name;
        if (avatarEl) avatarEl.textContent = storedUser.avatar || storedUser.name.charAt(0);
    }
});
