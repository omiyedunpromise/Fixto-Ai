// --- CONFIGURATION ---
// REPLACE THIS WITH YOUR ACTUAL HUGGING FACE SPACE URL
const BACKEND_URL = "https://x-zith123-fixto-ai.hf.space/api/chat"; 
const FEEDBACK_URL = "https://x-zith123-fixto-ai.hf.space/api/feedback";

// --- DOM ELEMENTS ---
const chatCanvas = document.getElementById('chat-canvas');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const welcomeScreen = document.getElementById('welcome-screen');

// --- CHAT LOGIC ---
function addMessage(role, content, type = 'text') {
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-msg' : 'ai-msg');

    let contentHTML = '';
    if (type === 'image' && role === 'assistant') {
        contentHTML = `<img src="${content}" alt="Generated Image" style="max-width: 100%; border-radius: 12px;">`;
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
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: "demo-user-123", message: text })
        });
        const data = await response.json();
        addMessage('assistant', data.response, data.type);
    } catch (error) {
        addMessage('assistant', "Sorry, I'm having trouble connecting to the X-ZITH servers right now.");
    } finally {
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// --- ACTION BUTTONS ---
function speakText(btn) {
    const text = btn.closest('.message').querySelector('.msg-content').innerText;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

function copyText(btn) {
    const text = btn.closest('.message').querySelector('.msg-content').innerText;
    navigator.clipboard.writeText(text);
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
}

async function sendFeedback(btn, isLiked) {
    // Visual feedback
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.classList.remove('active-like', 'active-dislike'));
    btn.classList.add(isLiked ? 'active-like' : 'active-dislike');

    // In a real app, you'd send the specific message_id to the backend here
    console.log(`Feedback sent: ${isLiked ? 'Liked' : 'Disliked'}`);
}

// --- VOICE INPUT (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('listening');
        recognition.start();
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        voiceBtn.classList.remove('listening');
    };

    recognition.onend = () => voiceBtn.classList.remove('listening');
} else {
    voiceBtn.style.display = 'none'; // Hide if browser doesn't support it
}

// --- EVENT LISTENERS ---
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
