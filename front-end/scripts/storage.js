const STORAGE_KEYS = {
    FIRMS: 'lexflow_law_firms',
    CONSULTATIONS: 'lexflow_consultations',
    CHATS: 'lexflow_chats',
    LAWYERS: 'lexflow_lawyers'
};

/**
 * Initializes localStorage with data from JSON files if not already present.
 */
async function initStorage() {
    try {
        if (!localStorage.getItem(STORAGE_KEYS.FIRMS)) {
            const response = await fetch('data/law-firms.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.FIRMS, JSON.stringify(data));
            console.log('Firms initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.CONSULTATIONS)) {
            const response = await fetch('data/consultations.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(data));
            console.log('Consultations initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
            const response = await fetch('data/chats.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(data));
            console.log('Chats initialized');
        }
        if (!localStorage.getItem(STORAGE_KEYS.LAWYERS)) {
            const response = await fetch('data/lawyers.json');
            const data = await response.json();
            localStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(data));
            console.log('Lawyers initialized');
        }
    } catch (err) {
        console.error('Failed to initialize storage:', err);
    }
}

/**
 * Data Storage API
 */
const LexFlowStorage = {
    // FIRMS
    getFirms: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.FIRMS) || '[]'),
    getFirmById: (id) => LexFlowStorage.getFirms().find(f => f.id === id),

    // CONSULTATIONS
    getConsultations: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]'),
    getConsultationById: (id) => LexFlowStorage.getConsultations().find(c => c.id === id),
    
    addConsultation: (cons) => {
        const list = LexFlowStorage.getConsultations();
        // Generate ID if not present
        if (!cons.id) cons.id = 'CONS-' + Math.floor(Math.random() * 1000 + 100);
        list.unshift(cons);
        localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(list));
        return cons;
    },
    
    updateConsultation: (id, updates) => {
        const list = LexFlowStorage.getConsultations();
        const index = list.findIndex(c => c.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(list));
            return list[index];
        }
        return null;
    },

    // CHATS
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

    // LAWYERS
    getLawyers: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.LAWYERS) || '[]'),
    getLawyerById: (id) => LexFlowStorage.getLawyers().find(l => l.id === id),
    updateLawyer: (id, updates) => {
        const list = LexFlowStorage.getLawyers();
        const index = list.findIndex(l => l.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            localStorage.setItem(STORAGE_KEYS.LAWYERS, JSON.stringify(list));
            return list[index];
        }
        return null;
    }
};

// Initialize on load
initStorage();

// Export for global access
window.LexFlowStorage = LexFlowStorage;
