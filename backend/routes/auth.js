const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// In-Memory Users Store { email: { id, username, email, password } }
const memoryUsers = {}; 

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if(memoryUsers[email]) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const userId = 'usr_' + Date.now() + Math.floor(Math.random()*1000);
        memoryUsers[email] = { id: userId, username, email, password };
        res.status(201).json({ message: 'User registered successfully' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = memoryUsers[email];
        if(!user || user.password !== password) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        const token = jwt.sign({ _id: user.id, username: user.username }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
        res.json({ token, username: user.username, email: user.email });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
