/* ===================================================
   LexFlow — Case Documents
   hrtll.js — Case-centric, Multi-user, Multi-firm, Role-based
   ===================================================
   🔧 TO SWITCH USER: change CURRENT_USER_EMAIL below
   🔧 TO SWITCH CASE: change CURRENT_CASE_ID below

   ── FIRM-01 · Mehta & Associates ──────────────────
   Available emails:
     mehta@lexflow.in          → lawyer        (Adv. Mehta)       — CASE-45, CASE-46
     sharma@lexflow.in         → lawyer        (Adv. Sharma)      — CASE-45, CASE-46
     priya.intern@lexflow.in   → intern        (Intern Priya)     — CASE-45, CASE-46
     rohan.intern@lexflow.in   → intern        (Intern Rohan)     — CASE-45, CASE-46
     rahul.client@gmail.com    → client        (Rahul Sharma)     — CASE-45
     anita.client@gmail.com    → client        (Anita Desai)      — CASE-46
     admin@lexflow.in          → lawfirm_admin (Admin)            — CASE-45, CASE-46

   ── FIRM-02 · Kapoor Legal Partners ───────────────
   Available emails:
     kapoor@kapoorlegal.in     → lawyer        (Adv. Kapoor)      — CASE-47, CASE-48
     nair@kapoorlegal.in       → lawyer        (Adv. Nair)        — CASE-47, CASE-48
     vikram.client@gmail.com   → client        (Vikram Malhotra)  — CASE-47
     sunita.client@gmail.com   → client        (Sunita Rao)       — CASE-48
     admin@kapoorlegal.in      → lawfirm_admin (Admin KLP)        — CASE-47, CASE-48

   ── Available case IDs ────────────────────────────
     CASE-45  →  Property Dispute     (FIRM-01, client: Rahul Sharma)
     CASE-46  →  Divorce Settlement   (FIRM-01, client: Anita Desai)
     CASE-47  →  Corporate Fraud      (FIRM-02, client: Vikram Malhotra)
     CASE-48  →  Employment Dispute   (FIRM-02, client: Sunita Rao)

   ── Cross-firm rules ──────────────────────────────
   • A user can ONLY access cases belonging to their own firm
     (or cases explicitly in their caseAccess, for shared clients)
   • Clients are firmless — they can only see cases in their caseAccess
   • lawfirm_admin can only manage their own firm's cases
   • Interns only see SHARED documents within their access list
   =================================================== */

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const currentUser = safeParse(localStorage.getItem('currentUser'), null);
const userRole =
  (currentUser && currentUser.role) ||
  localStorage.getItem('userRole') ||
  'client';

// Fallback role email map used only when currentUser is unavailable.
const roleToEmailMap = {
  client: 'rahul.client@gmail.com',
  firmAdmin: 'mehta@lexflow.in',
  'firm-admin': 'mehta@lexflow.in',
  lawfirm_admin: 'admin@lexflow.in',
  lawyer: 'mehta@lexflow.in',
  intern: 'priya.intern@lexflow.in',
};

const CURRENT_USER_EMAIL =
  (currentUser && currentUser.email) ||
  roleToEmailMap[userRole] ||
  roleToEmailMap.client;

const urlParams = new URLSearchParams(window.location.search);
const urlCaseId = urlParams.get('caseId');

if (urlCaseId) {
  localStorage.setItem('caseId', urlCaseId);
}

const CURRENT_CASE_ID =
  urlCaseId ||
  localStorage.getItem('caseId') ||
  localStorage.getItem('currentCaseId') ||
  'CASE-45';

