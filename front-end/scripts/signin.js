document.addEventListener('DOMContentLoaded', async () => {
    'use strict';

    // Seed data if not already done
    await StorageService.seed('../data/initialData.json');

    const signInForm = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('button[type="submit"]');


    const signUpLink = document.querySelector('.signup-note a');
    const userRole = localStorage.getItem('userRole');

    if (signUpLink) {
        if (userRole === 'client') {
            signUpLink.href = 'Client%20Onboarding%20step1.html';
        } else {
            signUpLink.href = 'LawFirmOnboardingStep1.html';
        }
    }
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
                    _showToast('Welcome back, ' + (result.user.fullName || result.user.name || 'User') + '!');
                    // Sync userRole to actual role so sidebar renders correctly
                    localStorage.setItem('userRole', result.user.role);

                    setTimeout(() => {
                        const roleRedirects = {
                            client: 'client-consultation-dashboard.html',
                            firmAdmin: 'firm-consultation-dashboard.html',
                            lawyer: 'firm-consultation-dashboard.html',
                            intern: 'firm-consultation-dashboard.html',
                            superAdmin: '../super admin/index.html'
                        };

                        const redirectPath = roleRedirects[result.user.role] || 'SignIn.html';
                        window.location.href = redirectPath;
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
            window.location.href = '../index.html';
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
