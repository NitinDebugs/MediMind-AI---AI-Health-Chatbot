const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'AIzaSy_placeholder_key_to_prevent_startup_crash' });

const SYSTEM_PROMPT = `
You are MediMind AI, a supportive healthcare assistant for students. 
You provide emotional support and basic health guidance. 
You are empathetic, calm, and NEVER give dangerous medical advice. If discussing medical symptoms, append: "*This is not a substitute for professional medical advice.*"
You MUST respond IN JSON FORMAT ONLY with exactly two keys: "reply" (your message) and "emotions_detected" (a javascript array of strings detailing the emotions you detect from the user's message, e.g., ["stress", "anxiety", "neutral"]).
`;

const memoryStore = {};

router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;
        
        if (!memoryStore[userId]) {
            memoryStore[userId] = [{ role: 'system', content: SYSTEM_PROMPT }];
        }
        let chat = memoryStore[userId];

        chat.push({ role: 'user', content: message, timestamp: new Date() });
        
        // Build prompt
        let promptContext = "";
        chat.forEach(msg => {
            if(msg.role === 'system') promptContext += msg.content + "\n\n";
            else if(msg.role === 'user') promptContext += "User: " + msg.content + "\n";
            else if(msg.role === 'ai') promptContext += "AI: " + (msg.parsedReply ? msg.parsedReply : msg.content) + "\n";
        });
        promptContext += "AI Response in JSON format:";

        let aiResponseText = '';
        let parsedData = { reply: "I'm having trouble forming a thought, give me a moment.", emotions_detected: [] };
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptContext
            });
            aiResponseText = response.text;
            
            // Extract JSON from output if wrapped in markdown
            let jsonString = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(jsonString);
        } catch(apiErr) {
            console.error('Gemini API Error:', apiErr);
            parsedData.reply = "I'm having a little trouble connecting to my core processor. Let's take a deep breath and try again.";
        }

        chat.push({ 
            role: 'ai', 
            content: JSON.stringify(parsedData), 
            parsedReply: parsedData.reply,
            emotions: parsedData.emotions_detected,
            timestamp: new Date() 
        });

        res.json({ reply: parsedData.reply, emotions: parsedData.emotions_detected });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    const userId = req.user._id;
    if(!memoryStore[userId]) return res.json([]);
    const history = memoryStore[userId]
        .filter(m => m.role !== 'system')
        .map(m => {
            if (m.role === 'ai' && m.parsedReply) {
                return { role: 'ai', content: m.parsedReply, emotions: m.emotions, timestamp: m.timestamp };
            }
            return m;
        });
    res.json(history);
});

router.delete('/clear', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const initialAiResponse = {
            reply: "Hello! Our previous session has been wiped. How are you feeling right now? I'm here to listen.",
            emotions_detected: ["calm", "neutral"]
        };
        memoryStore[userId] = [
            { role: 'system', content: SYSTEM_PROMPT },
            { 
                 role: 'ai', 
                 content: JSON.stringify(initialAiResponse),
                 parsedReply: initialAiResponse.reply,
                 emotions: initialAiResponse.emotions_detected,
                 timestamp: new Date()
            }
        ];
        res.json(initialAiResponse);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
