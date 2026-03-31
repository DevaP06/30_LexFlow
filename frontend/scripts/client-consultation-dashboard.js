/* ---- Book Consultation Modal ---- */
const overlay = document.getElementById('modal-overlay');
const openBtns = [];
const closeBtns = [
    document.getElementById('modal-close-btn'),
    document.getElementById('modal-cancel-btn')
];

const bookConsultationBtn = document.getElementById('btn-book-consultation');
if (bookConsultationBtn) {
    bookConsultationBtn.addEventListener('click', () => {
        window.location.href = 'client-law_firm-search.html';
    });
}

function openBookingModal() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeBookingModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

openBtns.forEach(btn => btn && btn.addEventListener('click', openBookingModal));
closeBtns.forEach(btn => btn && btn.addEventListener('click', closeBookingModal));
if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBookingModal(); });
}

// Consultation type toggle
document.querySelectorAll('.type-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.type-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    });
});

// Time slot toggle
document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
    });
});

// Calendar day toggle
document.querySelectorAll('.cal-day').forEach(day => {
    day.addEventListener('click', () => {
        document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
    });
});

// Prevent form submit (demo)
const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Consultation booked successfully!');
        closeBookingModal();
    });
}

/* ---- View Profile Overlay ---- */
const profileOverlay = document.getElementById('profile-overlay');
const profileViewBtns = [];

function openProfile() {
    profileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeProfile() {
    profileOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

profileViewBtns.forEach(btn => btn && btn.addEventListener('click', openProfile));
const profileBackBtn = document.getElementById('profile-back-btn');
if (profileBackBtn) {
     profileBackBtn.addEventListener('click', closeProfile);
}

if (profileOverlay) {
    profileOverlay.addEventListener('click', (e) => { if (e.target === profileOverlay) closeProfile(); });
}

// "Book Consultation" inside profile -> close profile, open booking modal
const profileBookBtn = document.getElementById('profile-book-btn');
if (profileBookBtn) {
    profileBookBtn.addEventListener('click', () => {
        closeProfile();
        setTimeout(openBookingModal, 200);
    });
}

// "Join Meeting" redirect logic for Client Dashboard
const btnJoin1 = document.getElementById('btn-join-1');
const btnJoin2 = document.getElementById('btn-join-2');

if (btnJoin1) {
    btnJoin1.addEventListener('click', () => {
        window.location.href = 'client-join-consultation-interface.html';
    });
}
if (btnJoin2) {
    btnJoin2.addEventListener('click', () => {
        window.location.href = 'client-join-consultation-interface.html';
    });
}
