const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  voters: [{
    userId: { type: String, required: true },
    optionIndex: { type: Number, required: true }
  }],
  active: {
    type: Boolean,
    default: true,
  },
  duration: {
    type: Number, // in seconds
    default: 30,
  },
  expiresAt: {
    type: Date,
  },
  anonymous: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Poll', pollSchema);
