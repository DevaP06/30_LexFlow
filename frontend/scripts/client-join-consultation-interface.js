// ===================================================
// LexFlow — Consultation Interface Interaction
// ===================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- Media Controls Toggle ---
    const btnMic = document.getElementById('btn-mic');
    const btnCam = document.getElementById('btn-cam');

    function toggleControl(btn) {
        btn.classList.toggle('off');
        const iconOn = btn.querySelector('.icon-on');
        const iconOff = btn.querySelector('.icon-off');
        
        if (btn.classList.contains('off')) {
            iconOn.classList.add('hidden');
            iconOff.classList.remove('hidden');
        } else {
            iconOn.classList.remove('hidden');
            iconOff.classList.add('hidden');
        }
    }

    if (btnMic) {
        btnMic.addEventListener('click', () => toggleControl(btnMic));
    }

    if (btnCam) {
        btnCam.addEventListener('click', () => toggleControl(btnCam));
    }

    // --- Leave Call ---
    const btnLeave = document.getElementById('btn-leave');
    if (btnLeave) {
        btnLeave.addEventListener('click', () => {
            const confirmed = confirm("Are you sure you want to exit the consultation?");
            if (confirmed) {
                // Redirect back to dashboard
                window.location.href = 'client-consultation-dashboard.html';
            }
        });
    }

    // --- Chat System ---
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    function appendMessage(text, isOutgoing) {
        const timeValue = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        // Define avatar and author based on who is sending
        const avatarSrc = isOutgoing ? 'https://ui-avatars.com/api/?name=John+Doe&background=4f8ef7&color=fff&size=32' : 'https://ui-avatars.com/api/?name=Julian+Vance&background=1e2a4a&color=fff&size=32';
        const authorName = isOutgoing ? 'You' : 'Adv. Julian Vance';

        messageDiv.innerHTML = `
            <div class="msg-avatar">
                <img src="${avatarSrc}" alt="${authorName}">
            </div>
            <div class="msg-content">
                <span class="msg-author">${authorName} <span class="msg-time">${timeValue}</span></span>
                <div class="msg-bubble">${text}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                appendMessage(text, true); // True means outgoing
                chatInput.value = '';
                
                // Simulate a fake reply after 1.5 seconds for demo purposes
                setTimeout(() => {
                    appendMessage("I completely understand. I will pull up the relevant documents right now.", false);
                }, 1500);
            }
        });
    }

    // --- Meeting Timer Setup ---
    const timerElem = document.getElementById('meeting-timer');
    let seconds = 0;

    function formatTime(sec) {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    if (timerElem) {
        setInterval(() => {
            seconds++;
            timerElem.textContent = formatTime(seconds);
        }, 1000);
    }
});
