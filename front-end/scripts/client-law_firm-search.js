document.addEventListener('DOMContentLoaded', async () => {
    // 0. Initialize storage if needed
    if (!localStorage.getItem('lexflow_firms') || !localStorage.getItem('lexflow_consultations')) {
        console.log('[Find Firm] Initializing storage...');
        await initStorage();
    }
    
    // 1. Initial Render
    renderFirms();

    // 2. Elements
    const keywordSearch = document.getElementById('keyword-search');
    const locationSelect = document.getElementById('location-select');
    const practiceSelect = document.getElementById('practice-area-select');
    const triggerSearchBtn = document.getElementById('trigger-search');
    
    // 3. Search & Filter Logic
    function handleSearch() {
        const keyword = keywordSearch.value.toLowerCase();
        const loc = locationSelect.value.toLowerCase();
        const practice = practiceSelect.value.toLowerCase();
        
        const allFirms = LexFlowStorage.getFirms();
        const filtered = allFirms.filter(f => {
            const matchKeyword = f.name.toLowerCase().includes(keyword) || 
                                f.description.toLowerCase().includes(keyword) ||
                                f.subtitle.toLowerCase().includes(keyword);
            const matchLoc = !loc || f.location === loc;
            const matchPractice = !practice || f.practiceArea === practice;
            
            return matchKeyword && matchLoc && matchPractice;
        });
        
        renderFirms(filtered);
    }

    if (triggerSearchBtn) triggerSearchBtn.addEventListener('click', handleSearch);

    // 4. Rendering Functions
    function renderFirms(firms = LexFlowStorage.getFirms()) {
        const grid = document.querySelector('.firms-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        firms.forEach(firm => {
            const card = document.createElement('div');
            card.className = 'firm-card';
            card.id = `firm-card-${firm.id}`;
            card.innerHTML = `
                <div class="firm-card-header">
                    <div class="firm-avatar">
                        <img src="${firm.avatar}" alt="${firm.name}" style="width:100%; border-radius:50%;">
                    </div>
                    <div class="firm-info">
                        <h3>${firm.name}</h3>
                        <span class="firm-subtitle">${firm.subtitle}</span>
                    </div>
                    <span class="badge badge-${firm.availability.toLowerCase()}">${firm.availability}</span>
                </div>
                <div class="firm-card-body">
                    <p class="firm-description">${firm.description}</p>
                </div>
                <div class="firm-card-stats">
                    <div class="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span class="stat-rating">${firm.rating}</span>
                        <span class="stat-reviews">(${firm.reviews} reviews)</span>
                    </div>
                    <div class="stat-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        <span class="stat-price">$${firm.price}/hr</span>
                    </div>
                </div>
                <div class="firm-card-actions">
                    <button class="btn btn-outline-sm btn-view-profile" data-id="${firm.id}">View Profile</button>
                    <button class="btn btn-primary-sm btn-book-now" data-id="${firm.id}">Book Now</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Update count
        const countText = document.querySelector('.results-header p');
        if (countText) countText.textContent = `${firms.length} firms matching your criteria.`;
    }

    // 5. Global Event Listener for dynamic buttons
    document.addEventListener('click', (e) => {
        const btnView = e.target.closest('.btn-view-profile');
        const btnBook = e.target.closest('.btn-book-now');
        
        if (btnView) {
            const id = btnView.dataset.id;
            openProfile(id);
        }
        if (btnBook) {
            const id = btnBook.dataset.id;
            openBooking(id);
        }
    });

    // 6. Modal Functions
    const bookingOverlay = document.getElementById('modal-overlay');
    const profileOverlay = document.getElementById('profile-overlay');

    function openBooking(firmId) {
        const firm = LexFlowStorage.getFirmById(firmId);
        if (firm) {
            // Store the selected firm ID for later use in booking form
            sessionStorage.setItem('booking_firm_id', firmId);
            
            document.getElementById('lawfirm-name').value = firm.name;
            bookingOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function openProfile(firmId) {
        const firm = LexFlowStorage.getFirmById(firmId);
        if (!firm) return;

        // Fill dynamic fields in overlay
        const panel = document.getElementById('profile-panel');
        if (!panel) return;

        // Try to update name and title
        const nameEl = panel.querySelector('.profile-hero-info h2');
        if (nameEl) nameEl.textContent = `Adv. ${firm.name}`;
        
        const titleEl = panel.querySelector('.profile-title');
        if (titleEl) titleEl.textContent = `Senior Partner at ${firm.name}`;

        // Stats
        const stats = panel.querySelectorAll('.profile-stat-value');
        if (stats[0]) stats[0].textContent = firm.experience || '10+ Years';
        if (stats[1]) stats[1].textContent = `$${firm.price}/hr`;
        if (stats[2]) stats[2].innerHTML = `${firm.rating}/5 <span class="profile-stat-sub">(${firm.reviews} reviews)</span>`;

        // Bio
        const bio = panel.querySelector('.profile-bio');
        if (bio) bio.textContent = firm.bio || firm.description;

        profileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Link the book button in profile
        const pBookBtn = document.getElementById('profile-book-btn');
        if (pBookBtn) {
            pBookBtn.onclick = () => {
                profileOverlay.classList.remove('active');
                openBooking(firmId);
            };
        }
    }

    // Modal selection logic (re-implementing from original)
    // Consultation type toggle
    document.addEventListener('click', (e) => {
        const opt = e.target.closest('.type-option');
        if (opt) {
            document.querySelectorAll('.type-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const radio = opt.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        }

        const slot = e.target.closest('.time-slot');
        if (slot) {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
        }

        const day = e.target.closest('.cal-day');
        if (day) {
            document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
            day.classList.add('selected');
        }
    });

    // Modal close logic
    const closeBtns = [
        document.getElementById('modal-close-btn'),
        document.getElementById('modal-cancel-btn'),
        document.getElementById('profile-back-btn')
    ];
    closeBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', () => {
            bookingOverlay.classList.remove('active');
            profileOverlay.classList.remove('active');
            document.body.style.overflow = '';
            // Clear booking session data
            sessionStorage.removeItem('booking_firm_id');
        });
    });

    // 7. Booking Form Submission
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const firmName = document.getElementById('lawfirm-name').value;
            const typeSelect = document.querySelector('.type-option.selected input');
            const consultationType = typeSelect ? typeSelect.value : 'video';
            
            // Get selected date
            const daySelected = document.querySelector('.cal-day.selected');
            const dayNum = daySelected ? daySelected.textContent : '1';
            
            // Get selected time
            const timeSelected = document.querySelector('.time-slot.selected');
            const selectedTime = timeSelected ? timeSelected.textContent : '10:00 AM';
            
            // Get current date context - format as "MMM DD, YYYY"
            const now = new Date();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = monthNames[now.getMonth()];
            const currentYear = now.getFullYear();
            const consultationDate = `${currentMonth} ${dayNum}, ${currentYear}`;
            
            // Get the firm object to extract better data
            const firmId = sessionStorage.getItem('booking_firm_id');
            const firm = firmId ? LexFlowStorage.getFirmById(firmId) : null;
            
            // Get current user (or use default)
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name": "Client User"}');
            const clientName = currentUser.name || 'Client User';
            
            // Generate unique consultation ID
            const consultationId = 'CONS-' + Date.now();
            
            // Avatar color classes: blue, green, orange, purple, pink, indigo, teal, etc
            const avatarColors = ['blue', 'green', 'orange', 'purple', 'pink', 'indigo', 'teal'];
            const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
            
            // Create new consultation with all required fields
            const newConsultation = {
                id: consultationId,
                clientName: clientName,
                lawyerName: 'Awaiting Assignment',
                firmName: firmName,
                type: consultationType, // 'video' or 'inperson'
                date: consultationDate,
                time: selectedTime + ' - ' + selectedTime, // Time range
                status: 'PENDING', // New bookings start as pending for Firm Admin review
                avatarClass: randomColor, // Random avatar color for visual variety
                caseType: 'General Consultation', // Default case type
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // If we have firm data, add more details
            if (firm) {
                newConsultation.firmId = firm.id;
                newConsultation.firmLocation = firm.location;
                newConsultation.firmRating = firm.rating;
                newConsultation.firmReviews = firm.reviews;
                newConsultation.consultationFee = '$' + firm.price;
            }
            
            // Save to localStorage via storage API
            const savedConsultation = LexFlowStorage.addConsultation(newConsultation);
            
            console.log('[Find Firm] Consultation booked:', savedConsultation.id);
            
            // Show success feedback
            alert('Consultation request sent successfully! Redirecting to your consultations dashboard...');
            
            // Redirect to client dashboard to show the newly created consultation
            window.location.href = 'client-consultation-dashboard.html';
        });
    }

    // Pill selection
    document.querySelectorAll('.pill-btn').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active-pill'));
            pill.classList.add('active-pill');
            // Mock filtering based on pill
            const keyword = pill.textContent.split(' ')[0].toLowerCase();
            const allFirms = LexFlowStorage.getFirms();
            const filtered = allFirms.filter(f => f.description.toLowerCase().includes(keyword) || f.practiceArea.includes(keyword));
            renderFirms(filtered);
        });
    });
});
