const BACKEND_URL = "https://x-zith123-fixto-ai.hf.space/api/chat"; 

// DOM Elements
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

// 1. MENU LOGIC
function openMenu() { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); }
function closeMenu() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
menuToggle.addEventListener('click', openMenu);
closeSidebar.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

// 2. VIEW SWITCHING LOGIC (Image, Library, Projects)
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const viewName = link.getAttribute('data-view');
        
        // Hide all views
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
        // Show selected view
        document.getElementById(`view-${viewName}`).classList.add('active-view');
        
        closeMenu();
    });
});

// 3. AUTH MODAL LOGIC
document.querySelector('.btn-login').addEventListener('click', () => document.getElementById('login-modal').classList.add('open'));
document.querySelector('.btn-signup').addEventListener('click', () => document.getElementById('signup-modal').classList.add('open'));
userProfileBtn.addEventListener('click', () => document.getElementById('settings-modal').classList.add('open'));

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Simulate Login (Changes UI to show logged in state)
function simulateLogin() {
    closeModal('login-modal');
    closeModal('signup-modal');
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-logged-in').style.display = 'flex';
    document.querySelector('.user-email').textContent = "promise@xzith.com (Logged In)";
}

// 4. FILE UPLOAD
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "";
});

// 5. CHAT LOGIC
function addMessage(role, content, type = 'text') {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-msg' : 'ai-msg');
    let contentHTML = type === 'image' && role === 'assistant' ? `<img src="${content}" style="max-width: 100%; border-radius: 12px;">` : `<p>${content}</p>`;
    msgDiv.innerHTML = `<div class="msg-content">${contentHTML}</div>${role === 'assistant' ? `<div class="msg-actions"><button onclick="speakText(this)"><i class="fas fa-volume-up"></i></button><button onclick="copyText(this)"><i class="fas fa-copy"></i></button><button onclick="sendFeedback(this, true)"><i class="fas fa-thumbs-up"></i></button><button onclick="sendFeedback(this, false)"><i class="fas fa-thumbs-down"></i></button></div>` : ''}`;
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
        const response = await fetch(BACKEND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: "demo-user-123", message: text }) });
        const data = await response.json();
        addMessage('assistant', data.response, data.type);
    } catch (error) {
        addMessage('assistant', "Sorry, I'm having trouble connecting. Please check if the Hugging Face backend is running.");
    } finally {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.disabled = false;
    }
}

function speakText(btn) { const text = btn.closest('.message').querySelector('.msg-content').innerText; const utterance = new SpeechSynthesisUtterance(text); speechSynthesis.speak(utterance); }
function copyText(btn) { const text = btn.closest('.message').querySelector('.msg-content').innerText; navigator.clipboard.writeText(text); btn.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000); }
function sendFeedback(btn, isLiked) { const parent = btn.parentElement; parent.querySelectorAll('button').forEach(b => b.classList.remove('active-like', 'active-dislike')); btn.classList.add(isLiked ? 'active-like' : 'active-dislike'); }

// 6. VOICE INPUT
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    voiceBtn.addEventListener('click', () => { voiceBtn.classList.add('listening'); recognition.start(); });
    recognition.onresult = (event) => { userInput.value = event.results[0][0].transcript; voiceBtn.classList.remove('listening'); };
    recognition.onend = () => voiceBtn.classList.remove('listening');
} else { voiceBtn.style.display = 'none'; }

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
