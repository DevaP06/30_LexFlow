document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    const signUpLink = document.querySelector('.signup-note a');

    if (signUpLink) {
        if (userRole === 'client') {
            signUpLink.href = 'Client Onboarding step1.html';
        } else if (userRole === 'firmAdmin') {
            signUpLink.href = 'LawFirmOnboardingStep1.html';
        }
    }

    // Optional: Update sign-in form action or handle submission
    const signInForm = document.querySelector('form');
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real app, you'd validate credentials here.
            // For now, we just redirect to the appropriate dashboard.
            if (userRole === 'client') {
                window.location.href = 'client-consultation-dashboard.html';
            } else if (userRole === 'firmAdmin') {
                window.location.href = 'firm-consultation-dashboard.html';
            } else {
                window.location.href = 'landing_page.html';
            }
        });
    }

    // Handle cancel button
    const cancelBtn = document.querySelector('.btn-ghost');
    if (cancelBtn) {
        cancelBtn.setAttribute('onclick', "location.href='landing_page.html'");
    }
});
