const BACKEND_URL = "https://x-zith123-fixto-ai.hf.space/api/chat";

// --- USER STATE (Saved so login survives page refresh) ---
let currentUser = JSON.parse(localStorage.getItem('fixto_user')) || null;

const chatCanvas = document.getElementById('chat-canvas');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const navLinks = document.querySelectorAll('.nav-link');
const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// --- AUTH UI ---
function updateAuthUI() {
    const authFooter = document.getElementById('sidebar-footer-auth');
    const profileFooter = document.getElementById('sidebar-footer-profile');
    if (currentUser) {
        authFooter.style.display = 'none';
        profileFooter.style.display = 'block';
        document.getElementById('user-name-display').textContent = currentUser.name;
        document.getElementById('user-avatar-letter').textContent = currentUser.name.charAt(0).toUpperCase();
    } else {
        authFooter.style.display = 'block';
        profileFooter.style.display = 'none';
    }
}

function saveUser(name, email, provider) {
    currentUser = { name: name, email: email, provider: provider };
    localStorage.setItem('fixto_user', JSON.stringify(currentUser));
    closeModal('login-modal');
    closeModal('signup-modal');
    updateAuthUI();
}

function loginWith(provider) {
    const name = prompt("Enter your name to continue with " + provider + ":") || "Friend";
    const email = prompt("Enter your email:") || "user@gmail.com";
    saveUser(name, email, provider);
}

function emailLogin() {
    const email = document.getElementById('login-email').value || "user@xzith.com";
    const name = email.split('@')[0];
    saveUser(name, email, "Email");
}

function emailSignup() {
    const name = document.getElementById('signup-name').value || "Friend";
    const email = document.getElementById('signup-email').value || "user@xzith.com";
    saveUser(name, email, "Email");
}

function simulateLogout() {
    currentUser = null;
    localStorage.removeItem('fixto_user');
    closeModal('settings-modal');
    updateAuthUI();
}

function openSettings() {
    if (!currentUser) { openModal('login-modal'); return; }
    document.getElementById('settings-name').textContent = currentUser.name;
    document.getElementById('settings-email').textContent = currentUser.email;
    document.getElementById('settings-provider').textContent = currentUser.provider;
    openModal('settings-modal');
}

// --- MENU & VIEWS ---
function openMenu() { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); }
function closeMenu() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
menuToggle.addEventListener('click', openMenu);
closeSidebar.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

function switchView(viewName) {
    navLinks.forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector('.nav-link[data-view="' + viewName + '"]');
    if (activeLink) activeLink.classList.add('active');
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
    document.getElementById('view-' + viewName).classList.add('active-view');
    closeMenu();
}
navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.getAttribute('data-view')); }));

function openModal(id) { document.getElementById(id).classList.add('open'); closeMenu(); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// --- LIBRARY TABS ---
function switchLibraryTab(type, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.library-item').forEach(item => {
        item.style.display = (type === 'all' || item.getAttribute('data-type') === type) ? 'flex' : 'none';
    });
}

// --- PROJECTS ---
function createProject(category) {
    const projectName = prompt("Enter name for your " + category + " project:");
    if (projectName) {
        const projectList = document.getElementById('project-list');
        projectList.insertAdjacentHTML('beforeend',
            '<div class="project-card"><div class="project-card-header"><h4>' + projectName + ' (' + category + ')</h4><i class="fas fa-ellipsis-v"></i></div>' +
            '<div class="project-chat-box"><input type="text" placeholder="Write something inside..."><button><i class="fas fa-paper-plane"></i></button></div></div>');
    }
}

// --- IMAGE STUDIO ---
function generateStudioImage() {
    const prompt = document.getElementById('image-prompt').value.trim();
    if (!prompt) return;
    const grid = document.getElementById('studio-image-grid');
    const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt) + "?width=400&height=400&nologo=true&seed=" + Math.floor(Math.random() * 1000);
    grid.insertAdjacentHTML('afterbegin', '<div class="image-card"><img src="' + url + '" alt="AI"><p>' + prompt + '</p></div>');
    document.getElementById('image-prompt').value = '';
}

// --- UPLOAD ---
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : ""; });

// --- CHAT ---
function addMessage(role, content, type) {
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-msg' : 'ai-msg');
    const contentHTML = (type === 'image' && role === 'assistant') ? '<img src="' + content + '" style="max-width:100%; border-radius:12px;">' : '<p>' + content + '</p>';
    msgDiv.innerHTML = '<div class="msg-content">' + contentHTML + '</div>' +
        (role === 'assistant' ? '<div class="msg-actions"><button onclick="speakText(this)"><i class="fas fa-volume-up"></i></button><button onclick="copyText(this)"><i class="fas fa-copy"></i></button><button onclick="sendFeedback(this, true)"><i class="fas fa-thumbs-up"></i></button><button onclick="sendFeedback(this, false)"><i class="fas fa-thumbs-down"></i></button></div>' : '');
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
            body: JSON.stringify({
                user_id: currentUser ? currentUser.email : "guest",
                user_name: currentUser ? currentUser.name : null,
                message: text
            })
        });
        const data = await response.json();
        const reply = data.response || "Sorry, I could not process that request.";
        addMessage('assistant', reply, data.type || 'text');
    } catch (error) {
        addMessage('assistant', "Sorry, I'm having trouble connecting to the X-ZITH servers right now.");
    } finally {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.disabled = false;
    }
}

function speakText(btn) { const text = btn.closest('.message').querySelector('.msg-content').innerText; speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }
function copyText(btn) { const text = btn.closest('.message').querySelector('.msg-content').innerText; navigator.clipboard.writeText(text); btn.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000); }
function sendFeedback(btn, isLiked) { const parent = btn.parentElement; parent.querySelectorAll('button').forEach(b => b.classList.remove('active-like', 'active-dislike')); btn.classList.add(isLiked ? 'active-like' : 'active-dislike'); }

// --- VOICE ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    voiceBtn.addEventListener('click', () => { voiceBtn.classList.add('listening'); recognition.start(); });
    recognition.onresult = (event) => { userInput.value = event.results[0][0].transcript; voiceBtn.classList.remove('listening'); };
    recognition.onend = () => voiceBtn.classList.remove('listening');
} else { voiceBtn.style.display = 'none'; }

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

// Load saved login on page start
updateAuthUI();
