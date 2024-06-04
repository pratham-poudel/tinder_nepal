const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    time: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Chat', chatSchema);