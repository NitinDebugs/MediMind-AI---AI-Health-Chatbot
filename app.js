document.addEventListener('DOMContentLoaded', async () => {
    let token = localStorage.getItem('medimind_token');
    const API_BASE = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : '';
    
    // Auto-login / Auth Flow for demonstration
    async function authenticate() {
        if (!token) {
            const guestName = 'Student_' + Math.floor(Math.random() * 10000);
            const guestEmail = guestName.toLowerCase() + '@example.com';
            const guestPassword = 'guestPassword123';
            
            try {
                // Register
                await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: guestName, email: guestEmail, password: guestPassword })
                });

                // Login
                const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: guestEmail, password: guestPassword })
                });

                const data = await loginRes.json();
                if (data.token) {
                    token = data.token;
                    localStorage.setItem('medimind_token', token);
                    console.log('Successfully authenticated as guest:', guestName);
                }
            } catch (error) {
                console.error("Auth error:", error);
            }
        }
    }
    
    await authenticate();

    // Chat Flow
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatContainer = document.getElementById('chat-messages-container');

    const appendMessage = (role, text) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const wrapper = document.createElement('div');
        
        if (role === 'user') {
            wrapper.className = "flex flex-col items-end gap-2 fade-in max-w-full";
            wrapper.innerHTML = `
                <div class="signature-gradient text-white px-4 py-3 rounded-lg rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-sm">
                    ${text}
                </div>
                <span class="text-[10px] text-on-surface-variant mr-2">${time}</span>
            `;
        } else {
            wrapper.className = "flex flex-col items-start gap-2 fade-in max-w-full";
            wrapper.innerHTML = `
                <div class="bg-surface-container-high px-4 py-3 rounded-lg rounded-tl-none max-w-[85%] text-sm leading-relaxed shadow-sm">
                    ${text}
                </div>
                <span class="text-[10px] text-on-surface-variant ml-2">${time}</span>
            `;
        }
        
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    const showThinkingIndicator = () => {
        const wrapper = document.createElement('div');
        wrapper.id = "thinking-indicator";
        wrapper.className = "flex flex-col items-start gap-2";
        wrapper.innerHTML = `
            <div class="bg-surface-container-high px-4 py-3 rounded-lg rounded-tl-none text-sm flex items-center gap-3 shadow-sm">
                <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span class="text-on-surface-variant/70 italic text-xs font-semibold">MediMind is thinking...</span>
            </div>
        `;
        chatContainer.appendChild(wrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    const removeThinkingIndicator = () => {
        const el = document.getElementById('thinking-indicator');
        if (el) el.remove();
    };

    if(chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if (!msg) return;

            // Display user message
            appendMessage('user', msg);
            chatInput.value = '';

            // Show thinking
            showThinkingIndicator();

            try {
                const res = await fetch(`${API_BASE}/api/chat/send`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ message: msg })
                });

                const data = await res.json();
                removeThinkingIndicator();
                
                if (data.reply) {
                    // Simple logic to parse markdown boldness for UX (replace **text** with bold tags)
                    const formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                    appendMessage('ai', formattedReply);
                } else {
                    appendMessage('ai', "I encountered an error connecting to my core processor.");
                }
            } catch (error) {
                removeThinkingIndicator();
                appendMessage('ai', "Could not reach the server right now. Make sure the Node.js backend is running.");
                console.error(error);
            }
        });
    }
    
    // Add custom styles for fade-in
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
});
