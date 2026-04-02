// ==========================================
// LexFlow Super Admin - Centralized Storage
// ==========================================
// Pattern: Unified data access for super admin
// Storage keys: lexflow_firms, lexflow_lawyers, lexflow_users, lexflow_consultations, lexflow_sa_settings

window.LexFlowSuperAdminStorage = (() => {
    const STORAGE_KEYS = {
        firms: 'lexflow_law_firms',
        lawyers: 'lexflow_lawyers',
        users: 'users',
        consultations: 'lexflow_consultations',
        settings: 'lexflow_sa_settings',
        mockDataLoaded: 'lexflow_sa_mock_loaded'
    };

    const DEFAULT_SETTINGS = {
        commission_rate: 10,
        support_email: 'support@lexflow.legal',
        maintenance: false,
        disable_signup: false,
        practice_areas: ['Antitrust', 'Corporate Law', 'Cyber Law', 'Criminal Defense', 'Family Law', 'Intellectual Property', 'Real Estate', 'Tax Law']
    };

    function _readArray(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function _writeArray(key, arr) {
        localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
    }

    async function _fetchJson(path) {
        const resp = await fetch(path);
        if (!resp.ok) throw new Error(`Failed to fetch ${path}: HTTP ${resp.status}`);
        return resp.json();
    }

    function _mergeById(localItems, jsonItems) {
        const byId = new Map();
        (jsonItems || []).forEach(item => {
            byId.set(String(item.id), item);
        });
        (localItems || []).forEach(item => {
            const id = String(item.id);
            const fromJson = byId.get(id) || {};
            // Keep local edits, but backfill missing fields from JSON
            byId.set(id, { ...fromJson, ...item });
        });
        return Array.from(byId.values());
    }

    function _normalizeFirm(firm, idx) {
        return {
            ...firm,
            id: String(firm.id || `firm-${Date.now()}-${idx}`),
            name: firm.name || firm.firmName || `Law Firm ${idx + 1}`,
            admin: firm.admin || firm.adminName || '',
            reg_no: firm.reg_no || ''
        };
    }

    function _normalizeLawyer(lawyer, idx) {
        return {
            ...lawyer,
            id: String(lawyer.id || `lawyer-${Date.now()}-${idx}`),
            name: lawyer.name || lawyer.fullName || `Lawyer ${idx + 1}`,
            status: lawyer.status || 'approved'
        };
    }

    function _normalizeUser(user, idx) {
        return {
            ...user,
            id: String(user.id || `USR-${idx + 1}`),
            name: user.name || user.fullName || user.email || `User ${idx + 1}`
        };
    }

    function _normalizeConsultation(consultation, idx) {
        return {
            ...consultation,
            id: String(consultation.id || `CONS-${Date.now()}-${idx}`),
            client: consultation.client || consultation.clientName || 'Unknown Client',
            firmId: consultation.firmId || consultation.firmName || 'N/A',
            lawyerId: consultation.lawyerId || 'N/A',
            date: consultation.date || consultation.createdAt || 'N/A',
            status: consultation.status || 'pending'
        };
    }

    // --- Initialize and sync storage ---
    async function ensureStorage() {
        const existingFirms = _readArray(STORAGE_KEYS.firms).map(_normalizeFirm);
        const existingLawyers = _readArray(STORAGE_KEYS.lawyers).map(_normalizeLawyer);
        const existingUsers = _readArray(STORAGE_KEYS.users).map(_normalizeUser);
        const existingConsultations = _readArray(STORAGE_KEYS.consultations).map(_normalizeConsultation);

        try {
            const [firmsJson, lawyersJson, consultationsJson, docsJson, initialDataJson] = await Promise.all([
                _fetchJson('../data/law-firms.json'),
                _fetchJson('../data/lawyers.json'),
                _fetchJson('../data/consultations.json'),
                _fetchJson('../data/docs.json'),
                _fetchJson('../data/initialData.json')
            ]);

            const jsonFirms = (Array.isArray(firmsJson) ? firmsJson : []).map(_normalizeFirm);
            const jsonLawyers = (Array.isArray(lawyersJson) ? lawyersJson : []).map(_normalizeLawyer);
            const jsonConsultations = (Array.isArray(consultationsJson) ? consultationsJson : []).map(_normalizeConsultation);

            const docUsers = Array.isArray(docsJson?.users) ? docsJson.users : [];
            const initialUsers = Array.isArray(initialDataJson?.users) ? initialDataJson.users : [];
            const jsonUsers = [...docUsers, ...initialUsers].map(_normalizeUser);

            const mergedFirms = _mergeById(existingFirms, jsonFirms);
            const mergedLawyers = _mergeById(existingLawyers, jsonLawyers);
            const mergedUsers = _mergeById(existingUsers, jsonUsers);
            const mergedConsultations = _mergeById(existingConsultations, jsonConsultations);

            _writeArray(STORAGE_KEYS.firms, mergedFirms);
            _writeArray(STORAGE_KEYS.lawyers, mergedLawyers);
            _writeArray(STORAGE_KEYS.users, mergedUsers);
            _writeArray(STORAGE_KEYS.consultations, mergedConsultations);

            const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || 'null');
            if (!settings) {
                localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
            }

            localStorage.setItem(STORAGE_KEYS.mockDataLoaded, 'true');
            console.log('✓ Super admin storage synced (localStorage + JSON)');
            return true;
        } catch (err) {
            console.warn('⚠ Super admin JSON sync failed, using existing localStorage:', err.message);

            // Ensure required keys always exist
            if (!localStorage.getItem(STORAGE_KEYS.firms)) _writeArray(STORAGE_KEYS.firms, []);
            if (!localStorage.getItem(STORAGE_KEYS.lawyers)) _writeArray(STORAGE_KEYS.lawyers, []);
            if (!localStorage.getItem(STORAGE_KEYS.users)) _writeArray(STORAGE_KEYS.users, []);
            if (!localStorage.getItem(STORAGE_KEYS.consultations)) _writeArray(STORAGE_KEYS.consultations, []);
            if (!localStorage.getItem(STORAGE_KEYS.settings)) {
                localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
            }

            localStorage.setItem(STORAGE_KEYS.mockDataLoaded, 'true');
            return true;
        }
    }

    // --- Firms ---
    const getFirms = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.firms) || '[]');
    };

    const getFirmById = (firmId) => {
        return getFirms().find(f => f.id === firmId);
    };

    const saveFirms = (firms) => {
        localStorage.setItem(STORAGE_KEYS.firms, JSON.stringify(firms));
    };

    const addFirm = (firm) => {
        const firms = getFirms();
        firm.id = firm.id || `firm-${Date.now()}`;
        firms.push(firm);
        saveFirms(firms);
        return firm;
    };

    const updateFirm = (firmId, updates) => {
        const firms = getFirms();
        const idx = firms.findIndex(f => f.id === firmId);
        if (idx >= 0) {
            firms[idx] = { ...firms[idx], ...updates };
            saveFirms(firms);
            return firms[idx];
        }
        return null;
    };

    const deleteFirm = (firmId) => {
        const firms = getFirms();
        const filtered = firms.filter(f => f.id !== firmId);
        saveFirms(filtered);
        return filtered;
    };

    // --- Lawyers ---
    const getLawyers = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.lawyers) || '[]');
    };

    const getLawyerById = (lawyerId) => {
        return getLawyers().find(l => l.id === lawyerId);
    };

    const saveLawyers = (lawyers) => {
        localStorage.setItem(STORAGE_KEYS.lawyers, JSON.stringify(lawyers));
    };

    const addLawyer = (lawyer) => {
        const lawyers = getLawyers();
        lawyer.id = lawyer.id || `lawyer-${Date.now()}`;
        lawyer.status = lawyer.status || 'pending';
        lawyers.push(lawyer);
        saveLawyers(lawyers);
        return lawyer;
    };

    const updateLawyer = (lawyerId, updates) => {
        const lawyers = getLawyers();
        const idx = lawyers.findIndex(l => l.id === lawyerId);
        if (idx >= 0) {
            lawyers[idx] = { ...lawyers[idx], ...updates };
            saveLawyers(lawyers);
            return lawyers[idx];
        }
        return null;
    };

    const deleteLawyer = (lawyerId) => {
        const lawyers = getLawyers();
        const filtered = lawyers.filter(l => l.id !== lawyerId);
        saveLawyers(filtered);
        return filtered;
    };

    // --- Users ---
    const getUsers = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    };

    const getUserById = (userId) => {
        return getUsers().find(u => u.id === userId);
    };

    const getUserByEmail = (email) => {
        return getUsers().find(u => u.email === email);
    };

    const saveUsers = (users) => {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        // Mirror to lexflow_users so CasesStorage (assign-lawyer dropdown) stays in sync
        localStorage.setItem('lexflow_users', JSON.stringify(users));
    };

    const addUser = (user) => {
        const users = getUsers();
        user.id = user.id || `USR-${String(users.length + 1).padStart(3, '0')}`;
        users.push(user);
        saveUsers(users);
        return user;
    };

    const updateUser = (userId, updates) => {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0) {
            users[idx] = { ...users[idx], ...updates };
            saveUsers(users);
            return users[idx];
        }
        return null;
    };

    const deleteUser = (userId) => {
        const users = getUsers();
        const filtered = users.filter(u => u.id !== userId);
        saveUsers(filtered);
        return filtered;
    };

    // --- Consultations ---
    const getConsultations = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.consultations) || '[]');
    };

    const getConsultationById = (consId) => {
        return getConsultations().find(c => c.id === consId);
    };

    const saveConsultations = (consultations) => {
        localStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify(consultations));
    };

    const addConsultation = (consultation) => {
        const consultations = getConsultations();
        consultation.id = consultation.id || `CONS-${Date.now()}`;
        consultations.push(consultation);
        saveConsultations(consultations);
        return consultation;
    };

    const updateConsultation = (consId, updates) => {
        const consultations = getConsultations();
        const idx = consultations.findIndex(c => c.id === consId);
        if (idx >= 0) {
            consultations[idx] = { ...consultations[idx], ...updates };
            saveConsultations(consultations);
            return consultations[idx];
        }
        return null;
    };

    const deleteConsultation = (consId) => {
        const consultations = getConsultations();
        const filtered = consultations.filter(c => c.id !== consId);
        saveConsultations(filtered);
        return filtered;
    };

    // --- Settings ---
    const getSettings = () => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || JSON.stringify(DEFAULT_SETTINGS));
    };

    const saveSettings = (settings) => {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    };

    // --- Public API ---
    return {
        ensureStorage,
        getFirms, getFirmById, addFirm, updateFirm, deleteFirm, saveFirms,
        getLawyers, getLawyerById, addLawyer, updateLawyer, deleteLawyer, saveLawyers,
        getUsers, getUserById, getUserByEmail, addUser, updateUser, deleteUser, saveUsers,
        getConsultations, getConsultationById, addConsultation, updateConsultation, deleteConsultation, saveConsultations,
        getSettings, saveSettings
    };
})();

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.LexFlowSuperAdminStorage.ensureStorage();
    });
} else {
    window.LexFlowSuperAdminStorage.ensureStorage();
}
