// Load Case Details from Mock JSON
async function initCaseDetails() {
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

    // 1. First check URL query parameter (e.g., ?cnr=DLND...)
    const urlParams = new URLSearchParams(window.location.search);
    let cnr = urlParams.get('cnr');

    // 2. Fallback: check breadcrumb text if no query param exists
    if (!cnr) {
      const breadcrumb = document.querySelector('.breadcrumb .current').textContent;
      cnr = breadcrumb.includes('CNR:') ? breadcrumb.replace('CNR:', '').trim() : '';
    }

    const caseData = data.cases.find(c => c.cnr === cnr);
    if (caseData) {
      // 1. Header & Breadcrumb
      document.querySelector('.page-header p').textContent = caseData.title;
      document.querySelector('.breadcrumb .current').textContent = `CNR: ${caseData.cnr}`;

      // 2. Info Grid
      const infoGrid = document.querySelector('.info-grid');
      infoGrid.innerHTML = `
        <div class="info-item"><label>CNR Number</label><div class="value">${caseData.cnr}</div></div>
        <div class="info-item"><label>Case Type</label><div class="value">${caseData.type}</div></div>
        <div class="info-item"><label>Court</label><div class="value">${caseData.court}</div></div>
        <div class="info-item"><label>Assigned Lawyer</label><div class="value link" onclick="window.location.href='advocate-profile.html?id=${caseData.assignedAdvocateId}'">Advocate Details</div></div>
        <div class="info-item"><label>Filed Date</label><div class="value">${formatDate(caseData.filedDate)}</div></div>
        <div class="info-item"><label>Status</label><div class="value"><span class="badge-status">${caseData.status}</span></div></div>
      `;

      // 3. Next Hearing Banner
      if (caseData.nextHearing) {
        const hDate = new Date(caseData.nextHearing.date);
        const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        document.querySelector('.hearing-date .month').textContent = months[hDate.getMonth()];
        document.querySelector('.hearing-date .day').textContent = hDate.getDate();
        document.querySelector('.hearing-info .sub').textContent = `${caseData.nextHearing.time} • ${caseData.nextHearing.description}`;
      }

      // 4. Case Progress
      document.querySelector('.prog-label .pct').textContent = caseData.progress + '% Complete';
      const fill = document.querySelector('.progress-bar .fill');
      if (fill) {
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = caseData.progress + '%'; }, 100);
      }

      // 5. Timeline Rendering
      const timelineEl = document.querySelector('.timeline');
      if (timelineEl && caseData.timeline) {
        timelineEl.innerHTML = caseData.timeline.map(t => `
          <div class="timeline-item ${t.grey ? 'grey' : ''}">
            <div class="t-title">${t.title}</div>
            <div class="t-date">${t.date}</div>
            ${t.upcoming ? '<span class="badge-upcoming">UPCOMING</span>' : ''}
            ${t.note ? `<div class="t-note">${t.note}</div>` : ''}
          </div>
        `).join('');
      }

      // 6. Documents Table
      const docsTbody = document.querySelector('.docs-table tbody');
      if (docsTbody && caseData.documents) {
        docsTbody.innerHTML = caseData.documents.map(d => `
          <tr>
            <td><div class="doc-name"><div class="doc-icon ${d.type.toLowerCase()}">${d.type}</div>${d.name}</div></td>
            <td>${d.date}</td>
            <td><span class="badge-verified">${d.status}</span></td>
            <td><button class="download-btn" data-file="${d.name}"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/></svg></button></td>
          </tr>
        `).join('');
        
        // Re-attach download listeners to new buttons
        attachDownloadHandlers();
      }
    }
  } catch (err) {
    console.error('Error loading case details:', err);
  }
}

// Helper: Format Date for readable Info Grid
function formatDate(isoString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(isoString).toLocaleDateString(undefined, options);
}

// Helper: Download logic
function attachDownloadHandlers() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.onclick = function() {
      const filename = this.parentElement.parentElement.querySelector('.doc-name').textContent.replace(this.dataset.file ? '' : '.doc-icon', '').trim();
      const a = document.createElement('a');
      a.href = 'legalheir.pdf';
      a.download = filename; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  });
}

// Initial render
window.addEventListener('DOMContentLoaded', initCaseDetails);
