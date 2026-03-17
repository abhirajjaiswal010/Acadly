const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * Class Schema
 * Represents a virtual classroom session
 */
const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Class title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    students: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sessionId: {
      type: String,
      unique: true,
      default: () => uuidv4().substring(0, 8).toUpperCase(), // Short, memorable code
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    maxStudents: {
      type: Number,
      default: 50,
    },
    scheduledAt: {
      type: Date,
    },
    tags: [String],
    // Session join/leave history
    sessionHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: String,
        userRole: String,
        action: {
          type: String,
          enum: ['joined', 'left'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup
classSchema.index({ teacher: 1 });
classSchema.index({ isActive: 1, isLive: 1 });

module.exports = mongoose.model('Class', classSchema);
