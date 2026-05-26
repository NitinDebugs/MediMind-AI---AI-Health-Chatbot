const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-Memory Data Stores for bypass mode
let medicinesStore = [];
let remindersStore = [];
let reminderIdCounter = 1;

// Pre-populate some medicines
medicinesStore.push({
    name: "Paracetamol",
    purpose: "Pain reliever and a fever reducer.",
    dosage: "Usually 500mg to 1000mg every 4 to 6 hours as needed.",
    sideEffects: ["Nausea", "Stomach pain", "Loss of appetite"],
    precautions: "Do not exceed the maximum daily dose. Avoid alcohol.",
    isAiGenerated: false
});

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const query = (req.query.q || '').trim().toLowerCase();
        if (!query) return res.status(400).json({ error: "Search query required" });

        // Search local store
        let found = medicinesStore.find(m => m.name.toLowerCase().includes(query));
        
        if (found) {
            return res.json(found);
        }

        // If not found, use AI
        const prompt = `
            You are a medical AI assistant. The user is searching for a medicine named "${query}".
            Provide basic, safe information about this medicine. 
            Respond ONLY in valid JSON format with the following structure:
            {
                "name": "Proper Name of Medicine",
                "purpose": "What is it used for?",
                "dosage": "General dosage guidance (append 'Consult doctor')",
                "sideEffects": ["effect 1", "effect 2"],
                "precautions": "Any major warnings"
            }
            Do not include markdown blocks like \`\`\`json. Just the raw JSON string.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        let jsonString = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        let aiMed = JSON.parse(jsonString);
        aiMed.isAiGenerated = true;
        
        // Cache it in store
        medicinesStore.push(aiMed);
        
        return res.json(aiMed);

    } catch (err) {
        console.error("Medicine search error:", err);
        res.status(500).json({ error: "Failed to search medicine. It might be invalid or our AI couldn't process it." });
    }
});

// Reminders CRUD
router.get('/reminders', authMiddleware, (req, res) => {
    const userId = req.user._id.toString();
    const userReminders = remindersStore.filter(r => r.userId === userId);
    res.json(userReminders);
});

router.post('/reminders', authMiddleware, (req, res) => {
    const userId = req.user._id.toString();
    const { medicineName, time, frequency, notes } = req.body;
    
    if(!medicineName || !time || !frequency) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const newReminder = {
        id: reminderIdCounter++,
        userId,
        medicineName,
        time,
        frequency,
        notes: notes || "",
        history: [], // array of timestamps when taken
        createdAt: new Date()
    };

    remindersStore.push(newReminder);
    res.json(newReminder);
});

router.put('/reminders/:id/take', authMiddleware, (req, res) => {
    const userId = req.user._id.toString();
    const reminderId = parseInt(req.params.id);

    let reminder = remindersStore.find(r => r.id === reminderId && r.userId === userId);
    if(!reminder) return res.status(404).json({ error: "Reminder not found" });

    reminder.history.push(new Date());
    res.json(reminder);
});

module.exports = router;
