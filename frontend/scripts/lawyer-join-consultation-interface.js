// ===================================================
// LexFlow — Lawyer Consultation Interface Interaction
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

    // --- End Call ---
    const btnLeave = document.getElementById('btn-leave');
    if (btnLeave) {
        btnLeave.addEventListener('click', () => {
            const confirmed = confirm("Are you sure you want to end the consultation for everyone?");
            if (confirmed) {
                // Redirect back to firm dashboard
                window.location.href = 'firm-consultation-dashboard.html';
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
        
        // Define avatar and author based on who is sending (Lawyer is outgoing here)
        const avatarSrc = isOutgoing ? 'https://ui-avatars.com/api/?name=Julian+Vance&background=1e2a4a&color=fff&size=32' : 'https://ui-avatars.com/api/?name=John+Doe&background=4f8ef7&color=fff&size=32';
        const authorName = isOutgoing ? 'You' : 'John Doe (Client)';

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
                appendMessage(text, true); // True means outgoing (Lawyer)
                chatInput.value = '';
                
                // Simulate a fake reply from client after 1.5 seconds
                setTimeout(() => {
                    appendMessage("Yes, I have it open right now. Give me a second to read it.", false);
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
