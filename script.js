// --- CONFIGURATION ---
const BACKEND_URL = "https://x-zith123-fixto-ai.hf.space/api/chat"; 
const FEEDBACK_URL = "https://x-zith123-fixto-ai.hf.space/api/feedback";

// --- DOM ELEMENTS ---
const chatCanvas = document.getElementById('chat-canvas');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const navLinks = document.querySelectorAll('.nav-link');

// Menu & Modal Elements
const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const userProfileBtn = document.getElementById('user-profile-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

// --- 1. MENU & SIDEBAR LOGIC ---
function openMenu() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
}

function closeMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

menuToggle.addEventListener('click', openMenu);
closeSidebar.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

// --- 2. SETTINGS MODAL LOGIC ---
userProfileBtn.addEventListener('click', () => {
    settingsModal.classList.add('open');
    closeMenu(); // Close sidebar when opening settings
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('open');
});

// Close modal if clicking outside the content
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('open');
});

// --- 3. SIDEBAR NAV CLICKABLE LOGIC ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const view = link.getAttribute('data-view');
        if(view !== 'chats') {
            alert(`${view.charAt(0).toUpperCase() + view.slice(1)} view coming soon in Phase 2!`);
        }
        closeMenu(); // Close menu after selection
    });
});

// --- 4. AUTH BUTTONS LOGIC ---
document.querySelector('.btn-login').addEventListener('click', () => alert("Login modal coming in Phase 2!"));
document.querySelector('.btn-signup').addEventListener('click', () => alert("Sign Up modal coming in Phase 2!"));

// --- 5. FILE UPLOAD LOGIC ---
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "";
});

// --- 6. CHAT LOGIC ---
function addMessage(role, content, type = 'text') {
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-msg' : 'ai-msg');

    let contentHTML = '';
    if (type === 'image' && role === 'assistant') {
        contentHTML = `<img src="${content}" alt="Generated Image" style="max-width: 100%; border-radius: 12px; margin-top: 10px;">`;
    } else {
        contentHTML = `<p>${content}</p>`;
    }

    msgDiv.innerHTML = `
        <div class="msg-content">${contentHTML}</div>
        ${role === 'assistant' ? `
        <div class="msg-actions">
            <button onclick="speakText(this)" title="Read Aloud"><i class="fas fa-volume-up"></i></button>
            <button onclick="copyText(this)" title="Copy"><i class="fas fa-copy"></i></button>
            <button onclick="sendFeedback(this, true)" title="Good Response"><i class="fas fa-thumbs-up"></i></button>
            <button onclick="sendFeedback(this, false)" title="Bad Response"><i class="fas fa-thumbs-down"></i></button>
        </div>` : ''}
    `;
    chatCanvas.appendChild(msgDiv);
    chatCanvas.scrollTop = chatCanvas.scrollHeight;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    userInput.value = '';
    fileNameDisplay.textContent = ""; 
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    sendBtn.disabled = true;

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: "demo-user-123", message: text })
        });
        const data = await response.json();
        addMessage('assistant', data.response, data.type);
    } catch (error) {
        console.error(error);
        addMessage('assistant', "Sorry, I'm having trouble connecting to the X-ZITH servers. Please check if the Hugging Face backend is running.");
    } finally {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.disabled = false;
    }
}

// --- 7. ACTION BUTTONS ---
function speakText(btn) {
    const text = btn.closest('.message').querySelector('.msg-content').innerText;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

function copyText(btn) {
    const text = btn.closest('.message').querySelector('.msg-content').innerText;
    navigator.clipboard.writeText(text);
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => btn.innerHTML = originalIcon, 2000);
}

function sendFeedback(btn, isLiked) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.classList.remove('active-like', 'active-dislike'));
    btn.classList.add(isLiked ? 'active-like' : 'active-dislike');
}

// --- 8. VOICE INPUT ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('listening');
        recognition.start();
    });
    recognition.onresult = (event) => {
        userInput.value = event.results[0][0].transcript;
        voiceBtn.classList.remove('listening');
    };
    recognition.onend = () => voiceBtn.classList.remove('listening');
} else {
    voiceBtn.style.display = 'none';
}

// --- 9. EVENT LISTENERS ---
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
