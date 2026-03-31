/* ===================================================
   LexFlow — Case Documents
   case-documents.js — Search, Filter, Sort, View Toggle, Upload Modal
   =================================================== */

(function () {
  "use strict";

  /* ─── Document Data ─── */
  const docsData = [
    { id: "DOC-203", name: "Property_Agreement.pdf",    type: "CONTRACT",      fileType: "PDF", uploader: "Adv. Mehta",   date: "2026-03-12", version: "v1", access: "PRIVATE",  iconColor: "green"  },
    { id: "DOC-204", name: "Evidence_Photo_01.jpg",     type: "CASE EVIDENCE", fileType: "IMG", uploader: "Intern Name",  date: "2026-03-14", version: "v1", access: "SHARED",   iconColor: "orange" },
    { id: "DOC-205", name: "Court_Notice_March.pdf",    type: "COURT ORDER",   fileType: "PDF", uploader: "Adv. Mehta",   date: "2026-03-10", version: "v2", access: "SHARED",   iconColor: "green"  },
    { id: "DOC-206", name: "Client_ID_Proof.jpg",       type: "CLIENT PROOF",  fileType: "IMG", uploader: "Intern Name",  date: "2026-03-08", version: "v1", access: "PRIVATE",  iconColor: "orange" },
    { id: "DOC-207", name: "Affidavit_Signed.pdf",      type: "AFFIDAVIT",     fileType: "PDF", uploader: "Adv. Mehta",   date: "2026-02-28", version: "v3", access: "PRIVATE",  iconColor: "green"  },
    { id: "DOC-208", name: "Survey_Report.docx",        type: "REPORT",        fileType: "DOC", uploader: "Adv. Sharma",  date: "2026-02-20", version: "v1", access: "SHARED",   iconColor: "blue"   },
    { id: "DOC-209", name: "Witness_Statement.pdf",     type: "CASE EVIDENCE", fileType: "PDF", uploader: "Intern Name",  date: "2026-03-01", version: "v1", access: "PRIVATE",  iconColor: "green"  },
    { id: "DOC-210", name: "Land_Registry.docx",        type: "CONTRACT",      fileType: "DOC", uploader: "Adv. Mehta",   date: "2026-01-15", version: "v2", access: "SHARED",   iconColor: "blue"   },
  ];

  /* ─── State ─── */
  const state = {
    view: "grid",
    search: "",
    sortKey: "date",
    sortDir: "desc",
    typeFilter: "All Types",
  };

  /* ─── DOM ─── */
  const grid        = document.querySelector(".documents-grid");
  const searchInput = document.querySelector(".search-box input");
  const typeSelect  = document.querySelector(".toolbar select");
  const totalEl     = document.querySelector(".total");
  const viewIcons   = document.querySelectorAll(".view-toggle svg");
  const filterIcon  = viewIcons[0];
  const sortIcon    = viewIcons[1];
  const gridIcon    = viewIcons[2];
  const listIcon    = viewIcons[3];
  const uploadBtn   = document.querySelector(".btn-primary");
  const modal       = document.querySelector(".upload-modal");

  /* ════════════════════════════════════════
     INJECT CSS
  ════════════════════════════════════════ */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    /* ── Toolbar icon cursors ── */
    .view-toggle svg { cursor: pointer; transition: fill 0.15s; }

    /* ── List container ── */
    .documents-list {
      width: 80%;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 12px;
      border: 1px solid var(--border-light);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .doc-list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1.5fr;
      padding: 10px 18px;
      gap: 8px;
      background: var(--bg-table-header);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    .doc-list-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1.5fr;
      align-items: center;
      padding: 11px 18px;
      gap: 8px;
      border-bottom: 1px solid var(--border-light);
      transition: background 0.13s;
    }
    .doc-list-row:last-child { border-bottom: none; }
    .doc-list-row:hover { background: #f8f9fb; }

    .dlc { font-size: 0.82rem; color: var(--text-primary); }
    .dlc-name { display: flex; align-items: center; gap: 10px; }
    .dlc-name span { font-weight: 600; font-size: 0.83rem; word-break: break-all; }
    .dlc-sub { font-size: 0.7rem; color: var(--text-secondary); margin-top: 1px; }

    .doc-icon-sm {
      width: 30px; height: 30px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6rem; font-weight: 700; flex-shrink: 0;
      color: #555;
    }
    .doc-icon-sm.green  { background: #e6f9f0; }
    .doc-icon-sm.orange { background: #fff4e6; }
    .doc-icon-sm.blue   { background: #eff6ff; }

    .dlc-secondary { color: var(--text-secondary); }

    .doc-list-actions { display: flex; gap: 4px; }
    .doc-list-actions button {
      padding: 5px 9px; font-size: 0.72rem; font-weight: 500;
      border-radius: 5px; border: 1px solid var(--border-light);
      background: #fff; cursor: pointer; color: var(--text-primary);
      transition: background 0.12s;
    }
    .doc-list-actions button:hover { background: var(--bg-table-header); }
    .doc-list-actions button.danger { color: #be123c; border-color: #fecdd3; }
    .doc-list-actions button.danger:hover { background: #fff1f2; }

    /* type tag colors */
    .tag { font-size: 0.7rem; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
    .tag.contract   { background: var(--blue-bg);  color: var(--blue-text); }
    .tag.evidence   { background: var(--red-bg);   color: var(--red-text); }
    .tag.order      { background: var(--green-bg); color: var(--green-text); }
    .tag.proof      { background: var(--orange-bg);color: var(--orange-text); }
    .tag.affidavit  { background: #faf5ff;         color: #7c3aed; }
    .tag.report     { background: #f0fdf4;         color: #166534; }
    .tag.default    { background: #f1f5f9;         color: #475569; }

    .access-badge {
      font-size: 0.68rem; padding: 3px 8px; border-radius: 999px; font-weight: 600;
    }
    .access-badge.private { background: #f1f5f9; color: #64748b; }
    .access-badge.shared  { background: var(--green-bg); color: var(--green-text); }

    /* ── Sort/Filter Dropdowns ── */
    .lex-dd {
      position: absolute;
      min-width: 190px;
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 28px rgba(0,0,0,0.11);
      z-index: 9999;
      display: none; flex-direction: column;
      overflow: hidden;
    }
    .lex-dd.open { display: flex; }

    .dd-head {
      padding: 10px 14px 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
    }

    .dd-row {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px; font-size: 0.84rem;
      cursor: pointer; color: var(--text-primary);
      transition: background 0.12s; user-select: none;
    }
    .dd-row:hover { background: var(--bg-table-header); }
    .dd-row.on { font-weight: 600; color: var(--brand-accent); }
    .dd-row input[type="checkbox"] { accent-color: var(--sidebar-bg); width: 14px; height: 14px; }
    .dd-arrow { margin-left: auto; font-size: 0.78rem; color: var(--brand-accent); }

    .dd-foot {
      display: flex; gap: 8px; padding: 10px 14px;
      border-top: 1px solid var(--border-light);
    }
    .dd-foot button {
      flex: 1; padding: 7px; border-radius: 6px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none;
    }
    .dd-clear { background: var(--bg-table-header); color: var(--text-secondary); }
    .dd-apply { background: var(--sidebar-bg); color: #fff; }

    /* ── No results ── */
    .no-docs {
      padding: 48px; text-align: center;
      color: var(--text-secondary); font-size: 0.9rem;
    }

    /* ── Upload modal active ── */
    .upload-modal.active { display: flex; }

    /* ── Drop icon svg fix ── */
    .upload-modal__drop-icon svg { display: block; margin: 0 auto; }

    /* ── Drag over state ── */
    .upload-modal__dropzone.drag-over {
      border-color: var(--brand-accent);
      background: #eff6ff;
    }

    /* ── File preview ── */
    .file-preview {
      display: flex; align-items: center; gap: 10px;
      margin-top: 12px; padding: 10px 14px;
      background: #f1f5f9; border-radius: 8px;
      font-size: 0.8rem; color: var(--text-primary);
    }
    .file-preview span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-preview button {
      background: none; border: none; cursor: pointer;
      color: var(--text-secondary); font-size: 1rem; padding: 0 4px;
    }
    .file-preview button:hover { color: #be123c; }
  `;
  document.head.appendChild(styleEl);

  /* ════════════════════════════════════════
     POPULATE TYPE SELECT
  ════════════════════════════════════════ */
  const allTypes = [...new Set(docsData.map(d => d.type))];
  typeSelect.innerHTML = `<option>All Types</option>` +
    allTypes.map(t => `<option>${t}</option>`).join("");

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  function tagClass(type) {
    const map = {
      "CONTRACT": "contract", "CASE EVIDENCE": "evidence",
      "COURT ORDER": "order", "CLIENT PROOF": "proof",
      "AFFIDAVIT": "affidavit", "REPORT": "report",
    };
    return map[type] || "default";
  }

  function buildCard(d) {
    const el = document.createElement("div");
    el.className = "doc-card";
    el.innerHTML = `
      <div class="doc-header">
        <div class="doc-icon ${d.iconColor}">${d.fileType}</div>
        <div>
          <h3>${d.name}</h3>
          <div class="tags">
            <span>${d.id}</span>
            <span class="${tagClassOld(d.type)}">${d.type}</span>
          </div>
        </div>
        <span class="badge ${d.access === 'SHARED' ? 'green' : ''}">${d.access}</span>
      </div>
      <div class="doc-meta">
        <div><span>UPLOADER</span>${d.uploader}</div>
        <div><span>DATE</span>${fmtDate(d.date)}</div>
        <div><span>VERSION</span>${d.version}</div>
      </div>
      <div class="doc-actions">
        <button>View</button>
        <button>Download</button>
        <button>Update</button>
        <button>Delete</button>
      </div>`;
    return el;
  }

  function tagClassOld(type) {
    const map = { "CONTRACT": "", "CASE EVIDENCE": "red", "COURT ORDER": "green", "CLIENT PROOF": "red" };
    return map[type] ?? "";
  }

  function buildRow(d) {
    const el = document.createElement("div");
    el.className = "doc-list-row";
    el.innerHTML = `
      <div class="dlc dlc-name">
        <div class="doc-icon-sm ${d.iconColor}">${d.fileType}</div>
        <div>
          <div>${d.name}</div>
          <div class="dlc-sub">${d.id}</div>
        </div>
      </div>
      <div class="dlc"><span class="tag ${tagClass(d.type)}">${d.type}</span></div>
      <div class="dlc dlc-secondary">${d.uploader}</div>
      <div class="dlc dlc-secondary">${fmtDate(d.date)}</div>
      <div class="dlc dlc-secondary">${d.version}</div>
      <div class="dlc"><span class="access-badge ${d.access.toLowerCase()}">${d.access}</span></div>
      <div class="dlc doc-list-actions">
        <button>View</button>
        <button>Download</button>
        <button>Update</button>
        <button class="danger">Delete</button>
      </div>`;
    return el;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  function go() {
    let data = [...docsData];

    // Search
    const q = state.search.toLowerCase().trim();
    if (q) {
      data = data.filter(d =>
        d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (state.typeFilter !== "All Types") {
      data = data.filter(d => d.type === state.typeFilter);
    }

    // Sort
    data.sort((a, b) => {
      const va = state.sortKey === "date" ? new Date(a.date) : a[state.sortKey].toLowerCase();
      const vb = state.sortKey === "date" ? new Date(b.date) : b[state.sortKey].toLowerCase();
      if (va < vb) return state.sortDir === "asc" ? -1 : 1;
      if (va > vb) return state.sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // Update count
    totalEl.textContent = `Total Documents: ${data.length}`;

    // Clear
    grid.innerHTML = "";
    grid.className = state.view === "grid" ? "documents-grid" : "documents-list";

    if (!data.length) {
      grid.innerHTML = `<p class="no-docs">No documents match your criteria.</p>`;
      return;
    }

    if (state.view === "list") {
      const hdr = document.createElement("div");
      hdr.className = "doc-list-header";
      hdr.innerHTML = `<span>Document</span><span>Type</span><span>Uploader</span>
                       <span>Date</span><span>Version</span><span>Access</span><span>Actions</span>`;
      grid.appendChild(hdr);
    }

    data.forEach(d => grid.appendChild(state.view === "grid" ? buildCard(d) : buildRow(d)));
  }

  /* ════════════════════════════════════════
     SORT DROPDOWN
  ════════════════════════════════════════ */
  const sortOpts = [
    { key: "date",     label: "Date" },
    { key: "name",     label: "File Name" },
    { key: "uploader", label: "Uploader" },
  ];

  const sortDD = document.createElement("div");
  sortDD.className = "lex-dd";
  sortDD.innerHTML = `
    <div class="dd-head">Sort by</div>
    ${sortOpts.map(o =>
      `<div class="dd-row sort-opt ${state.sortKey === o.key ? "on" : ""}" data-key="${o.key}">
        ${o.label}<span class="dd-arrow">${state.sortKey === o.key ? (state.sortDir === "asc" ? "↑" : "↓") : ""}</span>
       </div>`).join("")}`;
  document.body.appendChild(sortDD);

  sortDD.querySelectorAll(".sort-opt").forEach(item => {
    item.addEventListener("click", () => {
      const key = item.dataset.key;
      state.sortDir = state.sortKey === key ? (state.sortDir === "asc" ? "desc" : "asc") : "asc";
      state.sortKey = key;
      sortDD.querySelectorAll(".sort-opt").forEach(el => {
        el.classList.toggle("on", el.dataset.key === state.sortKey);
        el.querySelector(".dd-arrow").textContent =
          el.dataset.key === state.sortKey ? (state.sortDir === "asc" ? "↑" : "↓") : "";
      });
      sortIcon.style.fill = "var(--brand-accent)";
      go();
    });
  });

  /* ════════════════════════════════════════
     FILTER DROPDOWN (access type)
  ════════════════════════════════════════ */
  const filterDD = document.createElement("div");
  filterDD.className = "lex-dd";
  let activeAccess = [];
  filterDD.innerHTML = `
    <div class="dd-head">Filter by Access</div>
    ${["PRIVATE","SHARED"].map(s =>
      `<label class="dd-row"><input type="checkbox" class="fcb" value="${s}"> ${s}</label>`
    ).join("")}
    <div class="dd-foot">
      <button class="dd-clear">Clear</button>
      <button class="dd-apply">Apply</button>
    </div>`;
  document.body.appendChild(filterDD);

  filterDD.querySelector(".dd-clear").addEventListener("click", () => {
    filterDD.querySelectorAll(".fcb").forEach(cb => cb.checked = false);
    activeAccess = [];
    filterIcon.style.fill = "var(--text-secondary)";
    go();
  });
  filterDD.querySelector(".dd-apply").addEventListener("click", () => {
    activeAccess = [...filterDD.querySelectorAll(".fcb:checked")].map(cb => cb.value);
    filterIcon.style.fill = activeAccess.length ? "var(--brand-accent)" : "var(--text-secondary)";
    // patch go() to include access filter
    goWithAccess();
    closeAll();
  });

  // Extend go() with access filter inline
  const _go = go;
  function goWithAccess() {
    let data = [...docsData];
    const q = state.search.toLowerCase().trim();
    if (q) data = data.filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    if (state.typeFilter !== "All Types") data = data.filter(d => d.type === state.typeFilter);
    if (activeAccess.length) data = data.filter(d => activeAccess.includes(d.access));
    data.sort((a, b) => {
      const va = state.sortKey === "date" ? new Date(a.date) : a[state.sortKey].toLowerCase();
      const vb = state.sortKey === "date" ? new Date(b.date) : b[state.sortKey].toLowerCase();
      if (va < vb) return state.sortDir === "asc" ? -1 : 1;
      if (va > vb) return state.sortDir === "asc" ? 1 : -1;
      return 0;
    });
    totalEl.textContent = `Total Documents: ${data.length}`;
    grid.innerHTML = "";
    grid.className = state.view === "grid" ? "documents-grid" : "documents-list";
    if (!data.length) { grid.innerHTML = `<p class="no-docs">No documents match your criteria.</p>`; return; }
    if (state.view === "list") {
      const hdr = document.createElement("div");
      hdr.className = "doc-list-header";
      hdr.innerHTML = `<span>Document</span><span>Type</span><span>Uploader</span><span>Date</span><span>Version</span><span>Access</span><span>Actions</span>`;
      grid.appendChild(hdr);
    }
    data.forEach(d => grid.appendChild(state.view === "grid" ? buildCard(d) : buildRow(d)));
  }

  // Use goWithAccess as the main render function everywhere
  function render() { goWithAccess(); }

  /* ════════════════════════════════════════
     DROPDOWN HELPERS
  ════════════════════════════════════════ */
  function openDD(dd, anchor) {
    const isOpen = dd.classList.contains("open");
    closeAll();
    if (isOpen) return;
    dd.classList.add("open");
    requestAnimationFrame(() => {
      const rect = anchor.getBoundingClientRect();
      const w    = dd.offsetWidth;
      dd.style.top  = (rect.bottom + window.scrollY + 8) + "px";
      dd.style.left = Math.max(4, rect.right + window.scrollX - w) + "px";
    });
  }

  function closeAll() {
    sortDD.classList.remove("open");
    filterDD.classList.remove("open");
  }

  /* ════════════════════════════════════════
     VIEW TOGGLE
  ════════════════════════════════════════ */
  function syncViewIcons() {
    gridIcon.style.fill = state.view === "grid" ? "var(--brand-accent)" : "var(--text-secondary)";
    listIcon.style.fill = state.view === "list" ? "var(--brand-accent)" : "var(--text-secondary)";
  }

  /* ════════════════════════════════════════
     EVENT BINDING
  ════════════════════════════════════════ */
  searchInput.addEventListener("input", e => { state.search = e.target.value; render(); });
  typeSelect.addEventListener("change", e => { state.typeFilter = e.target.value; render(); });

  filterIcon.addEventListener("click", e => { e.stopPropagation(); openDD(filterDD, filterIcon); });
  sortIcon.addEventListener("click",   e => { e.stopPropagation(); openDD(sortDD,   sortIcon);   });

  gridIcon.addEventListener("click", () => { state.view = "grid"; render(); syncViewIcons(); });
  listIcon.addEventListener("click", () => { state.view = "list"; render(); syncViewIcons(); });

  sortDD.addEventListener("click",   e => e.stopPropagation());
  filterDD.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", closeAll);

  /* ════════════════════════════════════════
     UPLOAD MODAL
  ════════════════════════════════════════ */
  const closeBtn   = modal.querySelector(".upload-modal__close");
  const cancelBtn  = modal.querySelector(".upload-modal__btn--ghost");
  const submitBtn  = modal.querySelector(".upload-modal__btn--primary");
  const dropzone   = modal.querySelector(".upload-modal__dropzone");
  const dropText   = modal.querySelector(".upload-modal__drop-text");
  const dropSub    = modal.querySelector(".upload-modal__drop-subtext");

  let selectedFile = null;

  function openModal()  { modal.classList.add("active");    document.body.style.overflow = "hidden"; }
  function closeModal() { modal.classList.remove("active"); document.body.style.overflow = "";       resetFile(); }

  uploadBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click",  closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  // Drag & drop
  dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
  dropzone.addEventListener("dragleave", ()  => dropzone.classList.remove("drag-over"));
  dropzone.addEventListener("drop", e => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Click to browse
  dropzone.addEventListener("click", () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.docx,.jpg,.jpeg,.png";
    inp.onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
    inp.click();
  });
  dropzone.style.cursor = "pointer";

  function handleFile(file) {
    selectedFile = file;
    // Show preview
    const existing = dropzone.querySelector(".file-preview");
    if (existing) existing.remove();
    const preview = document.createElement("div");
    preview.className = "file-preview";
    preview.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span title="${file.name}">${file.name}</span>
      <small>${(file.size / 1024).toFixed(1)} KB</small>
      <button title="Remove">✕</button>`;
    preview.querySelector("button").addEventListener("click", e => { e.stopPropagation(); resetFile(); });
    dropzone.appendChild(preview);
    dropText.textContent = "File selected";
  }

  function resetFile() {
    selectedFile = null;
    const p = dropzone.querySelector(".file-preview");
    if (p) p.remove();
    dropText.textContent = "Drag & Drop Files Here or Click to Upload";
  }

  // Submit
  submitBtn.addEventListener("click", () => {
    const clientName = modal.querySelector('input[type="text"]').value.trim();
    if (!clientName) { alert("Please fill in all required fields."); return; }
    if (!selectedFile) { alert("Please select a file to upload."); return; }

    // Simulate adding to data
    const typeVal    = modal.querySelector("select").value;
    const uploaderVal = modal.querySelectorAll('input[type="text"]')[2]?.value || "Unknown";
    const today      = new Date().toISOString().split("T")[0];
    const newId      = "DOC-" + (211 + docsData.length);

    docsData.unshift({
      id: newId,
      name: selectedFile.name,
      type: typeVal.toUpperCase(),
      fileType: selectedFile.name.split(".").pop().toUpperCase().slice(0, 3),
      uploader: uploaderVal,
      date: today,
      version: "v1",
      access: "PRIVATE",
      iconColor: "green",
    });

    closeModal();
    render();

    // Brief success flash
    const toast = document.createElement("div");
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:#1e2a4a;color:#fff;
      padding:12px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:9999;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);`;
    toast.textContent = `✓ ${selectedFile.name} uploaded successfully`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  });

  /* ─── Boot ─── */
  syncViewIcons();
  render();

})();