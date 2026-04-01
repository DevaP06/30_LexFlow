// ==========================================
// LexFlow Super Admin - Centralized Storage
// ==========================================
// Pattern: Unified data access for super admin
// Storage keys: lexflow_firms, lexflow_lawyers, lexflow_users, lexflow_consultations, lexflow_sa_settings

window.LexFlowSuperAdminStorage = (() => {
    const STORAGE_KEYS = {
        firms: 'lexflow_firms',
        lawyers: 'lexflow_lawyers',
        users: 'lexflow_users',
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

    // --- Initialize storage on first load ---
    function ensureStorage() {
        const isLoaded = localStorage.getItem(STORAGE_KEYS.mockDataLoaded);
        if (isLoaded === 'true') {
            console.log('✓ Super admin storage already initialized');
            return Promise.resolve(true);
        }

        return Promise.all([
            fetch('../data/law-firms.json'),
            fetch('../data/lawyers.json'),
            fetch('../data/docs.json')
        ])
        .then(([firmsRes, lawyersRes, docsRes]) => {
            return Promise.all([
                firmsRes.json(),
                lawyersRes.json(),
                docsRes.json()
            ]);
        })
        .then(([firms, lawyers, docs]) => {
            // Extract users from docs data
            const users = docs.users || [];
            
            // Store all data
            localStorage.setItem(STORAGE_KEYS.firms, JSON.stringify(firms));
            localStorage.setItem(STORAGE_KEYS.lawyers, JSON.stringify(lawyers));
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            
            // Initialize consultations if empty
            let consultations = JSON.parse(localStorage.getItem(STORAGE_KEYS.consultations) || '[]');
            if (consultations.length === 0) {
                consultations = [
                    { id: 'CONS-001', client: 'Acme Corp', firmId: 'firm-1', lawyerId: 'lawyer-1', status: 'completed', date: '2024-03-15' },
                    { id: 'CONS-002', client: 'Tech Innovations Inc', firmId: 'firm-2', lawyerId: 'lawyer-3', status: 'scheduled', date: '2024-04-05' }
                ];
                localStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify(consultations));
            }
            
            // Initialize settings
            let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || 'null');
            if (!settings) {
                localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
            }
            
            localStorage.setItem(STORAGE_KEYS.mockDataLoaded, 'true');
            console.log('✓ Super admin storage initialized with mock data');
            return true;
        })
        .catch(err => {
            console.warn('⚠ Failed to load mock data, using empty storage:', err.message);
            // Still mark as loaded to avoid repeated attempts
            localStorage.setItem(STORAGE_KEYS.mockDataLoaded, 'true');
            // Initialize with empty arrays
            localStorage.setItem(STORAGE_KEYS.firms, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.lawyers, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.consultations, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
            return true;
        });
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
