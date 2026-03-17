const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/transcriptController');

// All routes require authentication
router.use(protect);

// Transcript chunks
router.get('/:roomId/chunks', getTranscriptChunks);

// Full transcript
router.get('/:roomId/full', getFullTranscript);
router.post('/:roomId/build', buildFullTranscript);

// AI Notes
router.get('/:roomId/notes', getNotes);
router.post('/:roomId/notes', generateNotes);

// AI Q&A
router.post('/:roomId/ask', askAIQuestion);

// Search
router.get('/:roomId/search', searchTranscript);

// Translation
router.post('/:roomId/translate', translateTranscript);

// Export
router.get('/:roomId/export/markdown', exportMarkdown);
router.get('/:roomId/export/pdf-data', exportPDFData);

module.exports = router;
