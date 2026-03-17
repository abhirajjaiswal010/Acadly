const mongoose = require('mongoose');

/**
 * TranscriptChunk Schema
 * Stores individual transcript chunks from live speech-to-text
 */
const transcriptChunkSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number, // milliseconds from session start
      required: true,
    },
    isFinal: {
      type: Boolean,
      default: true,
    },
    speaker: {
      type: String,
      default: 'Teacher',
    },
    language: {
      type: String,
      default: 'en-US',
    },
  },
  {
    timestamps: true,
  }
);

transcriptChunkSchema.index({ roomId: 1, timestamp: 1 });
transcriptChunkSchema.index({ roomId: 1, text: 'text' }); // text index for search

const TranscriptChunk = mongoose.model('TranscriptChunk', transcriptChunkSchema);

/**
 * FullTranscript Schema
 * Stores the merged full transcript + AI notes after session ends
 */
const fullTranscriptSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    fullText: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // session duration in ms
      default: 0,
    },
    language: {
      type: String,
      default: 'en-US',
    },
    aiNotes: {
      summary: { type: String, default: '' },
      bulletPoints: [String],
      keyConcepts: [String],
      examHighlights: [String],
      structuredNotes: { type: String, default: '' },
    },
    aiQAHistory: [
      {
        question: String,
        answer: String,
        askedAt: { type: Date, default: Date.now },
      },
    ],
    isProcessed: {
      type: Boolean,
      default: false,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

fullTranscriptSchema.index({ classId: 1 });

const FullTranscript = mongoose.model('FullTranscript', fullTranscriptSchema);

module.exports = { TranscriptChunk, FullTranscript };
