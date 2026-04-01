const DOCS_STORAGE_KEY = "lexflow_documents";

// Use shared cases storage utility
const casesStorage = window.LexFlowCasesStorage;

function loadJsonFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Failed to parse ${key}:`, error);
    return null;
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderTimeline(timeline) {
  const timelineEl = document.querySelector(".timeline");
  if (!timelineEl || !Array.isArray(timeline)) {
    return;
  }

  timelineEl.innerHTML = timeline
    .map(
      (event) => `
        <div class="timeline-item ${event.grey ? "grey" : ""}">
          <div class="t-title">${event.title}</div>
          <div class="t-date">${event.date}</div>
          ${event.upcoming ? '<span class="badge-upcoming">UPCOMING</span>' : ""}
          ${event.note ? `<div class="t-note">${event.note}</div>` : ""}
        </div>
      `,
    )
    .join("");
}

function renderDocuments(documents) {
  const docsBody = document.querySelector(".docs-table tbody");
  if (!docsBody) {
    return;
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    docsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#6b7280;">No documents available.</td></tr>';
    return;
  }

  docsBody.innerHTML = documents
    .map(
      (doc) => `
        <tr>
          <td><div class="doc-name"><div class="doc-icon ${String(doc.type || "DOC").toLowerCase()}">${doc.type || "DOC"}</div>${doc.name}</div></td>
          <td>${doc.date || "-"}</td>
          <td><span class="badge-verified">${doc.status || "Verified"}</span></td>
          <td><button class="download-btn" data-file="${doc.name}"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/></svg></button></td>
        </tr>
      `,
    )
    .join("");

  attachDownloadHandlers();
}

function getDocumentsForCase(currentCase) {
  const docsIndex = loadJsonFromStorage(DOCS_STORAGE_KEY);
  if (Array.isArray(docsIndex) && docsIndex.length > 0) {
    const byCnr = docsIndex.filter((doc) => String(doc.caseCnr || "") === String(currentCase.cnr || ""));
    if (byCnr.length > 0) {
      return byCnr.map((doc) => ({
        name: doc.name,
        type: doc.type || "DOC",
        date: doc.date || "-",
        status: doc.status || "Reviewing",
      }));
    }
  }

  return Array.isArray(currentCase.documents) ? currentCase.documents : [];
}

function attachDownloadHandlers() {
  document.querySelectorAll(".download-btn").forEach((button) => {
    button.onclick = function () {
      const fileName = this.dataset.file || "document.pdf";
      const link = document.createElement("a");
      link.href = "legalheir.pdf";
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  });
}

async function initCaseDetails() {
  try {
    const data = await ensureCasesStorage();
    let cnr = new URLSearchParams(window.location.search).get("cnr");

    if (!cnr) {
      const currentCrumb = document.querySelector(".breadcrumb .current");
      const crumbText = currentCrumb ? currentCrumb.textContent : "";
      cnr = crumbText.includes("CNR:") ? crumbText.replace("CNR:", "").trim() : "";
    }

    const currentCase = (data.cases || []).find((item) => item.cnr === cnr);
    if (!currentCase) {
      return;
    }

    document.querySelector(".page-header p").textContent = currentCase.title;
    document.querySelector(".breadcrumb .current").textContent = `CNR: ${currentCase.cnr}`;

    document.querySelector(".info-grid").innerHTML = `
      <div class="info-item"><label>CNR Number</label><div class="value">${currentCase.cnr}</div></div>
      <div class="info-item"><label>Case Type</label><div class="value">${currentCase.type}</div></div>
      <div class="info-item"><label>Court</label><div class="value">${currentCase.court}</div></div>
      <div class="info-item"><label>Assigned Lawyer</label><div class="value link" onclick="window.location.href='client_casemanagement_advocate-profile.html?id=${currentCase.assignedAdvocateId}'">Advocate Details</div></div>
      <div class="info-item"><label>Filed Date</label><div class="value">${formatDate(currentCase.filedDate)}</div></div>
      <div class="info-item"><label>Status</label><div class="value"><span class="badge-status">${currentCase.status}</span></div></div>
    `;

    if (currentCase.nextHearing) {
      const hearingDate = new Date(currentCase.nextHearing.date);
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      document.querySelector(".hearing-date .month").textContent = months[hearingDate.getMonth()];
      document.querySelector(".hearing-date .day").textContent = hearingDate.getDate();
      document.querySelector(".hearing-info .sub").textContent = `${currentCase.nextHearing.time} • ${currentCase.nextHearing.description}`;
    }

    document.querySelector(".prog-label .pct").textContent = `${currentCase.progress}% Complete`;
    const progressFill = document.querySelector(".progress-bar .fill");
    if (progressFill) {
      progressFill.style.width = "0%";
      setTimeout(() => {
        progressFill.style.width = `${currentCase.progress}%`;
      }, 100);
    }

    renderTimeline(currentCase.timeline || []);
    renderDocuments(getDocumentsForCase(currentCase));
  } catch (error) {
    console.error("Error loading case details:", error);
  }
}

window.addEventListener("DOMContentLoaded", initCaseDetails);
