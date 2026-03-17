/**
 * Transcript Socket Handler
 * 
 * Handles real-time transcript broadcasting from the client's Web Speech API
 * and stores final transcripts in MongoDB.
 */
const { TranscriptChunk, FullTranscript } = require('../models/Transcript');
const Class = require('../models/Class');

// Track active transcription sessions: roomId -> { startTime, chunkCount, language, teacherSocketId }
const transcriptionSessions = new Map();

/**
 * Initialize transcript socket events on an existing io instance.
 * Call this inside your main socket connection handler.
 * 
 * @param {Socket} socket - The connected socket instance
 * @param {Server} io - The Socket.IO server instance
 */
function initTranscriptSocket(socket, io) {
  // ─────────────────────────────────────────
  // START TRANSCRIPTION (Teacher only)
  // ─────────────────────────────────────────
  socket.on('start-transcription', async ({ roomId, language }) => {
    console.log(`[Transcript] Received start-transcription for room ${roomId} from ${socket.userName} (${socket.userRole})`);
    try {
      // Temporarily bypass teacher check
      /*
      if (socket.userRole !== 'teacher') {
        console.warn(`[Transcript] Unauthorized start-transcription attempt by ${socket.userName} (${socket.userRole})`);
        socket.emit('transcript-error', { message: 'Only teachers can start transcription' });
        return;
      }
      */

      const langCode = language || 'en-IN';

      // Don't start if already active
      if (transcriptionSessions.has(roomId)) {
        socket.emit('transcript-status', { status: 'already-active', roomId });
        return;
      }

      const sessionStartTime = Date.now();
      transcriptionSessions.set(roomId, {
        startTime: sessionStartTime,
        chunkCount: 0,
        language: langCode,
        teacherSocketId: socket.id,
      });

      // Notify room
      io.to(roomId).emit('transcript-status', {
        status: 'started',
        roomId,
        language: langCode,
        teacher: socket.userName,
      });

      console.log(`🎤 Transcription started for room ${roomId} by ${socket.userName} (${langCode})`);
    } catch (err) {
      console.error('[Transcript] Start error:', err);
      socket.emit('transcript-error', { message: 'Failed to start transcription' });
    }
  });

  // ─────────────────────────────────────────
  // LIVE TRANSCRIPT BROADCAST (From Teacher's Web Speech API)
  // ─────────────────────────────────────────
  socket.on('live-transcript-broadcast', async ({ roomId, transcript, isFinal, timestamp, speaker }) => {
    if (!roomId || !transcript) return;

    const session = transcriptionSessions.get(roomId);
    if (!session) return;

    try {
      // Broadcast to all in room
      io.to(roomId).emit('live-transcript', {
        transcript,
        isFinal,
        timestamp,
        speaker,
      });

      // Store only FINAL transcripts in MongoDB
      if (isFinal && transcript.trim().length > 0) {
        await TranscriptChunk.create({
          roomId,
          text: transcript.trim(),
          timestamp,
          isFinal: true,
          speaker,
          language: session.language,
        });

        session.chunkCount++;
      }
    } catch (err) {
      console.error('[Transcript] DB save error:', err.message);
    }
  });

  // ─────────────────────────────────────────
  // AUDIO CHUNK (Deprecated - now handled via live-transcript-broadcast)
  // ─────────────────────────────────────────
  socket.on('audio-chunk', () => {});

  // ─────────────────────────────────────────
  // STOP TRANSCRIPTION
  // ─────────────────────────────────────────
  socket.on('stop-transcription', async ({ roomId }) => {
    await handleStopTranscription(roomId, socket, io);
  });

  // ─────────────────────────────────────────
  // GET TRANSCRIPTION STATUS
  // ─────────────────────────────────────────
  socket.on('get-transcript-status', ({ roomId }) => {
    const session = transcriptionSessions.get(roomId);
    const active = transcriptionSessions.has(roomId);

    socket.emit('transcript-status', {
      status: active ? 'active' : 'inactive',
      roomId,
      language: session?.language || 'en-IN',
      chunkCount: session?.chunkCount || 0,
      startTime: session?.startTime || null,
    });
  });

  // ─────────────────────────────────────────
  // CHANGE TRANSCRIPTION LANGUAGE
  // ─────────────────────────────────────────
  socket.on('change-transcript-language', async ({ roomId, language }) => {
    if (socket.userRole !== 'teacher') return;

    const session = transcriptionSessions.get(roomId);
    if (!session) return;

    session.language = language;
    transcriptionSessions.set(roomId, session);

    // Brief delay before restarting
    setTimeout(() => {
      socket.emit('transcript-status', { status: 'language-changed', language, roomId });
    }, 500);
  });

  // ─────────────────────────────────────────
  // HANDLE DISCONNECT - cleanup transcription
  // ─────────────────────────────────────────
  socket.on('disconnect', async () => {
    // If this was the teacher running transcription, stop it
    for (const [roomId, session] of transcriptionSessions.entries()) {
      if (session.teacherSocketId === socket.id) {
        await handleStopTranscription(roomId, socket, io);
      }
    }
  });
}

/**
 * Stop transcription and build the full transcript.
 */
async function handleStopTranscription(roomId, socket, io) {
  if (!roomId) return;

  try {
    const session = transcriptionSessions.get(roomId);
    if (session) {
      const duration = Date.now() - session.startTime;

      // Build full transcript
      const chunks = await TranscriptChunk.find({ roomId, isFinal: true })
        .sort({ timestamp: 1 })
        .lean();

      if (chunks.length > 0) {
        const fullText = chunks.map((c) => c.text).join(' ');
        const classItem = await Class.findOne({ sessionId: roomId });

        await FullTranscript.findOneAndUpdate(
          { roomId },
          {
            roomId,
            classId: classItem?._id,
            fullText,
            duration,
            chunkCount: chunks.length,
            language: session.language,
          },
          { upsert: true, new: true }
        );

        console.log(`📝 Full transcript saved for room ${roomId} (${chunks.length} chunks, ${Math.round(duration / 1000)}s)`);
      }

      transcriptionSessions.delete(roomId);
    }

    io.to(roomId).emit('transcript-status', {
      status: 'stopped',
      roomId,
    });

    console.log(`🛑 Transcription stopped for room ${roomId}`);
  } catch (err) {
    console.error('[Transcript] Stop error:', err);
  }
}

module.exports = initTranscriptSocket;
