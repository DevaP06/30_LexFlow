document.addEventListener('DOMContentLoaded', () => {
    // 1. App State
    const _activeConsId = sessionStorage.getItem('active_cons_id');
    if (!_activeConsId) { window.location.href = 'client-consultation-dashboard.html'; return; }
    let currentConsId = _activeConsId;
    
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
     * Renders the chat sidebar dynamically from storage
     */
    function renderSidebar(filter = '') {
        if (!chatListContainer) return;
        const _cu = (() => { try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); } catch { return {}; } })();
        const _clientName = (_cu.fullName || _cu.name || '').trim().toLowerCase();
        const consultations = LexFlowStorage.getConsultations().filter(c =>
            c.status !== 'CANCELLED' &&
            c.lawyerName && c.lawyerName !== 'undefined' &&
            (_clientName ? (c.clientName || '').trim().toLowerCase() === _clientName : true)
        );
        
        chatListContainer.innerHTML = '';
        const seenLawyers = new Set();
        
        consultations.forEach(cons => {
            const uniqueKey = cons.lawyerId || cons.lawyerName;
            if (seenLawyers.has(uniqueKey)) return;

            // Filter by name or firm
            if (filter && 
                !(cons.lawyerName || '').toLowerCase().includes(filter.toLowerCase()) && 
                !(cons.firmName || '').toLowerCase().includes(filter.toLowerCase())) {
                return;
            }
            
            seenLawyers.add(uniqueKey);

            const isActive = cons.id === currentConsId;
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${isActive ? 'active' : ''}`;
            chatItem.dataset.id = cons.id;
            
            chatItem.innerHTML = `
                <div class="chat-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(cons.lawyerName)}&background=1e2a4a&color=fff" alt="${cons.lawyerName}">
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-top">
                        <span class="chat-name">${cons.lawyerName}</span>
                        <span class="chat-time">${cons.time.split(' - ')[0]}</span>
                    </div>
                    <div class="chat-item-bottom">
                        <span class="chat-snippet">${cons.firmName}</span>
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
     * Loads a specific consultation into the main chat area
     */
    function loadConsultation(id) {
        const consultation = LexFlowStorage.getConsultationById(id);
        if (!consultation) return;

        // Update Header
        if (headerName) headerName.textContent = consultation.lawyerName;
        if (headerAvatar) {
            headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.lawyerName)}&background=1e2a4a&color=fff`;
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
            const welcome = {
                sender: 'lawyer',
                text: `Hello! I'm ${LexFlowStorage.getConsultationById(currentConsId)?.lawyerName || 'your lawyer'}. How can I assist you with your case today?`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            LexFlowStorage.addChatMessage(currentConsId, welcome);
            appendMessageToUI(welcome);
        } else {
            messages.forEach(msg => appendMessageToUI(msg));
        }
        
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    /**
     * Appends a single message to the UI
     */
    function appendMessageToUI(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`;
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
     * Sends a message from the client
     */
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const newMsg = { sender: 'user', text: text };
        const savedMsg = LexFlowStorage.addChatMessage(currentConsId, newMsg);
        appendMessageToUI(savedMsg);
        chatInput.value = '';

        // Mock Lawyer Reply
        const activeIdAtTimeOfSend = currentConsId;
        setTimeout(() => {
            const replies = [
                "I've received your message. Let's discuss this further.",
                "Can you provide more details about this?",
                "I see. I'll look into the legal precedents for this matter.",
                "Understood. We should prepare the documentation accordingly."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            
            const reply = {
                sender: 'lawyer',
                text: randomReply
            };
            
            LexFlowStorage.addChatMessage(activeIdAtTimeOfSend, reply);
            
            // Only update UI if user is still in the same chat
            if (sessionStorage.getItem('active_cons_id') === activeIdAtTimeOfSend) {
                appendMessageToUI(reply);
            }
        }, 1500);
    }

    /**
     * Global input bindings
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
                if (confirm('End this consultation session?')) {
                    window.location.href = 'client-consultation-dashboard.html';
                }
            });
        }
    }
});
