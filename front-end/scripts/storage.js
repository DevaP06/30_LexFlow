const STORAGE_KEYS = {
    FIRMS: 'lexflow_law_firms',
    CONSULTATIONS: 'lexflow_consultations',
    CHATS: 'lexflow_chats',
    LAWYERS: 'lexflow_lawyers'
};

/**
 * Generic Storage Initializer
 * Loads JSON seed data into localStorage if not already present
 */
async function initStorageFromJSON(key, jsonPath, dataTransform = null) {
    try {
        // Check if data already exists in localStorage
        if (localStorage.getItem(key)) {
            console.log(`[Storage] ${key} already initialized`);
            return;
        }

        // Fetch JSON file
        const response = await fetch(jsonPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let data = await response.json();
        
        // Apply transformation if provided
        if (dataTransform && typeof dataTransform === 'function') {
            data = dataTransform(data);
        }

        // Store in localStorage
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[Storage] ${key} initialized from ${jsonPath}`);
    } catch (err) {
        console.error(`[Storage] Failed to initialize ${key}:`, err);
    }
}

/**
 * Initializes localStorage with data from JSON files if not already present.
 */
async function initStorage() {
    if (window._isInitStorageRunning) return;
    window._isInitStorageRunning = true;
    try {
        if (!localStorage.getItem(STORAGE_KEYS.FIRMS)) {
            localStorage.setItem(STORAGE_KEYS.FIRMS, '[]');
            const response = await fetch('../data/law-firms.json');
            const data = await response.json();
            const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.FIRMS) || '[]');
            localStorage.setItem(STORAGE_KEYS.FIRMS, JSON.stringify([...data, ...current]));
            console.log('Firms initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.CONSULTATIONS)) {
            localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, '[]');
            const response = await fetch('../data/consultations.json');
            const data = await response.json();
            const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]');
            localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify([...data, ...current]));
            console.log('Consultations initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
            localStorage.setItem(STORAGE_KEYS.CHATS, '{}');
            const response = await fetch('../data/chats.json');
            const data = await response.json();
            const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '{}');
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify({...data, ...current}));
            console.log('Chats initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.LAWYERS)) {
            localStorage.setItem(STORAGE_KEYS.LAWYERS, '[]');
            const response = await fetch('../data/lawyers.json');
            const data = await response.json();
            const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.LAWYERS) || '[]');
            localStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify([...data, ...current]));
            console.log('Lawyers initialized');
        }
    } catch (err) {
        console.error('Failed to initialize storage:', err);
    } finally {
        window._isInitStorageRunning = false;
    }
}

/**
 * Data Storage API
 * Provides a complete hybrid data system using localStorage as primary storage,
 * initialized from JSON seed data on first load.
 */
const LexFlowStorage = {
    // ===== FIRMS =====
    getFirms: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.FIRMS) || '[]'),
    getFirmById: (id) => LexFlowStorage.getFirms().find(f => f.id === id),

    // ===== CONSULTATIONS =====
    getConsultations: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]'),
    
    getConsultationById: (id) => {
        const list = LexFlowStorage.getConsultations();
        return list.find(c => c.id === id);
    },
    
    /**
     * Creates a new consultation with proper metadata
     * @param {Object} data - Consultation data (can include any fields)
     * @returns {Object} - Created consultation with id, createdAt, and updatedAt
     */
    addConsultation: (data) => {
        const list = LexFlowStorage.getConsultations();
        
        const consultation = {
            id: data.id || 'CONS-' + Date.now(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            ...data
        };
        
        list.push(consultation);
        localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(list));
        return consultation;
    },
    
    /**
     * Updates an existing consultation
     * @param {string} id - Consultation ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} - Updated consultation or null if not found
     */
    updateConsultation: (id, updates) => {
        const list = LexFlowStorage.getConsultations();
        const index = list.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        list[index] = {
            ...list[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(list));
        return list[index];
    },
    
    /**
     * Deletes a consultation by ID
     * @param {string} id - Consultation ID
     * @returns {boolean} - True if deleted, false if not found
     */
    deleteConsultation: (id) => {
        const list = LexFlowStorage.getConsultations();
        const filtered = list.filter(c => c.id !== id);
        
        if (filtered.length === list.length) return false;
        
        localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(filtered));
        return true;
    },

    // ===== CHATS =====
    getChatsByConsId: (consId) => {
        const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '{}');
        return allChats[consId] || [];
    },

    addChatMessage: (consId, msg) => {
        const allChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '{}');
        if (!allChats[consId]) allChats[consId] = [];
        
        // Add timestamp if not present
        if (!msg.time) {
            const now = new Date();
            msg.time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        allChats[consId].push(msg);
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
        return msg;
    },

    // ===== LAWYERS =====
    getLawyers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.LAWYERS) || '[]'),
    
    getLawyerById: (id) => {
        const list = LexFlowStorage.getLawyers();
        return list.find(l => l.id === id);
    },
    
    updateLawyer: (id, updates) => {
        const list = LexFlowStorage.getLawyers();
        const index = list.findIndex(l => l.id === id);
        if (index === -1) return null;
        
        list[index] = { ...list[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(list));
        return list[index];
    }
};

// Initialize on load
initStorage();

// Export for global access
window.LexFlowStorage = LexFlowStorage;
