/**
 * Transcript Controller
 * 
 * REST API endpoints for transcripts, notes, AI Q&A, search, export, and translation.
 */
const { TranscriptChunk, FullTranscript } = require('../models/Transcript');
const Class = require('../models/Class');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateSmartNotes, askAI, translateText } = require('../services/aiService');

/**
 * @desc    Get all transcript chunks for a room
 * @route   GET /api/transcripts/:roomId/chunks
 * @access  Private
 */
const getTranscriptChunks = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
    .sort({ timestamp: 1 })
    .lean();

  res.status(200).json({ success: true, count: chunks.length, chunks });
});

/**
 * @desc    Get the full merged transcript for a room
 * @route   GET /api/transcripts/:roomId/full
 * @access  Private
 */
const getFullTranscript = asyncHandler(async (req, res) => {
  let fullTranscript = await FullTranscript.findOne({ roomId: req.params.roomId });

  if (!fullTranscript) {
    // Build it on the fly from chunks
    const chunks = await TranscriptChunk.find({ roomId: req.params.roomId, isFinal: true })
      .sort({ timestamp: 1 })
      .lean();

    if (chunks.length === 0) {
      return res.status(404).json({ success: false, message: 'No transcript found for this room' });
    }

    const fullText = chunks.map((c) => c.text).join(' ');
    const classItem = await Class.findOne({ sessionId: req.params.roomId });

    fullTranscript = await FullTranscript.create({
      roomId: req.params.roomId,
      classId: classItem?._id,
      fullText,
      chunkCount: chunks.length,
      duration: chunks[chunks.length - 1]?.timestamp || 0,
    });
  }

  res.status(200).json({ success: true, transcript: fullTranscript });
});

/**
 * @desc    Build/merge full transcript from chunks (called when session ends)
 * @route   POST /api/transcripts/:roomId/build
 * @access  Private
 */
const buildFullTranscript = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
    .sort({ timestamp: 1 })
    .lean();

  if (chunks.length === 0) {
    return res.status(404).json({ success: false, message: 'No transcript chunks found' });
  }

  const fullText = chunks.map((c) => c.text).join(' ');
  const classItem = await Class.findOne({ sessionId: roomId });

  const fullTranscript = await FullTranscript.findOneAndUpdate(
    { roomId },
    {
      roomId,
      classId: classItem?._id,
      fullText,
      chunkCount: chunks.length,
      duration: chunks[chunks.length - 1]?.timestamp || 0,
    },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, transcript: fullTranscript });
});

/**
 * @desc    Generate AI smart notes from transcript
 * @route   POST /api/transcripts/:roomId/notes
 * @access  Private
 */
const generateNotes = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  let fullTranscript = await FullTranscript.findOne({ roomId });

  if (!fullTranscript || !fullTranscript.fullText) {
    // Try to build first
    const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
      .sort({ timestamp: 1 })
      .lean();

    if (chunks.length === 0) {
      return res.status(404).json({ success: false, message: 'No transcript found to generate notes from' });
    }

    const fullText = chunks.map((c) => c.text).join(' ');
    const classItem = await Class.findOne({ sessionId: roomId });

    fullTranscript = await FullTranscript.findOneAndUpdate(
      { roomId },
      {
        roomId,
        classId: classItem?._id,
        fullText,
        chunkCount: chunks.length,
        duration: chunks[chunks.length - 1]?.timestamp || 0,
      },
      { upsert: true, new: true }
    );
  }

  const classItem = await Class.findOne({ sessionId: roomId });
  const classTitle = classItem?.title || 'Lecture';

  const notes = await generateSmartNotes(fullTranscript.fullText, classTitle);

  fullTranscript.aiNotes = notes;
  fullTranscript.isProcessed = true;
  await fullTranscript.save();

  res.status(200).json({ success: true, notes, transcript: fullTranscript });
});

/**
 * @desc    Get AI notes for a room (already generated)
 * @route   GET /api/transcripts/:roomId/notes
 * @access  Private
 */
const getNotes = asyncHandler(async (req, res) => {
  const fullTranscript = await FullTranscript.findOne({ roomId: req.params.roomId });

  if (!fullTranscript) {
    return res.status(404).json({ success: false, message: 'No transcript found' });
  }

  res.status(200).json({
    success: true,
    notes: fullTranscript.aiNotes,
    isProcessed: fullTranscript.isProcessed,
  });
});

/**
 * @desc    Ask AI a question about the lecture
 * @route   POST /api/transcripts/:roomId/ask
 * @access  Private
 */
const askAIQuestion = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ success: false, message: 'Question is required' });
  }

  const fullTranscript = await FullTranscript.findOne({ roomId });

  if (!fullTranscript || !fullTranscript.fullText) {
    return res.status(404).json({ success: false, message: 'No transcript available for Q&A' });
  }

  const history = fullTranscript.aiQAHistory || [];
  const answer = await askAI(fullTranscript.fullText, question, history);

  // Save to history
  fullTranscript.aiQAHistory.push({ question, answer });
  await fullTranscript.save();

  res.status(200).json({ success: true, question, answer });
});

