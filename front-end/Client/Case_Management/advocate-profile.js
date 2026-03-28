// Advocate profile page interactions
async function initProfile() {
  // Update Sidebar User Profile
  const currentUser = JSON.parse(sessionStorage.getItem('lexflow_current_user'));
  if (currentUser) {
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarAvatar').textContent = currentUser.avatar || currentUser.name.charAt(0);
  } else {
    document.getElementById('sidebarName').textContent = 'John Doe';
    document.getElementById('sidebarAvatar').textContent = 'JD';
  }

  try {
    const response = await fetch('data/mock-data.json');
    const data = await response.json();
    
    // 1. Get ID from URL or default to Sarah (ADM001)
    const urlParams = new URLSearchParams(window.location.search);
    const advocateId = urlParams.get('id') || 'ADM001';

    // 2. Find Advocate data
    const advocate = data.users.find(u => u.id === advocateId);
    if (advocate) {
      // Update Hero Section
      document.querySelector('.advocate-hero-info h1').textContent = `Adv. ${advocate.name}`;
      document.querySelector('.advocate-tagline').textContent = `Senior Advocate – ${advocate.specialisation}`;
      document.querySelector('.advocate-avatar-lg').textContent = advocate.avatar;
      
      // Info Grid (Professional Details)
      const infoGridValues = document.querySelectorAll('.left-col .card:first-child .value');
      if (infoGridValues.length >= 6) {
        infoGridValues[0].textContent = advocate.name;
        infoGridValues[1].textContent = advocate.barCouncilId || 'N/A';
        infoGridValues[2].textContent = advocate.specialisation;
        infoGridValues[5].textContent = advocate.email;
      }

      // Performance Stats
      document.querySelector('.stat-pill-donut-label').textContent = advocate.winRate + '%';
      document.querySelector('.stat-pill-sub').textContent = `${advocate.won} won · ${advocate.lost} lost · ${advocate.ongoing} ongoing`;
      document.querySelector('.perf-grid .perf-item:nth-child(1) .perf-value').textContent = advocate.totalCases;
      document.querySelector('.perf-grid .perf-item:nth-child(2) .perf-value').textContent = advocate.won;
      document.querySelector('.perf-grid .perf-item:nth-child(3) .perf-value').textContent = advocate.lost;
      document.querySelector('.perf-grid .perf-item:nth-child(4) .perf-value').textContent = advocate.ongoing;
    }

    // 3. Filter Cases for this specific advocate
    const advocateCases = data.cases.filter(c => c.assignedAdvocateId === advocateId);
    const casesListEl = document.querySelector('.advocate-cases-list');
    
    if (casesListEl) {
      if (advocateCases.length === 0) {
        casesListEl.innerHTML = '<p style="color:#6b7280; font-size:14px; padding:10px;">No active cases found for this advocate.</p>';
      } else {
        casesListEl.innerHTML = advocateCases.map(c => `
          <a href="case-details.html?cnr=${c.cnr}" class="advocate-case-row">
            <div class="ac-dot ongoing"></div>
            <div class="ac-info">
              <div class="ac-title">${c.title}</div>
              <div class="ac-meta"><span class="ac-cnr">${c.cnr}</span><span class="ac-sep">·</span>${c.court}</div>
            </div>
            <span class="badge-status ongoing-badge">Active</span>
            <svg class="ac-arrow-svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l6-6-6-6"/></svg>
          </a>
        `).join('');
      }
    }

    // 4. Animate performance numbers
    animateNumbers();
  } catch (err) {
    console.error('Error loading advocate profile:', err);
  }
}

function animateNumbers() {
  const perfValues = document.querySelectorAll('.perf-value');
  perfValues.forEach(el => {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target)) return;
    el.textContent = '0';
    let current = 0;
    const step = Math.max(1, Math.floor(target / 20));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      el.textContent = current;
    }, 40);
  });
}

document.addEventListener('DOMContentLoaded', initProfile);
