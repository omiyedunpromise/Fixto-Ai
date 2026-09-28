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

const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// 1. MENU LOGIC
function openMenu() { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); }
function closeMenu() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
menuToggle.addEventListener('click', openMenu);
closeSidebar.addEventListener('click', closeMenu);
sidebarOverlay.addEventListener('click', closeMenu);

// 2. VIEW SWITCHING LOGIC
function switchView(viewName) {
    navLinks.forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
    if(activeLink) activeLink.classList.add('active');
    
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active-view'));
    document.getElementById(`view-${viewName}`).classList.add('active-view');
    closeMenu();
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(link.getAttribute('data-view'));
    });
});

// 3. AUTH & FOOTER LOGIC
function openModal(id) { document.getElementById(id).classList.add('open'); closeMenu(); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function simulateLogin() {
    closeModal('login-modal');
    closeModal('signup-modal');
    document.getElementById('sidebar-footer-auth').style.display = 'none';
    document.getElementById('sidebar-footer-profile').style.display = 'block';
}

function simulateLogout() {
    closeModal('settings-modal');
    document.getElementById('sidebar-footer-auth').style.display = 'block';
    document.getElementById('sidebar-footer-profile').style.display = 'none';
}

// 4. LIBRARY TABS LOGIC
function switchLibraryTab(type, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const items = document.querySelectorAll('.library-item');
    items.forEach(item => {
        if (type === 'all' || item.getAttribute('data-type') === type) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// 5. PROJECT CREATION LOGIC
function createProject(category) {
    const projectName = prompt(`Enter name for your ${category} project:`);
    if (projectName) {
        const projectList = document.getElementById('project-list');
        const projectHTML = `
            <div class="project-card">
                <div class="project-card-header">
                    <h4>${projectName} (${category})</h4>
                    <i class="fas fa-ellipsis-v" style="color: var(--text-secondary); cursor: pointer;"></i>
                </div>
                <div class="project-chat-box">
                    <input type="text" placeholder="Write something inside...">
                    <button><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        projectList.insertAdjacentHTML('beforeend', projectHTML);
    }
}

// 6. IMAGE STUDIO LOGIC
function generateStudioImage() {
    const prompt = document.getElementById('image-prompt').value.trim();
    if (!prompt) return;
    
    const grid = document.getElementById('studio-image-grid');
    const safePrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
    
    const imgHTML = `<div class="image-card"><img src="${imageUrl}" alt="AI"><p>${prompt}</p></div>`;
    grid.insertAdjacentHTML('afterbegin', imgHTML);
    document.getElementById('image-prompt').value = '';
}

// 7. FILE UPLOAD & CHAT LOGIC
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "";
});

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
