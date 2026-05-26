const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection BYPASSED FOR LOCAL TESTING
// mongoose.connect(process.env.MONGO_URI).then(() => {
//     console.log('✅ MongoDB connected to MediMind database');
// }).catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
// });
console.log('⚡ Running in In-Memory Bypass Mode (No MongoDB required)');

// Import Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const moodRoutes = require('./routes/mood');
const medicineRoutes = require('./routes/medicine');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/medicine', medicineRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../')));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
