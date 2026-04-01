document.addEventListener('DOMContentLoaded', () => {
    // 1. App State
    let currentConsId = sessionStorage.getItem('active_cons_id') || 'CONS-882';
    
    // 2. DOM Elements
    const chatListContainer = document.querySelector('.chat-list');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const headerName = document.querySelector('.active-chat-text h2');
    const headerAvatar = document.querySelector('.active-chat-info .chat-avatar img');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-msg');
    const leaveBtn = document.getElementById('btn-leave');
    const sidebarSearch = document.getElementById('sidebar-search');

    // 3. Initialization
    init();

    function init() {
        renderSidebar();
        loadConsultation(currentConsId);
        setupEventListeners();
    }

    /**
     * Renders the chat sidebar dynamically for the lawyer
     */
    function renderSidebar(filter = '') {
        if (!chatListContainer) return;
        const consultations = LexFlowStorage.getConsultations();
        
        chatListContainer.innerHTML = '';
        consultations.forEach(cons => {
            // Filter by name or ID
            if (filter && 
                !cons.clientName.toLowerCase().includes(filter.toLowerCase()) && 
                !cons.id.toLowerCase().includes(filter.toLowerCase())) {
                return;
            }

            const isActive = cons.id === currentConsId;
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${isActive ? 'active' : ''}`;
            chatItem.dataset.id = cons.id;
            
            chatItem.innerHTML = `
                <div class="chat-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(cons.clientName)}&background=4f8ef7&color=fff" alt="${cons.clientName}">
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-top">
                        <span class="chat-name">${cons.clientName}</span>
                        <span class="chat-time">${cons.time.split(' - ')[0]}</span>
                    </div>
                    <div class="chat-item-bottom">
                        <span class="chat-snippet">${cons.id} • New Client</span>
                    </div>
                </div>
            `;
            
            chatItem.addEventListener('click', () => {
                if (currentConsId !== cons.id) {
                    currentConsId = cons.id;
                    sessionStorage.setItem('active_cons_id', currentConsId);
                    renderSidebar();
                    loadConsultation(currentConsId);
                }
            });
            
            chatListContainer.appendChild(chatItem);
        });
    }

    /**
     * Loads a specific consultation as the lawyer
     */
    function loadConsultation(id) {
        const consultation = LexFlowStorage.getConsultationById(id);
        if (!consultation) return;

        // Update Header
        if (headerName) headerName.textContent = consultation.clientName + ' (Client)';
        if (headerAvatar) {
            headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.clientName)}&background=4f8ef7&color=fff`;
        }

        renderMessages();
    }

    /**
     * Renders messages for the current consultation
     */
    function renderMessages() {
        if (!chatMessagesContainer) return;
        
        const messages = LexFlowStorage.getChatsByConsId(currentConsId);
        chatMessagesContainer.innerHTML = '<div class="chat-divider"><span>Today</span></div>';
        
        if (messages.length === 0) {
            // Initial msg if nothing is there
            const initial = {
                sender: 'lawyer',
                text: "Hello! I'm your legal counsel. How can I help you today?",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            LexFlowStorage.addChatMessage(currentConsId, initial);
            appendMessageToUI(initial);
        } else {
            messages.forEach(msg => appendMessageToUI(msg));
        }
        
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    /**
     * Appends a message to the UI (Lawyer is outgoing)
     */
    function appendMessageToUI(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender === 'lawyer' ? 'outgoing' : 'incoming'}`;
        msgDiv.innerHTML = `
            <div class="msg-bubble">
                ${msg.text}
                <span class="msg-time">${msg.time}</span>
            </div>
        `;
        chatMessagesContainer.appendChild(msgDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    /**
     * Lawyer sends a message
     */
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const newMsg = { sender: 'lawyer', text: text };
        const savedMsg = LexFlowStorage.addChatMessage(currentConsId, newMsg);
        appendMessageToUI(savedMsg);
        chatInput.value = '';
    }

    /**
     * Lawyer-side bindings
     */
    function setupEventListeners() {
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMessage();
            });
        }
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);

        if (sidebarSearch) {
            sidebarSearch.addEventListener('input', (e) => {
                renderSidebar(e.target.value);
            });
        }

        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                if (confirm('Mark this consultation as complete?')) {
                     LexFlowStorage.updateConsultation(currentConsId, { status: 'COMPLETED' });
                     window.location.href = 'firm-consultation-dashboard.html';
                }
            });
        }
    }
});
