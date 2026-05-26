document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('medimind_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_BASE = !window.location.hostname || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : '';

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        document.getElementById('profile-name').innerText = payload.username || 'Student';
    } catch(e) {}

    // SPA Routing Logic
    const views = {
        'home': document.getElementById('view-home'),
        'chat': document.getElementById('view-chat'),
        'mood': document.getElementById('view-mood'),
        'medicine': document.getElementById('view-medicine')
    };
    const tabs = {
        'home': document.getElementById('tab-home'),
        'chat': document.getElementById('tab-chat'),
        'mood': document.getElementById('tab-mood'),
        'medicine': document.getElementById('tab-medicine')
    };

    const applyRoute = (tabId) => {
        Object.keys(views).forEach(key => {
            if (key === tabId) {
                views[key].style.display = key === 'chat' ? 'flex' : 'flex';
                views[key].style.pointerEvents = 'auto';
                setTimeout(() => views[key].style.opacity = '1', 10);
            } else {
                views[key].style.opacity = '0';
                views[key].style.pointerEvents = 'none';
                setTimeout(() => views[key].style.display = 'none', 300);
            }
        });

        const activeClass = "w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl bg-white/5 text-white font-medium transition-all group relative border border-white/10";
        const inactiveClass = "w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white font-medium transition-all group border border-transparent";
        
        Object.keys(tabs).forEach(key => {
            if(tabs[key]) {
                tabs[key].className = (key === tabId) ? activeClass : inactiveClass;
                // Add specific hover colors back if it's inactive
                if(key !== tabId) {
                    if(key === 'home') tabs[key].classList.add('group-hover:text-brand-blue');
                    if(key === 'chat') tabs[key].classList.add('group-hover:text-brand-purple');
                    if(key === 'mood') tabs[key].classList.add('group-hover:text-brand-cyan');
                    if(key === 'medicine') tabs[key].classList.add('group-hover:text-brand-purple');
                }
            }
            
            // Sync mobile tab colors
            const mobTab = document.getElementById('mob-tab-' + key);
            if(mobTab) {
                if(key === tabId) {
                    mobTab.classList.add('text-white');
                    mobTab.classList.remove('text-zinc-500');
                } else {
                    mobTab.classList.remove('text-white');
                    mobTab.classList.add('text-zinc-500');
                }
            }
        });

        if(tabId === 'mood') loadMoodHistory();
        if(tabId === 'medicine') fetchReminders();
    };

    // Listen for hash changes to drive SPA routing natively
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        if(views[hash]) applyRoute(hash);
    });

    // Helper for anchor elements (also used by onclicks needing JS context)
    window.switchTab = (tabId) => {
        window.location.hash = tabId;
    };

    // Load initial route
    const initialHash = window.location.hash.replace('#', '') || 'home';
    applyRoute(views[initialHash] ? initialHash : 'home');

    // Home Page: Rotating Quotes Logic
    const quotes = [
        "You’ve survived 100% of your bad days.",
        "Small steps still move you forward.",
        "You are stronger than your thoughts.",
        "Healing is not linear, and that is okay.",
        "Your peace is more important than your productivity."
    ];
    let quoteIndex = 0;
    const quoteContainer = document.getElementById('quote-container');
    const quoteText = document.getElementById('motivational-quote');

    if (quoteContainer && quoteText) {
        setInterval(() => {
            quoteContainer.style.opacity = '0';
            setTimeout(() => {
                quoteIndex = (quoteIndex + 1) % quotes.length;
                quoteText.innerText = `"${quotes[quoteIndex]}"`;
                quoteContainer.style.opacity = '1';
            }, 600);
        }, 6000);
    }

    // Chat Logic Variables
    let isThinking = false;
    const chatForm = document.getElementById('dash-chat-form');
    const chatInput = document.getElementById('dash-chat-input');
    const chatContainer = document.getElementById('chat-messages');
    const aiPulseRing = document.getElementById('ai-pulse-ring');
    const aiStatusText = document.getElementById('ai-status');
    const aiAvatarIcon = document.getElementById('ai-avatar-icon');
    const sideInsightText = document.getElementById('side-insight-text');
    const sideInsightGlow = document.getElementById('side-insight-glow');

    window.quickMood = (moodStr) => {
        window.location.hash = 'chat';
        if(chatInput) {
            chatInput.value = `I am feeling ${moodStr}.`;
            setTimeout(() => chatInput.focus(), 300);
        }
    };

    window.clearChat = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/chat/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            
            if(chatContainer) {
                chatContainer.innerHTML = '';
            }
            if(sideInsightText) sideInsightText.innerHTML = "Session wiped successfully. MediMind logic baseline reset.";
            if(sideInsightGlow) sideInsightGlow.className = "absolute -top-10 -right-10 w-24 h-24 bg-gray-200/50 rounded-full blur-2xl transition-colors duration-500";
            
            if(data.reply) {
                appendMessage('ai', data.reply, data.emotions_detected);
            }
        } catch(e) {
            console.error("Failed to clear session.");
        }
    };

    const setAIStatus = (status) => {
        isThinking = (status === 'thinking');
        if(status === 'active') {
            if(aiPulseRing) aiPulseRing.classList.remove('opacity-100');
            if(aiStatusText) aiStatusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Online`;
            if(aiAvatarIcon) aiAvatarIcon.classList.remove('orb-pulse');
        } else if (status === 'thinking') {
            if(aiPulseRing) aiPulseRing.classList.add('opacity-100');
            if(aiStatusText) aiStatusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span> Thinking...`;
            if(aiAvatarIcon) aiAvatarIcon.classList.add('orb-pulse');
            
            const id = 'think-' + Date.now();
            const wrapper = document.createElement('div');
            wrapper.className = "flex flex-col items-start gap-2 message-enter max-w-full";
            wrapper.id = id;
            wrapper.innerHTML = `
                <div class="glass-panel bg-white/60 border border-white/50 px-5 py-3.5 rounded-2xl rounded-tl-[4px] shadow-sm flex items-center gap-3">
                    <div class="flex gap-1"><span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span><span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style="animation-delay: 0.15s;"></span><span class="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style="animation-delay: 0.3s;"></span></div>
                </div>
            `;
            if(chatContainer) chatContainer.appendChild(wrapper);
            scrollToBottom();
            return id;
        }
    };

    const scrollToBottom = () => { if(chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight; };

    const appendMessage = (role, text, emotions = []) => {
        if(!chatContainer) return;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const wrapper = document.createElement('div');
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

        if (role === 'user') {
            wrapper.className = "flex flex-col items-end gap-1.5 message-enter max-w-full w-full ml-auto";
            wrapper.innerHTML = `<div class="bg-gradient-to-tr from-brand-blue to-brand-purple text-white px-5 py-3.5 rounded-[20px] rounded-tr-[4px] shadow-[0_4px_20px_rgba(79,138,255,0.3)] max-w-[85%] text-[14.5px] leading-relaxed font-medium">${formattedText}</div><span class="text-[10px] font-bold text-zinc-500 mr-2 uppercase tracking-wider">${time}</span>`;
        } else {
            wrapper.className = "flex flex-col items-start gap-1.5 message-enter max-w-full w-full mt-4";
            
            let emotionHtml = "";
            let glowClass = "shadow-[0_8px_32px_rgba(0,0,0,0.04)]"; 
            const negatives = ['stress', 'anxiety', 'worried', 'sad', 'overwhelmed', 'fear', 'terrible', 'bad'];
            const positives = ['calm', 'happy', 'joy', 'peaceful', 'better', 'good', 'neutral', 'great'];
            
            if (emotions.length > 0) {
                const isNegative = emotions.some(e => negatives.includes(e.toLowerCase()));
                const isPositive = emotions.some(e => positives.includes(e.toLowerCase()));
                
                if (isNegative) {
                    glowClass = "shadow-[0_0_24px_rgba(239,68,68,0.15)] border-red-500/20";
                    emotionHtml = `<div class="absolute -top-3.5 left-4 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap z-10 animate-pulse backdrop-blur-md">😟 ${emotions.join(', ')}</div>`;
                    if(sideInsightText) sideInsightText.innerHTML = `Detected elements of ${emotions[0]}. MediMind is prioritizing grounding exercises.`;
                    if(sideInsightGlow) sideInsightGlow.className = `absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 bg-red-500/20`;
                } else if (isPositive) {
                    glowClass = "shadow-[0_0_24px_rgba(34,197,94,0.15)] border-green-500/20";
                    emotionHtml = `<div class="absolute -top-3.5 left-4 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap z-10 backdrop-blur-md">😌 ${emotions.join(', ')}</div>`;
                    if(sideInsightText) sideInsightText.innerHTML = `Signs of positive shift detected (${emotions[0]}). Protocol effective.`;
                    if(sideInsightGlow) sideInsightGlow.className = `absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 bg-green-500/20`;
                } else {
                    emotionHtml = `<div class="absolute -top-3.5 left-4 bg-white/10 text-zinc-300 border border-white/10 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap z-10 backdrop-blur-md">${emotions.join(', ')}</div>`;
                }
            }

            wrapper.innerHTML = `
                <div class="relative w-full max-w-[85%] mt-2">
                    ${emotionHtml}
                    <div class="glass-panel px-5 py-4 rounded-[20px] rounded-tl-[4px] ${glowClass} text-[14.5px] leading-relaxed text-zinc-200 relative z-0 border border-white/10">
                        ${formattedText}
                    </div>
                </div>
                <div class="flex gap-2 mt-1.5 ml-2 overflow-x-auto no-scrollbar py-1 w-full opacity-0 animate-[slideUpFade_0.3s_forwards] delay-300">
                   <button onclick="document.getElementById('dash-chat-input').value='Tell me more.'; document.getElementById('dash-chat-form').dispatchEvent(new Event('submit'));" class="px-4 py-1.5 text-[11px] bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 rounded-full transition-all text-zinc-300 font-bold active:scale-95 backdrop-blur-sm">Explore further</button>
                </div>
            `;
        }
        chatContainer.appendChild(wrapper);
        scrollToBottom();
    };

    if(chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(isThinking) return;
            const msg = chatInput.value.trim();
            if (!msg) return;
            appendMessage('user', msg);
            chatInput.value = '';
            
            const thinkId = setAIStatus('thinking');
            try {
                const res = await fetch(`${API_BASE}/api/chat/send`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ message: msg })
                });
                const data = await res.json();
                document.getElementById(thinkId)?.remove();
                setAIStatus('active');
                if(data.reply) appendMessage('ai', data.reply, data.emotions || []);
            } catch (error) {
                document.getElementById(thinkId)?.remove();
                setAIStatus('active');
                appendMessage('ai', "Warning: Connection interrupted.", ['System Error']);
            }
        });
    }

    // Mood Log Submission
    const moodForm = document.getElementById('mood-form');
    if(moodForm) {
        moodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerText = "Encrypting & Submitting...";
            
            const mood_score = parseInt(document.getElementById('mood-score').value);
            const notes = document.getElementById('mood-notes').value;
            const symptoms = Array.from(document.querySelectorAll('#symptoms-container input:checked')).map(cb => cb.value);

            try {
                await fetch(`${API_BASE}/api/mood/log`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({ mood_score, symptoms, notes })
                });
                document.getElementById('mood-notes').value = '';
                document.querySelectorAll('#symptoms-container input:checked').forEach(cb => cb.checked = false);
                loadMoodHistory();
                btn.innerText = "Log Successfully Stored ✓";
                setTimeout(() => btn.innerText = "Submit Secure Log", 2000);
            } catch (error) { btn.innerText = "Submit Secure Log"; }
        });
    }

    const loadMoodHistory = async () => {
        const histContainer = document.getElementById('mood-history');
        if(!histContainer) return;
        try {
            const res = await fetch(`${API_BASE}/api/mood/history`, { headers: { 'Authorization': 'Bearer ' + token } });
            const data = await res.json();
            if(data.length === 0) return;
            histContainer.innerHTML = data.map(log => `
                <div class="p-4 border border-gray-100 rounded-2xl bg-white/80 shadow-sm mb-3">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2"><span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">${log.mood_score}</span><span class="font-bold text-[13px] text-gray-800 uppercase px-2">Score</span></div>
                        <span class="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">${new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
        } catch(e) {}
    };
    
    // ================= MEDICINE SYSTEM LOGIC =================
    const searchForm = document.getElementById('medicine-search-form');
    const searchInput = document.getElementById('medicine-search-input');
    const searchResult = document.getElementById('medicine-search-result');
    const searchLoading = document.getElementById('medicine-loading');

    if(searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if(!query) return;

            searchResult.classList.add('hidden');
            searchLoading.classList.remove('hidden');

            try {
                const res = await fetch(`${API_BASE}/api/medicine/search?q=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                searchLoading.classList.add('hidden');

                if (res.ok && data.name) {
                    let aiBadge = data.isAiGenerated ? `<span class="bg-brand-purple/20 text-brand-purple border border-brand-purple/30 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 w-max mb-4"><span class="material-symbols-outlined text-[14px]">auto_awesome</span> AI Verified</span>` : '';
                    
                    searchResult.innerHTML = `
                        <div class="glass-panel p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
                            <div class="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-blue/20 transition-colors"></div>
                            ${aiBadge}
                            <h2 class="text-3xl font-bold text-white mb-2 tracking-tight">${data.name}</h2>
                            <p class="text-brand-blue font-medium mb-6 text-sm tracking-wide">${data.purpose}</p>
                            
                            <div class="grid md:grid-cols-2 gap-6 mb-8">
                                <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">scale</span> Dosage Guide</h4>
                                    <p class="text-sm text-zinc-200 leading-relaxed">${data.dosage}</p>
                                </div>
                                <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">warning</span> Precautions</h4>
                                    <p class="text-sm text-zinc-200 leading-relaxed">${data.precautions}</p>
                                </div>
                            </div>
                            
                            <div class="mb-8">
                                <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Potential Side Effects</h4>
                                <div class="flex flex-wrap gap-2">
                                    ${data.sideEffects.map(se => `<span class="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm backdrop-blur-md">${se}</span>`).join('')}
                                </div>
                            </div>

                            <div class="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <p class="text-[10px] text-zinc-500 max-w-sm leading-relaxed uppercase tracking-widest font-bold">Disclaimer: This information is for educational purposes only. Consult a doctor before taking any medicine.</p>
                                <button onclick="openReminderModal('${data.name}')" class="btn-glow px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg w-full md:w-auto shrink-0 flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-[18px]">alarm_add</span> Set Reminder
                                </button>
                            </div>
                        </div>
                    `;
                    searchResult.classList.remove('hidden');
                } else {
                    searchResult.innerHTML = `<div class="glass-panel p-6 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-bold text-center">Medicine not found. Please check the spelling.</div>`;
                    searchResult.classList.remove('hidden');
                }

            } catch (err) {
                searchLoading.classList.add('hidden');
                searchResult.innerHTML = `<div class="glass-panel p-6 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-bold text-center">Connection error. Please try again.</div>`;
                searchResult.classList.remove('hidden');
            }
        });
    }

    // Modal Logic
    const reminderModal = document.getElementById('reminder-modal');
    const reminderModalContent = document.getElementById('reminder-modal-content');
    const reminderForm = document.getElementById('reminder-form');

    window.openReminderModal = (medicineName) => {
        document.getElementById('reminder-medicine-name').value = medicineName;
        document.getElementById('reminder-medicine-display').innerText = medicineName;
        
        // Default time to next hour
        const d = new Date();
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
        document.getElementById('reminder-time').value = d.toTimeString().substring(0, 5);
        
        reminderModal.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => reminderModalContent.classList.remove('scale-95'), 10);
    };

    window.closeReminderModal = () => {
        reminderModalContent.classList.add('scale-95');
        reminderModal.classList.add('opacity-0', 'pointer-events-none');
    };

    if (reminderForm) {
        reminderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = "Saving...";

            const payloadData = {
                medicineName: document.getElementById('reminder-medicine-name').value,
                time: document.getElementById('reminder-time').value,
                frequency: document.getElementById('reminder-frequency').value,
                notes: document.getElementById('reminder-notes').value
            };

            try {
                await fetch(`${API_BASE}/api/medicine/reminders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(payloadData)
                });
                
                btn.innerHTML = "Saved ✓";
                setTimeout(() => {
                    closeReminderModal();
                    fetchReminders();
                    btn.innerHTML = originalText;
                }, 1000);
            } catch (err) {
                btn.innerHTML = "Error!";
                setTimeout(() => btn.innerHTML = originalText, 2000);
            }
        });
    }

    window.fetchReminders = async () => {
        const listContainer = document.getElementById('reminders-list');
        if(!listContainer) return;

        try {
            const res = await fetch(`${API_BASE}/api/medicine/reminders`, { headers: { 'Authorization': 'Bearer ' + token } });
            const reminders = await res.json();

            if (reminders.length === 0) {
                listContainer.innerHTML = '<p class="text-zinc-500 text-sm text-center py-10 font-bold uppercase tracking-widest">No active reminders</p>';
                return;
            }

            listContainer.innerHTML = reminders.map(r => {
                const isTakenToday = r.history && r.history.some(h => new Date(h).toDateString() === new Date().toDateString());
                
                return `
                    <div class="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-brand-purple/30 transition-all">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h4 class="font-bold text-white text-lg tracking-tight flex items-center gap-2">${r.medicineName}</h4>
                                <p class="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-bold">${r.frequency} • ${r.time}</p>
                            </div>
                            <div class="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                                <span class="material-symbols-outlined text-[20px]">pill</span>
                            </div>
                        </div>
                        ${r.notes ? `<p class="text-sm text-zinc-300 bg-white/5 p-3 rounded-xl border border-white/5 italic mb-4 font-light">${r.notes}</p>` : '<div class="mb-4"></div>'}
                        
                        <button onclick="markAsTaken(${r.id}, this)" class="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${isTakenToday ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95'}" ${isTakenToday ? 'disabled' : ''}>
                            ${isTakenToday ? '✓ Taken Today' : 'Mark as Taken'}
                        </button>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error(e);
        }
    };

    window.markAsTaken = async (id, btnEl) => {
        btnEl.innerHTML = "Logging...";
        try {
            await fetch(`${API_BASE}/api/medicine/reminders/${id}/take`, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            fetchReminders();
        } catch (e) {
            btnEl.innerHTML = "Error";
        }
    };
    
    // Initial Chat Load
    async function init() {
        try {
            const res = await fetch(`${API_BASE}/api/chat/history`, { headers: { 'Authorization': 'Bearer ' + token } });
            const history = await res.json();
            if(history && history.length > 0 && chatContainer) {
                chatContainer.innerHTML = '';
                history.forEach(m => appendMessage(m.role, m.content, m.emotions));
            }
        } catch(e) {}
    }
    init();
});
