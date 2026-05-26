const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
        {
            role: { type: String, enum: ['system', 'user', 'ai'], required: true },
            content: { type: String, required: true },
            emotion_tags: [{ type: String }],
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Chat', chatSchema);
