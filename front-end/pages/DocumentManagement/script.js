let role = "client";
// can be client, lawyer, admin, intern


/* ===================================================
   LexFlow — Document Management
   script.js — Search, Filter, Sort, View Toggle
   =================================================== */

(function () {
  "use strict";

  /* ─── Sample Data ─── */
  const casesData = [
    { id: "CASE-45", client: "Rahul Sharma",  type: "INDIVIDUAL", status: "Active",  caseType: "Property Dispute", lawyer: "Adv. Mehta",  court: "Bombay High Court", date: "2024-03-12" },
    { id: "CASE-46", client: "Priya Nair",    type: "INDIVIDUAL", status: "Active",  caseType: "Divorce",          lawyer: "Adv. Sharma", court: "Delhi High Court",  date: "2024-02-20" },
    { id: "CASE-47", client: "Infosys Ltd.",  type: "CORPORATE",  status: "Closed",  caseType: "Contract Breach",  lawyer: "Adv. Gupta",  court: "Madras High Court", date: "2023-11-05" },
    { id: "CASE-48", client: "Amit Verma",    type: "INDIVIDUAL", status: "Pending", caseType: "Criminal Defence", lawyer: "Adv. Mehta",  court: "Supreme Court",     date: "2024-01-18" },
    { id: "CASE-49", client: "TechCorp Pvt.", type: "CORPORATE",  status: "Active",  caseType: "IP Infringement",  lawyer: "Adv. Rao",    court: "Bombay High Court", date: "2024-03-01" },
    { id: "CASE-50", client: "Sunita Patel",  type: "INDIVIDUAL", status: "Active",  caseType: "Consumer Forum",   lawyer: "Adv. Sharma", court: "District Court",    date: "2024-02-14" },
  ];

  /* ─── State ─── */
  const state = {
    view: "grid",
    search: "",
    sortKey: "date",
    sortDir: "desc",
    activeFilters: [],
  };

  /* ─── DOM refs ─── */
  const grid        = document.querySelector(".cases-grid");
  const searchInput = document.querySelector(".search-wrapper input");
  const icons       = document.querySelectorAll(".section-actions svg");
  const iconFilter  = icons[0];
  const iconSort    = icons[1];
  const iconGrid    = icons[2];
  const iconList    = icons[3];

  /* ════════════════════════════════════════
     CSS — injected once
  ════════════════════════════════════════ */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    /* ── List container ── */
    .cases-list {
      display: flex; flex-direction: column;
      background: #fff;
      border-radius: 12px;
      border: 1px solid var(--border-light);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    /* ── List header ── */
    .list-header-row {
      display: grid;
      grid-template-columns: 2.2fr 1fr 1.4fr 1.2fr 1.6fr 1fr 0.9fr;
      padding: 10px 20px;
      gap: 8px;
      background: var(--bg-table-header);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-secondary);
    }

    /* ── List rows ── */
    .case-list-row {
      display: grid;
      grid-template-columns: 2.2fr 1fr 1.4fr 1.2fr 1.6fr 1fr 0.9fr;
      align-items: center;
      padding: 13px 20px;
      gap: 8px;
      border-bottom: 1px solid var(--border-light);
      transition: background 0.13s ease;
    }
    .case-list-row:last-child { border-bottom: none; }
    .case-list-row:hover { background: #f8f9fb; }

    .list-col { font-size: 0.82rem; color: var(--text-primary); }
    .list-col-case, .list-col-court, .list-col-lawyer { color: var(--text-secondary); }

    .list-col-client { display: flex; align-items: center; gap: 11px; }

    .list-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--sidebar-bg); color: #fff;
      font-weight: 700; font-size: 0.85rem;
      display: grid; place-items: center; flex-shrink: 0;
    }
    .list-name { font-weight: 600; font-size: 0.85rem; }
    .list-sub  { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; }

    .badge.red    { background: #fef2f2; color: #be123c; }
    .badge.orange { background: #fff7ed; color: #c2410c; }

    .list-btn {
      display: inline-block; padding: 6px 12px;
      border-radius: 6px; background: var(--sidebar-bg);
      color: #fff; font-size: 0.75rem; font-weight: 600;
      text-decoration: none; white-space: nowrap;
      transition: background 0.15s;
    }
    .list-btn:hover { background: #162040; }

    /* ── Dropdowns ── */
    .lex-dropdown {
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
    .lex-dropdown.open { display: flex; }

    .dd-section-header {
      padding: 10px 14px 8px;
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-light);
    }

    .dd-item {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px; font-size: 0.84rem;
      cursor: pointer; color: var(--text-primary);
      transition: background 0.12s; user-select: none;
    }
    .dd-item:hover { background: var(--bg-table-header); }
    .dd-item.is-active { font-weight: 600; color: var(--brand-accent); }
    .dd-item input[type="checkbox"] { accent-color: var(--sidebar-bg); width: 14px; height: 14px; }

    .dd-arrow { margin-left: auto; font-size: 0.78rem; color: var(--brand-accent); }

    .dd-footer {
      display: flex; gap: 8px; padding: 10px 14px;
      border-top: 1px solid var(--border-light);
    }
    .dd-footer button {
      flex: 1; padding: 7px; border-radius: 6px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none;
    }
    .btn-dd-clear { background: var(--bg-table-header); color: var(--text-secondary); }
    .btn-dd-apply { background: var(--sidebar-bg); color: #fff; }
    .btn-dd-apply:hover { background: #162040; }

    /* ── No results ── */
    .no-results {
      padding: 48px; text-align: center;
      color: var(--text-secondary); font-size: 0.9rem;
      grid-column: 1 / -1;
    }

    /* Icon cursors */
    .section-actions svg { cursor: pointer; transition: fill 0.15s; }
  `;
  document.head.appendChild(styleEl);

  /* ════════════════════════════════════════
     BUILD CARD (grid view)
  ════════════════════════════════════════ */
  function statusClass(s) {
    return s === "Active" ? "green" : s === "Closed" ? "red" : "orange";
  }

  function buildCard(c) {
    const el = document.createElement("div");
    el.className = "case-card";
    el.innerHTML = `
      <div class="card-top">
        <span class="badge light">${c.type}</span>
        <span class="badge ${statusClass(c.status)}">● ${c.status}</span>
      </div>
      <h3>${c.client}</h3>
      <div class="case-meta"><p>${c.id}</p><p>${c.caseType}</p></div>
      <div class="divider"></div>
      <div class="case-footer">
        <p><strong>Lawyer:</strong> ${c.lawyer}</p>
        <p><strong>Court:</strong> ${c.court}</p>
      </div>
      <button class="btn-primary full"><a href="case-documents.html">Manage Documents →</a></button>`;
    return el;
  }

  /* ════════════════════════════════════════
     BUILD ROW (list view)
  ════════════════════════════════════════ */
  function buildRow(c) {
    const el = document.createElement("div");
    el.className = "case-list-row";
    el.innerHTML = `
      <div class="list-col list-col-client">
        <div class="list-avatar">${c.client.charAt(0)}</div>
        <div>
          <div class="list-name">${c.client}</div>
          <div class="list-sub">${c.id}</div>
        </div>
      </div>
      <div class="list-col"><span class="badge light">${c.type}</span></div>
      <div class="list-col list-col-case">${c.caseType}</div>
      <div class="list-col list-col-lawyer">${c.lawyer}</div>
      <div class="list-col list-col-court">${c.court}</div>
      <div class="list-col"><span class="badge ${statusClass(c.status)}">● ${c.status}</span></div>
      <div class="list-col"><a href="case-documents.html" class="list-btn">Manage →</a></div>`;
    return el;
  }

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  function go() {
    let data = [...casesData];

    // 1. Search
    const q = state.search.toLowerCase().trim();
    if (q) {
      data = data.filter(c =>
        c.client.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.caseType.toLowerCase().includes(q) ||
        c.lawyer.toLowerCase().includes(q) ||
        c.court.toLowerCase().includes(q)
      );
    }

    // 2. Filter
    if (state.activeFilters.length) {
      data = data.filter(c => state.activeFilters.includes(c.status));
    }

    // 3. Sort
    data.sort((a, b) => {
      const va = state.sortKey === "date" ? new Date(a.date) : a[state.sortKey].toLowerCase();
      const vb = state.sortKey === "date" ? new Date(b.date) : b[state.sortKey].toLowerCase();
      if (va < vb) return state.sortDir === "asc" ? -1 : 1;
      if (va > vb) return state.sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // 4. Paint
    grid.innerHTML = "";
    grid.className = state.view === "grid" ? "cases-grid" : "cases-list";

    if (!data.length) {
      grid.innerHTML = `<p class="no-results">No cases match your criteria.</p>`;
      return;
    }

    if (state.view === "list") {
      const hdr = document.createElement("div");
      hdr.className = "list-header-row";
      hdr.innerHTML = `<span>Client</span><span>Type</span><span>Case Type</span>
                       <span>Lawyer</span><span>Court</span><span>Status</span><span>Action</span>`;
      grid.appendChild(hdr);
    }

    data.forEach(c => grid.appendChild(state.view === "grid" ? buildCard(c) : buildRow(c)));
  }

  /* ════════════════════════════════════════
     FILTER DROPDOWN
  ════════════════════════════════════════ */
  const filterDD = document.createElement("div");
  filterDD.className = "lex-dropdown";
  filterDD.innerHTML = `
    <div class="dd-section-header">Filter by Status</div>
    ${["Active","Pending","Closed"].map(s =>
      `<label class="dd-item"><input type="checkbox" class="filter-cb" value="${s}"> ${s}</label>`
    ).join("")}
    <div class="dd-footer">
      <button class="btn-dd-clear">Clear</button>
      <button class="btn-dd-apply">Apply</button>
    </div>`;
  document.body.appendChild(filterDD);

  filterDD.querySelector(".btn-dd-clear").addEventListener("click", () => {
    filterDD.querySelectorAll(".filter-cb").forEach(cb => (cb.checked = false));
    state.activeFilters = [];
    go();
    syncFilterIcon();
  });

  filterDD.querySelector(".btn-dd-apply").addEventListener("click", () => {
    state.activeFilters = [...filterDD.querySelectorAll(".filter-cb:checked")].map(cb => cb.value);
    go();
    syncFilterIcon();
    closeAll();
  });

  function syncFilterIcon() {
    iconFilter.style.fill = state.activeFilters.length ? "var(--brand-accent)" : "var(--text-secondary)";
  }

  /* ════════════════════════════════════════
     SORT DROPDOWN
  ════════════════════════════════════════ */
  const sortOpts = [
    { key: "date",   label: "Date" },
    { key: "client", label: "Client Name" },
    { key: "id",     label: "Case ID" },
  ];

  const sortDD = document.createElement("div");
  sortDD.className = "lex-dropdown";
  sortDD.innerHTML = `
    <div class="dd-section-header">Sort by</div>
    ${sortOpts.map(o =>
      `<div class="dd-item sort-opt ${state.sortKey === o.key ? "is-active" : ""}" data-key="${o.key}">
        ${o.label}<span class="dd-arrow">${state.sortKey === o.key ? (state.sortDir === "asc" ? "↑" : "↓") : ""}</span>
       </div>`
    ).join("")}`;
  document.body.appendChild(sortDD);

  sortDD.querySelectorAll(".sort-opt").forEach(item => {
    item.addEventListener("click", () => {
      const key = item.dataset.key;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
      // Refresh indicators
      sortDD.querySelectorAll(".sort-opt").forEach(el => {
        const active = el.dataset.key === state.sortKey;
        el.classList.toggle("is-active", active);
        el.querySelector(".dd-arrow").textContent = active ? (state.sortDir === "asc" ? "↑" : "↓") : "";
      });
      iconSort.style.fill = "var(--brand-accent)";
      go();
    });
  });

  /* ════════════════════════════════════════
     DROPDOWN POSITIONING
  ════════════════════════════════════════ */
  function openDD(dd, anchor) {
    const isOpen = dd.classList.contains("open");
    closeAll();
    if (isOpen) return;
    dd.classList.add("open");
    requestAnimationFrame(() => {
      const rect   = anchor.getBoundingClientRect();
      const ddRect = dd.getBoundingClientRect();
      dd.style.top  = (rect.bottom + window.scrollY + 8) + "px";
      dd.style.left = Math.max(4, rect.right + window.scrollX - ddRect.width) + "px";
    });
  }

  function closeAll() {
    filterDD.classList.remove("open");
    sortDD.classList.remove("open");
  }

  /* ════════════════════════════════════════
     EVENT BINDING
  ════════════════════════════════════════ */
  searchInput.addEventListener("input", e => { state.search = e.target.value; go(); });

  iconFilter.addEventListener("click", e => { e.stopPropagation(); openDD(filterDD, iconFilter); });
  iconSort.addEventListener("click",   e => { e.stopPropagation(); openDD(sortDD,   iconSort);   });

  iconGrid.addEventListener("click", () => { state.view = "grid"; go(); syncViewIcons(); });
  iconList.addEventListener("click", () => { state.view = "list"; go(); syncViewIcons(); });

  // Stop clicks inside dropdowns from bubbling to document
  filterDD.addEventListener("click", e => e.stopPropagation());
  sortDD.addEventListener("click",   e => e.stopPropagation());

  document.addEventListener("click", closeAll);

  function syncViewIcons() {
    iconGrid.style.fill = state.view === "grid" ? "var(--brand-accent)" : "var(--text-secondary)";
    iconList.style.fill = state.view === "list" ? "var(--brand-accent)" : "var(--text-secondary)";
  }

  /* ─── Boot ─── */
  syncViewIcons();
  go();

})();