document.addEventListener('DOMContentLoaded', () => {
    // Re-bind booking buttons
    const bookingOverlay = document.getElementById('modal-overlay');
    const newOpenBtns = [
        document.getElementById('btn-book-firm-1'),
        document.getElementById('btn-book-firm-2'),
        document.getElementById('btn-book-firm-3')
    ];
    
    newOpenBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                bookingOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });
    
    // Re-bind view profile buttons
    const pOverlay = document.getElementById('profile-overlay');
    const newProfileBtns = [
        document.getElementById('btn-view-firm-1'),
        document.getElementById('btn-view-firm-2'),
        document.getElementById('btn-view-firm-3')
    ];
    
    newProfileBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                pOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
    });

    // We also need bindings for cancel/close inside the modals in case the dashboard.js doesn't catch them
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const bookingForm = document.getElementById('booking-form');
    
    const closeBookingOverlay = () => {
        bookingOverlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // or empty string
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeBookingOverlay);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeBookingOverlay);
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Consultation Hooked Successfully! (Mock)');
            closeBookingOverlay();
        });
    }

    // Profile Overlay Back button
    const defaultProfileClose = document.getElementById('profile-back-btn');
    if (defaultProfileClose) {
        defaultProfileClose.addEventListener('click', () => {
            pOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Profile Overlay Book button -> Closes profile, opens booking
    const defaultProfileBook = document.getElementById('profile-book-btn');
    if (defaultProfileBook) {
        defaultProfileBook.addEventListener('click', () => {
            pOverlay.classList.remove('active');
            bookingOverlay.classList.add('active');
            // keep overflow hidden since we go from modal to modal
        });
    }

    // Navigation Pills Selection
    const pillBtns = document.querySelectorAll('.pill-btn');
    pillBtns.forEach(pill => {
        pill.addEventListener('click', () => {
            pillBtns.forEach(p => p.classList.remove('active-pill'));
            pill.classList.add('active-pill');
        });
    });

    // Search Trigger (Mock)
    const triggerSearchBtn = document.getElementById('trigger-search');
    const keywordSearch = document.getElementById('keyword-search');
    const searchResults = document.getElementById('search-results');
    
    if (triggerSearchBtn && keywordSearch && searchResults) {
        triggerSearchBtn.addEventListener('click', () => {
            const keyword = keywordSearch.value;
            console.log('Searching for:', keyword);
            
            // Highlight the results area to mock loading
            searchResults.style.opacity = '0.5';
            setTimeout(() => {
                searchResults.style.opacity = '1';
            }, 300);
        });
    }
});
