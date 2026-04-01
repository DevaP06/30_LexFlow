document.addEventListener('DOMContentLoaded', async () => {
    'use strict';

    // Seed data if not already done
    await StorageService.seed('../data/initialData.json');

    const signInForm = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('button[type="submit"]');

    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                _showToast('Please enter both email and password.', 'error');
                return;
            }

            // Show loading state
            loginBtn.classList.add('btn-loading');

            // Simulate small delay for better UX
            setTimeout(() => {
                const result = AuthService.login(email, password);

                if (result.success) {
                    _showToast('Welcome back, ' + result.user.fullName + '!');
                    
                    setTimeout(() => {
                        if (result.user.role === 'client') {
                            window.location.href = 'client-consultation-dashboard.html';
                        } else if (result.user.role === 'firmAdmin') {
                            window.location.href = 'firm-consultation-dashboard.html';
                        } else {
                            window.location.href = 'landing_page.html';
                        }
                    }, 800);
                } else {
                    loginBtn.classList.remove('btn-loading');
                    _showToast(result.error, 'error');
                }
            }, 500);
        });
    }

    // Handle cancel button
    const cancelBtn = document.querySelector('.btn-ghost');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'landing_page.html';
        });
    }

    function _showToast(msg, type = 'success') {
        const existing = document.querySelector('.lexflow-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'lexflow-toast' + (type === 'error' ? ' toast-error' : '');
        toast.textContent = msg;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