(function () {
  "use strict";

  /* ════════════════════════════════════════
     LOCAL STORAGE KEYS
  ════════════════════════════════════════ */
  const LS_DELETED        = "lexflow_deleted_ids";
  const LS_UPLOADS        = "lexflow_uploaded_docs";
  const LS_UPDATES        = "lexflow_updated_docs";
  const LS_ACTIVITY       = "lexflow_activity_log";
  const LS_DOCS_INDEX     = "lexflow_documents";
  const USERS_JSON_PATH   = "../data/docs.json";

  /* ════════════════════════════════════════
     LOCAL STORAGE HELPERS
  ════════════════════════════════════════ */
  function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch(e) { console.warn("LS write failed", e); }
  }

  /* ════════════════════════════════════════
     PERSISTENT STATE (loaded before fetch)
  ════════════════════════════════════════ */
  let deletedIds   = new Set(lsGet(LS_DELETED, []));
  let uploadedDocs = lsGet(LS_UPLOADS, []);
  let updatedMap   = lsGet(LS_UPDATES, {});
  let activityLog  = lsGet(LS_ACTIVITY, []);

  /* ════════════════════════════════════════
     INJECT CSS
  ════════════════════════════════════════ */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    .view-toggle svg { cursor: pointer; transition: fill 0.15s; }

    /* ── List view ── */
    .documents-list {
      width: 100%; display: flex; flex-direction: column;
      background: #fff; border-radius: 12px;
      border: 1px solid var(--border-light);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04); overflow: hidden;
    }
    .doc-list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1.5fr;
      padding: 10px 18px; gap: 8px;
      background: var(--bg-table-header);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-secondary);
    }
    .doc-list-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 1.5fr;
      align-items: center; padding: 11px 18px; gap: 8px;
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
      font-size: 0.6rem; font-weight: 700; flex-shrink: 0; color: #555;
    }
    .doc-icon-sm.green  { background: #e6f9f0; }
    .doc-icon-sm.orange { background: #fff4e6; }
    .doc-icon-sm.blue   { background: #eff6ff; }
    .dlc-secondary { color: var(--text-secondary); }
    .doc-list-actions { display: flex; gap: 4px; flex-wrap: wrap; }
    .doc-list-actions button {
      padding: 5px 9px; font-size: 0.72rem; font-weight: 500;
      border-radius: 5px; border: 1px solid var(--border-light);
      background: #fff; cursor: pointer; color: var(--text-primary);
      transition: background 0.12s;
    }
    .doc-list-actions button:hover { background: var(--bg-table-header); }
    .doc-list-actions button.danger { color: #be123c; border-color: #fecdd3; }
    .doc-list-actions button.danger:hover { background: #fff1f2; }

    /* ── Tags / Badges ── */
    .tag { font-size: 0.7rem; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
    .tag.contract   { background: var(--blue-bg);   color: var(--blue-text); }
    .tag.evidence   { background: var(--red-bg);    color: var(--red-text); }
    .tag.order      { background: var(--green-bg);  color: var(--green-text); }
    .tag.proof      { background: var(--orange-bg); color: var(--orange-text); }
    .tag.affidavit  { background: #faf5ff;          color: #7c3aed; }
    .tag.report     { background: #f0fdf4;          color: #166534; }
    .tag.default    { background: #f1f5f9;          color: #475569; }
    .access-badge { font-size: 0.68rem; padding: 3px 8px; border-radius: 999px; font-weight: 600; }
    .access-badge.private { background: #f1f5f9; color: #64748b; }
    .access-badge.shared  { background: var(--green-bg); color: var(--green-text); }

    /* ── Sort/Filter Dropdowns ── */
    .lex-dd {
      position: absolute; min-width: 190px; background: #fff;
      border: 1px solid var(--border-light); border-radius: var(--radius-md);
      box-shadow: 0 8px 28px rgba(0,0,0,0.11); z-index: 9999;
      display: none; flex-direction: column; overflow: hidden;
    }
    .lex-dd.open { display: flex; }
    .dd-head {
      padding: 10px 14px 8px; font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
      color: var(--text-secondary); border-bottom: 1px solid var(--border-light);
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
    .dd-foot { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border-light); }
    .dd-foot button { flex: 1; padding: 7px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; }
    .dd-clear { background: var(--bg-table-header); color: var(--text-secondary); }
    .dd-apply { background: var(--sidebar-bg); color: #fff; }

    /* ── No results ── */
    .no-docs { padding: 48px; text-align: center; color: var(--text-secondary); font-size: 0.9rem; }

    /* ── Upload modal ── */
    .upload-modal.active { display: flex; }
    .upload-modal__drop-icon svg { display: block; margin: 0 auto; }
    .upload-modal__dropzone.drag-over { border-color: var(--brand-accent); background: #eff6ff; }
    .upload-modal__dropzone { cursor: pointer; }
    .file-preview {
      display: flex; align-items: center; gap: 10px;
      margin-top: 12px; padding: 10px 14px;
      background: #f1f5f9; border-radius: 8px;
      font-size: 0.8rem; color: var(--text-primary);
    }
    .file-preview span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-preview button { background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 1rem; padding: 0 4px; }
    .file-preview button:hover { color: #be123c; }

    /* ── View Modal ── */
    .view-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      z-index: 10000; display: none; align-items: center; justify-content: center;
    }
    .view-modal-overlay.active { display: flex; }
    .view-modal-box {
      background: #fff; border-radius: 14px;
      width: min(92vw, 900px); max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .view-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid var(--border-light); gap: 12px;
    }
    .view-modal-header h3 { font-size: 0.95rem; font-weight: 600; margin: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .view-modal-close {
      background: none; border: none; cursor: pointer;
      font-size: 1.2rem; color: var(--text-secondary);
      padding: 4px 8px; border-radius: 6px; line-height: 1;
    }
    .view-modal-close:hover { background: #f1f5f9; }
    .view-modal-body {
      flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center;
      padding: 20px; background: #f8f9fb;
    }
    .view-modal-body iframe { width: 100%; height: 65vh; border: none; border-radius: 8px; background: #fff; }
    .view-modal-body img { max-width: 100%; max-height: 65vh; border-radius: 8px; object-fit: contain; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .view-modal-footer {
      padding: 12px 20px; border-top: 1px solid var(--border-light);
      display: flex; justify-content: flex-end; gap: 8px;
    }
    .view-modal-footer button {
      padding: 8px 16px; border-radius: 7px; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border-light); background: #fff;
      color: var(--text-primary); transition: background 0.12s;
    }
    .view-modal-footer button:hover { background: var(--bg-table-header); }
    .view-modal-footer button.primary { background: var(--sidebar-bg); color: #fff; border-color: transparent; }
    .view-modal-footer button.primary:hover { opacity: 0.9; }

    /* ── Update Modal ── */
    .update-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55);
      z-index: 10000; display: none; align-items: center; justify-content: center;
    }
    .update-modal-overlay.active { display: flex; }
    .update-modal-box {
      background: #fff; border-radius: 14px; width: min(92vw, 520px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;
    }
    .update-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border-light);
    }
    .update-modal-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; }
    .update-modal-close { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: var(--text-secondary); padding: 4px 8px; border-radius: 6px; }
    .update-modal-close:hover { background: #f1f5f9; }
    .update-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .update-modal-body label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); display: block; margin-bottom: 5px; }
    .update-modal-body input, .update-modal-body select {
      width: 100%; padding: 9px 12px; border: 1px solid var(--border-light); border-radius: 7px;
      font-size: 0.85rem; color: var(--text-primary); background: #fff; box-sizing: border-box;
    }
    .update-modal-body input:focus, .update-modal-body select:focus { outline: none; border-color: var(--brand-accent); }
    .update-meta-note { font-size: 0.75rem; color: var(--text-secondary); background: #f8f9fb; border-radius: 7px; padding: 10px 14px; border-left: 3px solid var(--brand-accent); }
    .update-dropzone { border: 2px dashed var(--border-light); border-radius: 9px; padding: 24px; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
    .update-dropzone:hover, .update-dropzone.drag-over { border-color: var(--brand-accent); background: #eff6ff; }
    .update-dropzone p { margin: 6px 0 0; font-size: 0.8rem; color: var(--text-secondary); }
    .update-dropzone strong { font-size: 0.85rem; color: var(--text-primary); }
    .update-modal-footer { padding: 14px 20px; border-top: 1px solid var(--border-light); display: flex; justify-content: flex-end; gap: 8px; }
    .update-modal-footer button { padding: 9px 18px; border-radius: 7px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border-light); background: #fff; color: var(--text-primary); }
    .update-modal-footer button:hover { background: var(--bg-table-header); }
    .update-modal-footer button.primary { background: var(--sidebar-bg); color: #fff; border-color: transparent; }
    .update-modal-footer button.primary:hover { opacity: 0.88; }

    /* ── Delete confirm ── */
    .del-confirm-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 10001; display: none; align-items: center; justify-content: center;
    }
    .del-confirm-overlay.active { display: flex; }
    .del-confirm-box {
      background: #fff; border-radius: 12px; width: min(92vw, 400px);
      padding: 28px 28px 22px; box-shadow: 0 16px 48px rgba(0,0,0,0.18); text-align: center;
    }
    .del-confirm-box .del-icon { width: 52px; height: 52px; border-radius: 50%; background: #fff1f2; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    .del-confirm-box h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 700; }
    .del-confirm-box p { margin: 0 0 22px; font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; }
    .del-confirm-box .del-name { font-weight: 600; color: var(--text-primary); }
    .del-confirm-actions { display: flex; gap: 10px; justify-content: center; }
    .del-confirm-actions button { flex: 1; padding: 10px; border-radius: 7px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border-light); background: #fff; }
    .del-confirm-actions button.cancel-btn:hover { background: #f1f5f9; }
    .del-confirm-actions button.delete-btn { background: #be123c; color: #fff; border-color: #be123c; }
    .del-confirm-actions button.delete-btn:hover { background: #9f1239; }

    /* ── Toast ── */
    .lex-toast {
      position: fixed; bottom: 24px; right: 24px; padding: 12px 20px;
      border-radius: 8px; font-size: 0.85rem; font-weight: 600; z-index: 99999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15); animation: toast-in 0.25s ease;
    }
    .lex-toast.success { background: #1e2a4a; color: #fff; }
    .lex-toast.error   { background: #be123c; color: #fff; }
    .lex-toast.warn    { background: #92400e; color: #fff; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Access denied banner ── */
    .no-case-access {
      padding: 60px 24px; text-align: center; background: #fff;
      border-radius: 12px; border: 1px solid #fecdd3; margin: 24px 0;
    }
    .no-case-access h2 { color: #be123c; margin-bottom: 8px; }
    .no-case-access p  { color: #64748b; font-size: 0.9rem; }
    .no-case-access .deny-reason { font-size: 0.78rem; margin-top: 6px; background: #fff1f2; display: inline-block; padding: 4px 12px; border-radius: 999px; color: #9f1239; font-weight: 600; }
  `;
  document.head.appendChild(styleEl);

  /* ════════════════════════════════════════
     WAIT FOR SHARED STORAGE TO LOAD
  ════════════════════════════════════════ */
  function waitForCasesStorage(maxWait = 5000) {
    return new Promise((resolve, reject) => {
      console.log("⏳ Waiting for cases-storage.js (max", maxWait, "ms)...");
      const start = Date.now();
      const checkInterval = setInterval(() => {
        if (window.LexFlowCasesStorage) {
          const waited = Date.now() - start;
          console.log("✓ cases-storage.js found after", waited, "ms");
          clearInterval(checkInterval);
          resolve(window.LexFlowCasesStorage);
        } else if (Date.now() - start > maxWait) {
          clearInterval(checkInterval);
          const waited = Date.now() - start;
          console.error("✗ cases-storage.js NOT found after", waited, "ms (timeout)");
          reject(new Error("cases-storage.js did not load in time"));
        }
      }, 50);
    });
  }

  /* ════════════════════════════════════════
     BOOT — LOAD FROM STORAGE, THEN INITIALISE
  ════════════════════════════════════════ */
  async function bootApp() {
    console.log("=== bootApp() STARTING ===");
    try {
      // Step 1: Wait for shared storage utility, or use direct localStorage
      console.log("Step 1: Getting users from storage...");
      let casesStorageUsers = [];
      try {
        const casesStorage = await waitForCasesStorage(2000);  // Shorter timeout (2s instead of 5s)
        console.log("✓ cases-storage.js loaded");
        casesStorageUsers = await casesStorage.getUsers();
        console.log("✓ Loaded users from shared storage:", casesStorageUsers.length, "users");
      } catch (e) {
        console.warn("Could not use shared storage, falling back to direct localStorage:", e.message);
        // Fallback: load users directly from localStorage
        const usersJson = localStorage.getItem('lexflow_users');
        casesStorageUsers = usersJson ? JSON.parse(usersJson) : [];
        console.log("✓ Loaded", casesStorageUsers.length, "users from direct localStorage");
      }
      
      // Step 2: Fetch fallback data from docs.json for cases/documents/firms
      console.log("Step 2: Fetching fallback data from docs.json...");
      let fullDb = null;
      try {
        const resp = await fetch(USERS_JSON_PATH);
        if (resp.ok) {
          fullDb = await resp.json();
          console.log("✓ Loaded fallback data from docs.json");
        } else {
          console.warn("docs.json returned status:", resp.status);
        }
      } catch (e) {
        console.warn("Could not fetch docs.json, using storage data only:", e);
      }
      
      // Step 3: Merge users from storage (priority) with fallback JSON users
      console.log("Step 3: Merging user data...");
      const mergedUsers = [...casesStorageUsers];
      console.log("Starting merge with", mergedUsers.length, "storage users");
      
      if (fullDb && Array.isArray(fullDb.users)) {
        const existingEmails = new Set(mergedUsers.map(u => u.email));
        const newUsersCount = fullDb.users.filter(u => !existingEmails.has(u.email)).length;
        fullDb.users.forEach(u => {
          if (!existingEmails.has(u.email)) {
            mergedUsers.push(u);
          }
        });
        console.log("✓ Merged", newUsersCount, "additional users from JSON. Total:", mergedUsers.length);
      }
      
      // Also add currentUser from localStorage if not already in list
      const localUser = safeParse(localStorage.getItem('currentUser'), null);
      if (localUser && localUser.email) {
        const exists = mergedUsers.find(u => u.email === localUser.email);
        if (!exists) {
          console.log("✓ Adding current login user:", localUser.email);
          mergedUsers.push(localUser);
        }
      }
      
      console.log("Final merged users:", mergedUsers.map(u => u.email));
      
      // Step 4: Build synthetic db with merged data
      console.log("Step 4: Building database...");
      const db = {
        users: mergedUsers,
        cases: (fullDb && fullDb.cases) || [],
        documents: (fullDb && fullDb.documents) || [],
        firms: (fullDb && fullDb.firms) || [],
      };
      console.log("✓ Database ready. Users:", db.users.length, "Cases:", db.cases.length);
      
      // Step 5: Initialize page with merged data
      console.log("Step 5: Initializing page...");
      try {
        init(db);
        console.log("=== bootApp() SUCCESS ===");
      } catch (initErr) {
        console.error("❌ init() threw an error:", initErr);
        throw initErr;  // Re-throw to be caught by outer catch
      }
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      const errorDetail = `${err.name}: ${errorMsg}`;
      
      console.error("❌ bootApp() FAILED:", {
        message: errorMsg,
        stack: err.stack,
        error: err,
        casesStorageAvailable: !!window.LexFlowCasesStorage,
        localStorageUsers: localStorage.getItem('lexflow_users') ? 'present' : 'missing',
        currentUser: localStorage.getItem('currentUser') ? 'present' : 'missing'
      });
      
      // Show error - use alert as fallback since toast might not be defined yet
      const hasStorage = !!window.LexFlowCasesStorage ? 'storage OK' : 'storage NOT loaded';
      const msg = `Failed: ${errorMsg} (${hasStorage})`;
      
      // Try to use toast if available, otherwise use alert + console
      if (typeof toast === 'function') {
        toast(msg, "error");
      } else {
        console.error("⚠️ COULD NOT SHOW ERROR - toast function not defined yet!");
        console.error("Error message:", msg);
        // Show alert as user-visible fallback
        setTimeout(() => {
          alert("Failed to load documents:\n" + msg + "\n\nCheck browser console (F12) for details.");
        }, 100);
      }
    }
  }
  
  // Boot the app
  bootApp();

  /* ════════════════════════════════════════
     MAIN INIT — runs once data is loaded
  ════════════════════════════════════════ */
  function init(db) {
    console.log("📋 init() CALLED with data:", { users: db.users?.length, cases: db.cases?.length, docs: db.documents?.length, firms: db.firms?.length });

    /* ── Validate db structure ── */
    if (!db.users || !db.cases || !db.documents || !db.firms) {
      const missing = [];
      if (!db.users) missing.push("users");
      if (!db.cases) missing.push("cases");
      if (!db.documents) missing.push("documents");
      if (!db.firms) missing.push("firms");
      console.error("❌ Missing required fields:", missing);
      const msg = `Document data is missing required fields: ${missing.join(", ")}`;
      if (typeof toast === 'function') {
        toast(msg, "error");
      } else {
        console.error(msg);
        alert(msg);
      }
      return;
    }

    /* ── Resolve current user — prioritize localStorage over email lookup ── */
    console.log("Resolving current user...");
    let CURRENT_USER = null;
    
    // First, check if we have a valid currentUser in localStorage
    const localUser = safeParse(localStorage.getItem('currentUser'), null);
    if (localUser && localUser.email) {
      CURRENT_USER = db.users.find(u => u.email === localUser.email);
      if (CURRENT_USER) {
        console.log("✓ Found user from localStorage:", CURRENT_USER.email);
      }
    }
    
    // Fall back to email-based lookup
    if (!CURRENT_USER) {
      CURRENT_USER = db.users.find(u => u.email === CURRENT_USER_EMAIL);
      if (CURRENT_USER) {
        console.log("✓ Found user by email lookup:", CURRENT_USER.email);
      }
    }
    
    // If user not found, show helpful error with available users
    if (!CURRENT_USER) {
      const availableEmails = db.users.map(u => u.email).slice(0, 5);
      const extraInfo = db.users.length > 5 
        ? ` ... and ${db.users.length - 5} more` 
        : '';
      console.error("Available users in system:", db.users.map(u => u.email));
      console.error("Looking for:", CURRENT_USER_EMAIL);
      toast(
        `User "${CURRENT_USER_EMAIL}" not found. ` +
        `Available: ${availableEmails.join(', ')}${extraInfo}`,
        "error"
      );
      return;
    }
    
    // Validate required user properties
    if (!CURRENT_USER.role) {
      console.error("User found but missing 'role':", CURRENT_USER);
      toast(`User profile incomplete: missing role. Contact administrator.`, "error");
      return;
    }
    
    const ROLE = CURRENT_USER.role;

    /* ── Resolve firm for this user ── */
    const CURRENT_FIRM = CURRENT_USER.firmId
      ? db.firms.find(f => f.id === CURRENT_USER.firmId) || null
      : null;
    const FIRM_NAME = CURRENT_FIRM ? CURRENT_FIRM.name : "Independent";

    /* ── Resolve current case ── */
    const CURRENT_CASE = db.cases.find(c => c.id === CURRENT_CASE_ID);
    if (!CURRENT_CASE) {
      renderAccessDenied(`Case "${CURRENT_CASE_ID}" does not exist.`, "CASE_NOT_FOUND");
      renderRoleBadge(CURRENT_USER, ROLE, FIRM_NAME);
      return;
    }

    /* ── CROSS-FIRM GUARD ──────────────────────────────────────────
       Rule: non-client users can only access cases from their own firm.
       Clients are firmless — they rely solely on explicit caseAccess entries.
       Exception: a user whose caseAccess explicitly lists this case is
       granted access even if the firm IDs don't match (e.g. co-counsel).
    ─────────────────────────────────────────────────────────────── */
    const userHasExplicitCaseAccess = !!(
      CURRENT_USER.caseAccess && CURRENT_USER.caseAccess[CURRENT_CASE_ID]
    );

    if (ROLE !== "client") {
      // Non-clients must either belong to the case's firm OR have explicit access
      const caseFromOtherFirm = CURRENT_FIRM && CURRENT_CASE.firmId !== CURRENT_FIRM.id;
      if (caseFromOtherFirm && !userHasExplicitCaseAccess) {
        console.warn("Cross-firm access denied:", {
          userFirm: CURRENT_FIRM?.id,
          caseFirm: CURRENT_CASE.firmId,
          hasExplicitAccess: userHasExplicitCaseAccess
        });
        renderAccessDenied(
          `${CURRENT_CASE_ID} belongs to a different firm and you have not been granted access.`,
          "CROSS_FIRM_VIOLATION"
        );
        renderRoleBadge(CURRENT_USER, ROLE, FIRM_NAME);
        return;
      }
    }

    /* ── Check user has per-document access to this case ── */
    let userCaseDocIds = null;
    
    // Special rule: lawfirm_admin gets access to ALL documents in their firm's cases
    if (ROLE === "lawfirm_admin" && CURRENT_FIRM && CURRENT_CASE.firmId === CURRENT_FIRM.id) {
      // Lawfirm admin gets ALL docs in their firm's cases
      userCaseDocIds = db.documents
        .filter(d => d.caseId === CURRENT_CASE_ID)
        .map(d => d.id);
      console.log("✓ lawfirm_admin auto-access to", userCaseDocIds.length, "documents in firm case");
    } else if (userHasExplicitCaseAccess) {
      // Otherwise use explicit caseAccess
      userCaseDocIds = CURRENT_USER.caseAccess[CURRENT_CASE_ID];
    }

    if (!userCaseDocIds || userCaseDocIds.length === 0) {
      console.warn("No document access for case:", {
        caseId: CURRENT_CASE_ID,
        userRole: ROLE,
        userFirmId: CURRENT_USER.firmId,
        caseFirmId: CURRENT_CASE.firmId,
        userHasExplicitCaseAccess,
        userCaseDocIds,
        caseAccess: CURRENT_USER.caseAccess
      });
      renderAccessDenied(
        `You do not have document access to ${CURRENT_CASE_ID}. ` +
        `Contact your firm administrator to request access.`,
        "NO_DOC_ACCESS"
      );
      renderRoleBadge(CURRENT_USER, ROLE, FIRM_NAME);
      return;
    }

    /* ── Write active email to LS for activity-log.html ── */
    localStorage.setItem("lexflow_active_email", CURRENT_USER_EMAIL);
    localStorage.setItem("lexflow_active_firm",  CURRENT_USER.firmId || "");

    /* ── Per-user uploaded doc IDs ── */
    const LS_USER_UPLOADS = `lexflow_user_uploads_${CURRENT_USER.id}`;
    let userUploadIds = new Set(lsGet(LS_USER_UPLOADS, []));

    /* ════════════════════════════════════════
       BUILD DOC LIST FOR CURRENT USER + CASE
    ════════════════════════════════════════ */
    const allowedIds = new Set(userCaseDocIds);

    // Master docs: belong to this case AND within this user's allowed ID list AND not deleted
    let docsData = db.documents
      .filter(d =>
        d.caseId === CURRENT_CASE_ID &&
        allowedIds.has(d.id) &&
        !deletedIds.has(d.id)
      )
      .map(d => updatedMap[d.id] ? { ...d, ...updatedMap[d.id] } : { ...d });

    // Session-uploaded docs: same case, uploaded by this user (or in their upload ID set), not deleted
    const extraUploads = uploadedDocs.filter(d =>
      d.caseId === CURRENT_CASE_ID &&
      !deletedIds.has(d.id) &&
      (userUploadIds.has(d.id) || d.uploaderEmail === CURRENT_USER.email)
    ).map(d => updatedMap[d.id] ? { ...d, ...updatedMap[d.id] } : { ...d });

    const seen = new Set(docsData.map(d => d.id));
    extraUploads.forEach(d => { if (!seen.has(d.id)) { docsData.push(d); seen.add(d.id); } });

    /* ════════════════════════════════════════
       PERMISSIONS
    ════════════════════════════════════════ */
    const PERMS = {
      canView:     true,
      canDownload: true,
      canUpload:   ["client", "lawyer", "lawfirm_admin"].includes(ROLE),
      canUpdate:   ["lawyer", "lawfirm_admin", "intern"].includes(ROLE),
      canDelete:   ["lawyer", "lawfirm_admin"].includes(ROLE),
    };

    /* ════════════════════════════════════════
       ACTIVITY LOG HELPERS
    ════════════════════════════════════════ */
    function logActivity(action, doc) {
      const entry = {
        id:      "ACT-" + Date.now(),
        date:    new Date().toISOString(),
        user:    CURRENT_USER.name,
        email:   CURRENT_USER.email,
        role:    ROLE,
        firmId:  CURRENT_USER.firmId || null,
        firmName: FIRM_NAME,
        caseId:  CURRENT_CASE_ID,
        action,
        docId:   doc.id,
        docName: doc.name,
        docType: doc.type,
        access:  doc.access,
      };
      activityLog.unshift(entry);
      if (activityLog.length > 500) activityLog = activityLog.slice(0, 500);
      lsSet(LS_ACTIVITY, activityLog);
      refreshSidePanelActivity();
    }

    /* ════════════════════════════════════════
       ROLE BADGE
    ════════════════════════════════════════ */
    renderRoleBadge(CURRENT_USER, ROLE, FIRM_NAME);

    /* ════════════════════════════════════════
       DOM REFERENCES
    ════════════════════════════════════════ */
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

    /* ── Defensive DOM checks ── */
    if (!grid || !searchInput || !typeSelect || !totalEl || !uploadBtn || !modal) {
      console.error("hrtll.js: Required DOM elements missing. Check HTML structure.");
      toast("Page structure error — required elements not found.", "error");
      return;
    }

    /* ── Update breadcrumb & case header with live data ── */
    const breadcrumb = document.querySelector(".breadcrumb");
    if (breadcrumb) {
      breadcrumb.innerHTML = `<a href="documents-main.html" style="color: inherit; text-decoration: none;">Documents</a> > <span>${CURRENT_CASE.title} (${CURRENT_CASE_ID})</span>`;
    }
    const caseTitle = document.querySelector(".case-header h1");
    if (caseTitle) {
      caseTitle.innerHTML = `${CURRENT_CASE.title} <span class="status">${CURRENT_CASE.status}</span>`;
    }
    const caseIdEl = document.querySelector(".case-header p strong");
    if (caseIdEl) caseIdEl.textContent = CURRENT_CASE_ID;

    /* ── Update case meta fields if present ── */
    const metaDivs = document.querySelectorAll(".case-meta > div");
    if (metaDivs.length >= 4) {
      const caseLayer  = db.users.find(u => u.id === CURRENT_CASE.lawyerId);
      const caseClient = db.users.find(u => u.id === CURRENT_CASE.clientId);
      metaDivs[0].innerHTML = `<span>FIRM</span>${FIRM_NAME}`;
      metaDivs[2].innerHTML = `<span>LAWYER</span>${caseLayer ? caseLayer.name : "—"}`;
      metaDivs[3].innerHTML = `<span>COURT</span>${CURRENT_CASE.court}`;
      if (caseClient) {
        metaDivs[1].innerHTML = `<span>CLIENT NAME</span>${caseClient.name}`;
      }
    }

    /* ════════════════════════════════════════
       UI STATE
    ════════════════════════════════════════ */
    const uiState = {
      view: "grid",
      search: "",
      sortKey: "date",
      sortDir: "desc",
      typeFilter: "All Types",
    };
    let activeAccess = [];

    /* ════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════ */
    function tagClass(type) {
      const map = {
        "CONTRACT":     "contract",
        "CASE EVIDENCE":"evidence",
        "COURT ORDER":  "order",
        "CLIENT PROOF": "proof",
        "AFFIDAVIT":    "affidavit",
        "REPORT":       "report"
      };
      return map[(type || "").toUpperCase()] || "default";
    }
    function tagClassLegacy(type) {
      const map = { "CONTRACT":"","CASE EVIDENCE":"red","COURT ORDER":"green","CLIENT PROOF":"red" };
      return map[(type || "").toUpperCase()] ?? "";
    }
    function fmtDate(iso) {
      if (!iso) return "—";
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
    }
    function isImage(name) {
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name || "");
    }
    function sanitize(str) {
      const d = document.createElement("div");
      d.textContent = str || "";
      return d.innerHTML;
    }
    function nextDocId() {
      const allKnownIds = [...db.documents, ...uploadedDocs]
        .map(d => parseInt((d.id || "").replace("DOC-", ""), 10))
        .filter(n => !isNaN(n));
      const maxId = allKnownIds.length ? Math.max(...allKnownIds) : 210;
      return "DOC-" + (maxId + 1);
    }

    function syncSharedDocumentsIndex() {
      const baseDocs = db.documents
        .filter(d => !deletedIds.has(d.id))
        .map(d => updatedMap[d.id] ? { ...d, ...updatedMap[d.id] } : { ...d });

      const uploadDocs = uploadedDocs
        .filter(d => !deletedIds.has(d.id))
        .map(d => updatedMap[d.id] ? { ...d, ...updatedMap[d.id] } : { ...d });

      const merged = [...baseDocs];
      const seen = new Set(merged.map(d => d.id));
      uploadDocs.forEach((d) => {
        if (!seen.has(d.id)) {
          merged.push(d);
          seen.add(d.id);
        }
      });

      const normalized = merged.map((d) => {
        const caseMeta = db.cases.find((c) => c.id === d.caseId) || {};
        return {
          id: d.id,
          caseId: d.caseId || "",
          caseCnr: d.caseCnr || d.caseId || "",
          caseTitle: caseMeta.title || d.caseTitle || "",
          court: caseMeta.court || d.court || "",
          name: d.name,
          type: d.type,
          date: d.date,
          status: d.status || "Reviewing",
          access: d.access || "PRIVATE",
        };
      });

      lsSet(LS_DOCS_INDEX, normalized);
    }

    /* ════════════════════════════════════════
       POPULATE TYPE SELECT
    ════════════════════════════════════════ */
    function refreshTypeSelect() {
      const allTypes = [...new Set(docsData.map(d => d.type).filter(Boolean))].sort();
      typeSelect.innerHTML = `<option>All Types</option>` +
        allTypes.map(t => `<option>${sanitize(t)}</option>`).join("");
    }

    /* ════════════════════════════════════════
       BUILD CARD / ROW
    ════════════════════════════════════════ */
    function buildCard(d) {
      const el = document.createElement("div");
      el.className = "doc-card";
      el.innerHTML = `
        <div class="doc-header">
          <div class="doc-icon ${sanitize(d.iconColor || "green")}">${sanitize(d.fileType || "FILE")}</div>
          <div>
            <h3>${sanitize(d.name)}</h3>
            <div class="tags">
              <span>${sanitize(d.id)}</span>
              <span class="${tagClassLegacy(d.type)}">${sanitize(d.type)}</span>
            </div>
          </div>
          <span class="badge ${d.access === 'SHARED' ? 'green' : ''}">${sanitize(d.access)}</span>
        </div>
        <div class="doc-meta">
          <div><span>UPLOADER</span>${sanitize(d.uploader)}</div>
          <div><span>DATE</span>${fmtDate(d.date)}</div>
          <div><span>VERSION</span>v${sanitize(String(d.version ?? 1))}</div>
        </div>
        <div class="doc-actions">
          <button data-action="view">View</button>
          <button data-action="download">Download</button>
          ${PERMS.canUpdate ? `<button data-action="update">Update</button>` : ""}
          ${PERMS.canDelete ? `<button data-action="delete">Delete</button>` : ""}
        </div>`;
      bindCardActions(el, d);
      return el;
    }

    function buildRow(d) {
      const el = document.createElement("div");
      el.className = "doc-list-row";
      el.innerHTML = `
        <div class="dlc dlc-name">
          <div class="doc-icon-sm ${sanitize(d.iconColor || "green")}">${sanitize(d.fileType || "FILE")}</div>
          <div>
            <div>${sanitize(d.name)}</div>
            <div class="dlc-sub">${sanitize(d.id)}</div>
          </div>
        </div>
        <div class="dlc"><span class="tag ${tagClass(d.type)}">${sanitize(d.type)}</span></div>
        <div class="dlc dlc-secondary">${sanitize(d.uploader)}</div>
        <div class="dlc dlc-secondary">${fmtDate(d.date)}</div>
        <div class="dlc dlc-secondary">v${sanitize(String(d.version ?? 1))}</div>
        <div class="dlc"><span class="access-badge ${(d.access || "").toLowerCase()}">${sanitize(d.access)}</span></div>
        <div class="dlc doc-list-actions">
          <button data-action="view">View</button>
          <button data-action="download">Download</button>
          ${PERMS.canUpdate ? `<button data-action="update">Update</button>` : ""}
          ${PERMS.canDelete ? `<button data-action="delete" class="danger">Delete</button>` : ""}
        </div>`;
      bindCardActions(el, d);
      return el;
    }

    function bindCardActions(el, d) {
      el.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
          switch (btn.dataset.action) {
            case "view":     openViewModal(d);     break;
            case "download": downloadDoc(d);       break;
            case "update":
              if (!PERMS.canUpdate) { toast("You do not have permission to update documents.", "error"); return; }
              openUpdateModal(d);
              break;
            case "delete":
              if (!PERMS.canDelete) { toast("You do not have permission to delete documents.", "error"); return; }
              openDeleteConfirm(d);
              break;
          }
        });
      });
    }

    /* ════════════════════════════════════════
       VIEW MODAL
    ════════════════════════════════════════ */
    const viewOverlay = document.createElement("div");
    viewOverlay.className = "view-modal-overlay";
    viewOverlay.innerHTML = `
      <div class="view-modal-box">
        <div class="view-modal-header">
          <h3 class="vm-title"></h3>
          <button class="view-modal-close">✕</button>
        </div>
        <div class="view-modal-body vm-body"></div>
        <div class="view-modal-footer">
          <button class="vm-dl-btn primary">⬇ Download</button>
          <button class="vm-close-btn">Close</button>
        </div>
      </div>`;
    document.body.appendChild(viewOverlay);

    viewOverlay.querySelector(".view-modal-close").addEventListener("click", closeViewModal);
    viewOverlay.querySelector(".vm-close-btn").addEventListener("click", closeViewModal);
    viewOverlay.addEventListener("click", e => { if (e.target === viewOverlay) closeViewModal(); });

    let _currentViewDoc = null;
    viewOverlay.querySelector(".vm-dl-btn").addEventListener("click", () => {
      if (_currentViewDoc) downloadDoc(_currentViewDoc);
    });

    function openViewModal(d) {
      _currentViewDoc = d;
      viewOverlay.querySelector(".vm-title").textContent = `${d.name}  ·  ${d.id}  ·  v${d.version ?? 1}`;
      const body = viewOverlay.querySelector(".vm-body");
      body.innerHTML = "";
      const src = d.blobUrl || d.filePath;
      if (!src) {
        body.innerHTML = `<p style="color:#64748b;font-size:0.9rem">No file available to preview.</p>`;
      } else if (isImage(d.name)) {
        const img = document.createElement("img");
        img.src = src; img.alt = d.name;
        body.appendChild(img);
      } else {
        const iframe = document.createElement("iframe");
        iframe.src = src;
        body.appendChild(iframe);
      }
      viewOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
      logActivity("viewed", d);
    }

    function closeViewModal() {
      viewOverlay.classList.remove("active");
      document.body.style.overflow = "";
      _currentViewDoc = null;
    }

    /* ════════════════════════════════════════
       DOWNLOAD
    ════════════════════════════════════════ */
    function downloadDoc(d) {
      const src = d.blobUrl || d.filePath;
      if (!src) { toast("No file available for download.", "warn"); return; }
      const a = document.createElement("a");
      a.href = src;
      a.download = d.name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast(`⬇ Downloading ${d.name}`);
      logActivity("downloaded", d);
    }

    /* ════════════════════════════════════════
       DELETE
    ════════════════════════════════════════ */
    const delOverlay = document.createElement("div");
    delOverlay.className = "del-confirm-overlay";
    delOverlay.innerHTML = `
      <div class="del-confirm-box">
        <div class="del-icon">🗑️</div>
        <h3>Delete Document?</h3>
        <p>You are about to delete <span class="del-name"></span>.<br>This action cannot be undone.</p>
        <div class="del-confirm-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="delete-btn">Yes, Delete</button>
        </div>
      </div>`;
    document.body.appendChild(delOverlay);

    delOverlay.querySelector(".cancel-btn").addEventListener("click", () => {
      delOverlay.classList.remove("active");
      _pendingDeleteId = null;
    });

    let _pendingDeleteId = null;
    delOverlay.querySelector(".delete-btn").addEventListener("click", () => {
      const idx = docsData.findIndex(d => d.id === _pendingDeleteId);
      if (idx !== -1) {
        const doc = docsData[idx];

        /* ── CROSS-FIRM DELETE GUARD: double-check at action time ── */
        if (!PERMS.canDelete) {
          toast("You do not have permission to delete documents.", "error");
          delOverlay.classList.remove("active"); _pendingDeleteId = null; return;
        }

        deletedIds.add(doc.id);
        lsSet(LS_DELETED, [...deletedIds]);
        uploadedDocs = uploadedDocs.filter(d => d.id !== doc.id);
        lsSet(LS_UPLOADS, uploadedDocs);

        // Revoke blob URL to free memory
        if (doc.blobUrl) { try { URL.revokeObjectURL(doc.blobUrl); } catch(_) {} }

        logActivity("deleted", doc);
        docsData.splice(idx, 1);
        syncSharedDocumentsIndex();
        render();
        toast(`🗑 ${doc.name} deleted`);
      }
      delOverlay.classList.remove("active");
      _pendingDeleteId = null;
    });

    function openDeleteConfirm(d) {
      _pendingDeleteId = d.id;
      delOverlay.querySelector(".del-name").textContent = `"${d.name}"`;
      delOverlay.classList.add("active");
    }

    /* ════════════════════════════════════════
       UPDATE MODAL
    ════════════════════════════════════════ */
    const updateOverlay = document.createElement("div");
    updateOverlay.className = "update-modal-overlay";
    updateOverlay.innerHTML = `
      <div class="update-modal-box">
        <div class="update-modal-header">
          <h3>Update Document</h3>
          <button class="update-modal-close">✕</button>
        </div>
        <div class="update-modal-body">
          <div>
            <label>Document Name</label>
            <input class="upd-name" type="text" maxlength="255">
          </div>
          <div>
            <label>Access Level</label>
            <select class="upd-access">
              <option value="PRIVATE">PRIVATE</option>
              <option value="SHARED">SHARED</option>
            </select>
          </div>
          <div class="update-meta-note">
            Current version: <strong class="upd-version-label"></strong> — uploading a new file will bump the version automatically.
          </div>
          <div class="update-dropzone" id="update-dz">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <strong>Drop a new file here or click to browse</strong>
            <p>Leave empty to keep the existing file</p>
          </div>
          <div class="upd-file-preview" style="display:none"></div>
        </div>
        <div class="update-modal-footer">
          <button class="upd-cancel">Cancel</button>
          <button class="upd-save primary">Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(updateOverlay);

    const updDZ      = updateOverlay.querySelector("#update-dz");
    const updPreview = updateOverlay.querySelector(".upd-file-preview");
    let _updDoc = null, _updFile = null;

    [updateOverlay.querySelector(".update-modal-close"), updateOverlay.querySelector(".upd-cancel")]
      .forEach(btn => btn.addEventListener("click", closeUpdateModal));
    updateOverlay.addEventListener("click", e => { if (e.target === updateOverlay) closeUpdateModal(); });

    updDZ.addEventListener("dragover",  e => { e.preventDefault(); updDZ.classList.add("drag-over"); });
    updDZ.addEventListener("dragleave", () => updDZ.classList.remove("drag-over"));
    updDZ.addEventListener("drop", e => {
      e.preventDefault(); updDZ.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) setUpdFile(e.dataTransfer.files[0]);
    });
    updDZ.addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = ".pdf,.docx,.jpg,.jpeg,.png";
      inp.onchange = e => { if (e.target.files[0]) setUpdFile(e.target.files[0]); };
      inp.click();
    });

    function setUpdFile(file) {
      // 10 MB guard
      if (file.size > 10 * 1024 * 1024) {
        toast("File exceeds 10 MB limit.", "error"); return;
      }
      _updFile = file;
      updPreview.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f1f5f9;border-radius:8px;font-size:0.8rem;";
      updPreview.innerHTML = `
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${sanitize(file.name)}</span>
        <small style="color:#64748b">${(file.size / 1024).toFixed(1)} KB</small>
        <button id="upd-rm" style="background:none;border:none;cursor:pointer;font-size:1rem;color:#64748b">✕</button>`;
      updPreview.querySelector("#upd-rm").addEventListener("click", e => {
        e.stopPropagation(); _updFile = null;
        updPreview.style.display = "none"; updPreview.innerHTML = "";
      });
    }

    function openUpdateModal(d) {
      _updDoc = d; _updFile = null;
      updPreview.style.display = "none"; updPreview.innerHTML = "";
      updateOverlay.querySelector(".upd-name").value = d.name;
      updateOverlay.querySelector(".upd-access").value = d.access || "PRIVATE";
      updateOverlay.querySelector(".upd-version-label").textContent = `v${d.version ?? 1}`;
      updateOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeUpdateModal() {
      updateOverlay.classList.remove("active");
      document.body.style.overflow = "";
      _updDoc = _updFile = null;
    }

    updateOverlay.querySelector(".upd-save").addEventListener("click", () => {
      if (!_updDoc) return;

      /* Re-check permission at action time */
      if (!PERMS.canUpdate) {
        toast("You do not have permission to update documents.", "error"); return;
      }

      const newName   = updateOverlay.querySelector(".upd-name").value.trim();
      const newAccess = updateOverlay.querySelector(".upd-access").value;
      if (!newName) { toast("Document name cannot be empty.", "error"); return; }
      if (newName.length > 255) { toast("Document name is too long (max 255 chars).", "error"); return; }

      // Revoke old blob if replacing file
      if (_updFile && _updDoc.blobUrl) {
        try { URL.revokeObjectURL(_updDoc.blobUrl); } catch(_) {}
      }

      const patch = {
        name:   newName,
        access: newAccess,
        date:   new Date().toISOString().split("T")[0]
      };
      if (_updFile) {
        _updDoc.blobUrl  = URL.createObjectURL(_updFile);
        _updDoc.fileType = (_updFile.name.split(".").pop() || "BIN").toUpperCase().slice(0, 3);
        patch.version    = (_updDoc.version || 1) + 1;
      }
      Object.assign(_updDoc, patch);

      updatedMap[_updDoc.id] = { ...(updatedMap[_updDoc.id] || {}), ...patch };
      lsSet(LS_UPDATES, updatedMap);

      const ui = uploadedDocs.findIndex(d => d.id === _updDoc.id);
      if (ui !== -1) { uploadedDocs[ui] = { ...uploadedDocs[ui], ...patch }; lsSet(LS_UPLOADS, uploadedDocs); }

      logActivity("updated", _updDoc);
      syncSharedDocumentsIndex();
      closeUpdateModal();
      render();
      toast(`✓ ${_updDoc.name} updated to v${_updDoc.version ?? 1}`);
    });

    /* ════════════════════════════════════════
       SORT DROPDOWN
    ════════════════════════════════════════ */
    const sortOpts = [
      { key:"date",     label:"Date" },
      { key:"name",     label:"File Name" },
      { key:"uploader", label:"Uploader" },
    ];
    const sortDD = document.createElement("div");
    sortDD.className = "lex-dd";
    sortDD.innerHTML = `
      <div class="dd-head">Sort by</div>
      ${sortOpts.map(o =>
        `<div class="dd-row sort-opt ${uiState.sortKey === o.key ? "on" : ""}" data-key="${o.key}">
          ${o.label}<span class="dd-arrow">${uiState.sortKey === o.key ? (uiState.sortDir === "asc" ? "↑" : "↓") : ""}</span>
         </div>`).join("")}`;
    document.body.appendChild(sortDD);

    sortDD.querySelectorAll(".sort-opt").forEach(item => {
      item.addEventListener("click", () => {
        const key = item.dataset.key;
        uiState.sortDir = uiState.sortKey === key ? (uiState.sortDir === "asc" ? "desc" : "asc") : "asc";
        uiState.sortKey = key;
        sortDD.querySelectorAll(".sort-opt").forEach(el => {
          el.classList.toggle("on", el.dataset.key === uiState.sortKey);
          el.querySelector(".dd-arrow").textContent =
            el.dataset.key === uiState.sortKey ? (uiState.sortDir === "asc" ? "↑" : "↓") : "";
        });
        sortIcon.style.fill = "var(--brand-accent)";
        render();
      });
    });

    /* ════════════════════════════════════════
       FILTER DROPDOWN
    ════════════════════════════════════════ */
    const filterDD = document.createElement("div");
    filterDD.className = "lex-dd";
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
      render();
    });
    filterDD.querySelector(".dd-apply").addEventListener("click", () => {
      activeAccess = [...filterDD.querySelectorAll(".fcb:checked")].map(cb => cb.value);
      filterIcon.style.fill = activeAccess.length ? "var(--brand-accent)" : "var(--text-secondary)";
      render();
      closeAll();
    });

    /* ════════════════════════════════════════
       MAIN RENDER
    ════════════════════════════════════════ */
    function render() {
      let data = [...docsData];

      /* ── INTERN RULE ─────────────────────────────────────────────
         Interns only see SHARED docs. This is enforced here in the
         render layer, NOT during data load — so the full list is
         always available if an intern's role changes mid-session
         without data corruption.
      ─────────────────────────────────────────────────────────────*/
      if (ROLE === "intern") data = data.filter(d => d.access === "SHARED");

      const q = uiState.search.toLowerCase().trim();
      if (q) data = data.filter(d =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.id   || "").toLowerCase().includes(q) ||
        (d.type || "").toLowerCase().includes(q)
      );

      if (uiState.typeFilter !== "All Types") data = data.filter(d => d.type === uiState.typeFilter);
      if (activeAccess.length) data = data.filter(d => activeAccess.includes(d.access));

      data.sort((a, b) => {
        let va, vb;
        if (uiState.sortKey === "date") {
          va = new Date(a.date || 0).getTime();
          vb = new Date(b.date || 0).getTime();
        } else {
          va = (a[uiState.sortKey] || "").toLowerCase();
          vb = (b[uiState.sortKey] || "").toLowerCase();
        }
        if (va < vb) return uiState.sortDir === "asc" ? -1 : 1;
        if (va > vb) return uiState.sortDir === "asc" ?  1 : -1;
        return 0;
      });

      totalEl.textContent = `Total Documents: ${data.length}`;
      grid.innerHTML = "";
      grid.className = uiState.view === "grid" ? "documents-grid" : "documents-list";

      if (!data.length) {
        const msg = ROLE === "intern" && docsData.length > 0
          ? "No shared documents are available for you in this case yet."
          : "No documents match your criteria.";
        grid.innerHTML = `<p class="no-docs">${msg}</p>`;
        return;
      }

      if (uiState.view === "list") {
        const hdr = document.createElement("div");
        hdr.className = "doc-list-header";
        hdr.innerHTML = `<span>Document</span><span>Type</span><span>Uploader</span>
                         <span>Date</span><span>Version</span><span>Access</span><span>Actions</span>`;
        grid.appendChild(hdr);
      }

      data.forEach(d => grid.appendChild(uiState.view === "grid" ? buildCard(d) : buildRow(d)));
    }

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
        dd.style.top  = (rect.bottom + window.scrollY + 8) + "px";
        dd.style.left = Math.max(4, rect.right + window.scrollX - dd.offsetWidth) + "px";
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
      gridIcon.style.fill = uiState.view === "grid" ? "var(--brand-accent)" : "var(--text-secondary)";
      listIcon.style.fill = uiState.view === "list" ? "var(--brand-accent)" : "var(--text-secondary)";
    }

    /* ════════════════════════════════════════
       EVENT BINDING
    ════════════════════════════════════════ */
    searchInput.addEventListener("input", e => { uiState.search = e.target.value; render(); });
    typeSelect.addEventListener("change", e => { uiState.typeFilter = e.target.value; render(); });
    if (filterIcon) filterIcon.addEventListener("click", e => { e.stopPropagation(); openDD(filterDD, filterIcon); });
    if (sortIcon)   sortIcon.addEventListener("click",   e => { e.stopPropagation(); openDD(sortDD,   sortIcon);   });
    if (gridIcon)   gridIcon.addEventListener("click", () => { uiState.view = "grid"; render(); syncViewIcons(); });
    if (listIcon)   listIcon.addEventListener("click", () => { uiState.view = "list"; render(); syncViewIcons(); });
    sortDD.addEventListener("click",   e => e.stopPropagation());
    filterDD.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", closeAll);

    // Escape key closes all modals
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      closeViewModal();
      closeUpdateModal();
      if (delOverlay.classList.contains("active")) {
        delOverlay.classList.remove("active"); _pendingDeleteId = null;
      }
      closeAll();
    });

    /* ════════════════════════════════════════
       UPLOAD MODAL
    ════════════════════════════════════════ */
    let selectedFile = null;

    if (!PERMS.canUpload) {
      uploadBtn.disabled = true;
      uploadBtn.title = "Your role cannot upload documents";
      uploadBtn.style.opacity = "0.5";
      uploadBtn.style.cursor = "not-allowed";
    } else {
      uploadBtn.addEventListener("click", openModal);
    }

    const closeBtn  = modal.querySelector(".upload-modal__close");
    const cancelBtn = modal.querySelector(".upload-modal__btn--ghost");
    const submitBtn = modal.querySelector(".upload-modal__btn--primary");
    const dropzone  = modal.querySelector(".upload-modal__dropzone");
    const dropText  = modal.querySelector(".upload-modal__drop-text");

    // Pre-fill case ID in the upload modal
    const caseIdInputs = modal.querySelectorAll('input[type="text"]');
    if (caseIdInputs[1]) caseIdInputs[1].value = CURRENT_CASE_ID;
    if (caseIdInputs[1]) caseIdInputs[1].readOnly = true; // Case ID should not be editable

    function openModal()  { modal.classList.add("active");    document.body.style.overflow = "hidden"; }
    function closeModal() { modal.classList.remove("active"); document.body.style.overflow = ""; resetFile(); }

    if (closeBtn)  closeBtn.addEventListener("click",  closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    if (dropzone) {
      dropzone.addEventListener("dragover",  e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
      dropzone.addEventListener("drop", e => {
        e.preventDefault(); dropzone.classList.remove("drag-over");
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      });
      dropzone.addEventListener("click", () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = ".pdf,.docx,.jpg,.jpeg,.png";
        inp.onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };
        inp.click();
      });
    }

    function handleFile(file) {
      // 10 MB guard
      if (file.size > 10 * 1024 * 1024) {
        toast("File exceeds 10 MB limit.", "error"); return;
      }
      selectedFile = file;
      const existing = dropzone ? dropzone.querySelector(".file-preview") : null;
      if (existing) existing.remove();
      if (dropzone) {
        const preview = document.createElement("div");
        preview.className = "file-preview";
        preview.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span title="${sanitize(file.name)}">${sanitize(file.name)}</span>
          <small>${(file.size / 1024).toFixed(1)} KB</small>
          <button title="Remove">✕</button>`;
        preview.querySelector("button").addEventListener("click", e => { e.stopPropagation(); resetFile(); });
        dropzone.appendChild(preview);
      }
      if (dropText) dropText.textContent = "File selected";
    }

    function resetFile() {
      selectedFile = null;
      if (dropzone) {
        const p = dropzone.querySelector(".file-preview");
        if (p) p.remove();
      }
      if (dropText) dropText.textContent = "Drag & Drop Files Here or Click to Upload";
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const allTextInputs   = modal.querySelectorAll('input[type="text"]');
        const clientNameInput = allTextInputs[0];
        const clientName      = clientNameInput ? clientNameInput.value.trim() : "";
        if (!clientName)   { toast("Please fill in the client name.", "error");   return; }
        if (!selectedFile) { toast("Please select a file to upload.", "error");   return; }

        const allSelects  = modal.querySelectorAll("select");
        const typeVal     = allSelects[0] ? allSelects[0].value : "CONTRACT";
        const uploaderVal = (allTextInputs[2] ? allTextInputs[2].value.trim() : "") || CURRENT_USER.name;

        const newDocMeta = {
          id:            nextDocId(),
          name:          selectedFile.name,
          filePath:      null,
          blobUrl:       null,
          caseId:        CURRENT_CASE_ID,
          type:          typeVal.toUpperCase(),
          fileType:      (selectedFile.name.split(".").pop() || "BIN").toUpperCase().slice(0, 3),
          uploader:      uploaderVal,
          uploaderEmail: CURRENT_USER.email,
          firmId:        CURRENT_USER.firmId || null,
          date:          new Date().toISOString().split("T")[0],
          version:       1,
          access:        "PRIVATE",
          iconColor:     "green",
        };

        uploadedDocs.unshift(newDocMeta);
        lsSet(LS_UPLOADS, uploadedDocs);

        userUploadIds.add(newDocMeta.id);
        lsSet(LS_USER_UPLOADS, [...userUploadIds]);

        const sessionDoc = { ...newDocMeta, blobUrl: URL.createObjectURL(selectedFile) };
        docsData.unshift(sessionDoc);

        logActivity("uploaded", sessionDoc);
        syncSharedDocumentsIndex();

        closeModal();
        refreshTypeSelect();
        render();
        toast(`✓ ${selectedFile.name} uploaded successfully`);
      });
    }

    /* ════════════════════════════════════════
       ACTIVITY SIDE PANEL (live update)
    ════════════════════════════════════════ */
    function refreshSidePanelActivity() {
      const cardEl = document.querySelector(".card");
      if (!cardEl) return;

      cardEl.querySelectorAll(".activity").forEach(el => el.remove());

      const insertBefore = cardEl.querySelector(".btn-outline");

      // Filter activity for this case AND this firm only
      const latest = activityLog.filter(e =>
        (!e.caseId || e.caseId === CURRENT_CASE_ID) &&
        (!e.firmId || !CURRENT_USER.firmId || e.firmId === CURRENT_USER.firmId)
      ).slice(0, 2);

      latest.forEach(entry => {
        const div = document.createElement("div");
        div.className = "activity";
        div.innerHTML = `
          <p><strong>${sanitize(entry.user)}</strong> ${sanitize(entry.action)} <em>${sanitize(entry.docName)}</em></p>
          <span>${fmtDate(entry.date)}</span>`;
        cardEl.insertBefore(div, insertBefore);
      });

      if (latest.length === 0 && insertBefore) {
        const div = document.createElement("div");
        div.className = "activity";
        div.innerHTML = `<p style="color:var(--text-secondary);font-size:0.8rem;">No activity yet.</p><span></span>`;
        cardEl.insertBefore(div, insertBefore);
      }

      // Clients cannot see "View All Activity"
      if (ROLE === "client") {
        const viewAllBtn = cardEl.querySelector(".btn-outline");
        if (viewAllBtn) viewAllBtn.style.display = "none";
      }
    }

    /* ════════════════════════════════════════
       BOOT
    ════════════════════════════════════════ */
    refreshTypeSelect();
    syncViewIcons();
    syncSharedDocumentsIndex();
    render();
    refreshSidePanelActivity();

  } // end init()

  /* ════════════════════════════════════════
     ACCESS DENIED RENDER (before init body)
  ════════════════════════════════════════ */
  function renderAccessDenied(reason, code) {
    const grid = document.querySelector(".documents-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="no-case-access">
          <h2>🔒 Access Denied</h2>
          <p>${reason}</p>
          <span class="deny-reason">Code: ${code}</span>
        </div>`;
    }
  }

  /* ════════════════════════════════════════
     ROLE BADGE (called before/after init)
  ════════════════════════════════════════ */
  function renderRoleBadge(user, role, firmName) {
    const existing = document.getElementById("lex-role-badge");
    if (existing) existing.remove();
    const roleColors = {
      lawyer:        { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" },
      intern:        { bg:"#f1f5f9", color:"#475569", border:"#cbd5e1" },
      client:        { bg:"#fefce8", color:"#854d0e", border:"#fde68a" },
      lawfirm_admin: { bg:"#f0fdf4", color:"#166534", border:"#86efac" },
    };
    const rc = roleColors[role] || roleColors.lawyer;
    const badge = document.createElement("div");
    badge.id = "lex-role-badge";
    badge.style.cssText = `
      position:fixed; top:16px; right:16px;
      background:${rc.bg}; color:${rc.color}; border:1px solid ${rc.border};
      padding:6px 14px; border-radius:999px;
      font-size:0.78rem; font-weight:700; letter-spacing:0.04em;
      z-index:9998; text-transform:uppercase;
      box-shadow:0 2px 8px rgba(0,0,0,0.08); max-width: 420px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    `;
    const firm = firmName ? ` · ${firmName}` : "";
    badge.textContent = `👤 ${user.name} · ${role.replace("_"," ").toUpperCase()}${firm} · ${CURRENT_CASE_ID}`;
    badge.title = badge.textContent;
    document.body.appendChild(badge);
  }

  /* ════════════════════════════════════════
     TOAST (module-level, available before init)
  ════════════════════════════════════════ */
  function toast(msg, type = "success") {
    const t = document.createElement("div");
    t.className = `lex-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 3200);
  }

})();