const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const memoryMoods = {};

// Log current mood
router.post('/log', authMiddleware, async (req, res) => {
    try {
        const { mood_score, symptoms, notes } = req.body;
        const userId = req.user._id;
        
        if(!memoryMoods[userId]) memoryMoods[userId] = [];
        
        const moodLog = {
            id: 'mood_' + Date.now(),
            userId,
            mood_score,
            symptoms,
            notes,
            timestamp: new Date()
        };
        
        memoryMoods[userId].push(moodLog);
        res.status(201).json({ message: 'Mood logged successfully', log: moodLog });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's mood history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const history = memoryMoods[userId] ? [...memoryMoods[userId]].reverse() : [];
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
