const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood_score: { type: Number, required: true, min: 1, max: 10 },
    symptoms: [{ type: String }],
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MoodLog', moodLogSchema);