/**
 * @desc    Search within transcript
 * @route   GET /api/transcripts/:roomId/search?q=keyword
 * @access  Private
 */
const searchTranscript = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Search query is required' });
  }

  const chunks = await TranscriptChunk.find({
    roomId,
    isFinal: true,
    text: { $regex: q, $options: 'i' },
  })
    .sort({ timestamp: 1 })
    .lean();

  res.status(200).json({
    success: true,
    query: q,
    count: chunks.length,
    results: chunks,
  });
});

/**
 * @desc    Translate transcript or notes
 * @route   POST /api/transcripts/:roomId/translate
 * @access  Private
 */
const translateTranscript = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { targetLanguage, type } = req.body; // type: 'transcript' | 'notes'

  if (!targetLanguage) {
    return res.status(400).json({ success: false, message: 'Target language is required' });
  }

  const fullTranscript = await FullTranscript.findOne({ roomId });
  if (!fullTranscript) {
    return res.status(404).json({ success: false, message: 'No transcript found' });
  }

  let textToTranslate = '';
  if (type === 'notes' && fullTranscript.aiNotes?.structuredNotes) {
    textToTranslate = fullTranscript.aiNotes.structuredNotes;
  } else {
    // Translate transcript (truncated for API limit)
    textToTranslate = fullTranscript.fullText.substring(0, 5000);
  }

  const translated = await translateText(textToTranslate, targetLanguage);

  res.status(200).json({
    success: true,
    originalLanguage: fullTranscript.language || 'en-US',
    targetLanguage,
    translatedText: translated,
  });
});

/**
 * @desc    Export transcript as markdown
 * @route   GET /api/transcripts/:roomId/export/markdown
 * @access  Private
 */
const exportMarkdown = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const fullTranscript = await FullTranscript.findOne({ roomId });
  const classItem = await Class.findOne({ sessionId: roomId });

  if (!fullTranscript) {
    return res.status(404).json({ success: false, message: 'No transcript found' });
  }

  const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
    .sort({ timestamp: 1 })
    .lean();

  let md = `# ${classItem?.title || 'Lecture'} - Transcript\n\n`;
  md += `**Date:** ${fullTranscript.createdAt?.toLocaleDateString() || 'N/A'}\n`;
  md += `**Room:** ${roomId}\n`;
  md += `**Duration:** ${formatDuration(fullTranscript.duration)}\n\n`;
  md += `---\n\n`;
  md += `## Transcript\n\n`;

  for (const chunk of chunks) {
    md += `**[${formatTimestamp(chunk.timestamp)}]** ${chunk.text}\n\n`;
  }

  if (fullTranscript.aiNotes?.structuredNotes) {
    md += `---\n\n## AI Generated Notes\n\n`;
    md += fullTranscript.aiNotes.structuredNotes + '\n\n';

    if (fullTranscript.aiNotes.keyConcepts?.length) {
      md += `### Key Concepts\n\n`;
      for (const concept of fullTranscript.aiNotes.keyConcepts) {
        md += `- ${concept}\n`;
      }
      md += '\n';
    }

    if (fullTranscript.aiNotes.examHighlights?.length) {
      md += `### Exam Highlights\n\n`;
      for (const highlight of fullTranscript.aiNotes.examHighlights) {
        md += `- ⭐ ${highlight}\n`;
      }
      md += '\n';
    }
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${roomId}-transcript.md"`);
  res.status(200).send(md);
});

/**
 * @desc    Export notes data for PDF generation (client-side)
 * @route   GET /api/transcripts/:roomId/export/pdf-data
 * @access  Private
 */
const exportPDFData = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const fullTranscript = await FullTranscript.findOne({ roomId });
  const classItem = await Class.findOne({ sessionId: roomId });

  if (!fullTranscript) {
    return res.status(404).json({ success: false, message: 'No transcript found' });
  }

  const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
    .sort({ timestamp: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      title: classItem?.title || 'Lecture',
      roomId,
      date: fullTranscript.createdAt,
      duration: formatDuration(fullTranscript.duration),
      fullText: fullTranscript.fullText,
      chunks: chunks.map((c) => ({
        text: c.text,
        timestamp: c.timestamp,
        formattedTime: formatTimestamp(c.timestamp),
      })),
      notes: fullTranscript.aiNotes,
    },
  });
});

// Helpers
function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  getTranscriptChunks,
  getFullTranscript,
  buildFullTranscript,
  generateNotes,
  getNotes,
  askAIQuestion,
  searchTranscript,
  translateTranscript,
  exportMarkdown,
  exportPDFData,
};
