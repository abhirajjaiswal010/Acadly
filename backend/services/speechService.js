/**
 * Google Cloud Speech-to-Text Streaming Service
 * 
 * Handles real-time audio transcription with automatic stream restart
 * (Google limits streams to ~5 minutes).
 */
const speech = require('@google-cloud/speech');

// Map: roomId -> { recognizeStream, restartTimer, startTime }
const activeStreams = new Map();

// Google STT streaming limit (~4.5 min to restart before 5 min cutoff)
const STREAMING_LIMIT = 270000; // 4.5 minutes in ms

/**
 * Creates a new Speech client.
 * Uses GOOGLE_APPLICATION_CREDENTIALS env var or explicit keyFilename.
 */
function createSpeechClient() {
  const options = {};
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Auto-detected from env
  } else if (process.env.GOOGLE_CLOUD_KEY_FILE) {
    options.keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE;
  } else if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    options.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  }

  return new speech.SpeechClient(options);
}

let client = null;

function getClient() {
  if (!client) {
    client = createSpeechClient();
  }
  return client;
}

/**
 * Start a streaming recognition session for a room.
 * @param {string} roomId 
 * @param {function} onTranscript - callback({ transcript, isFinal, timestamp })
 * @param {object} options - { languageCode, sampleRateHertz }
 */
function startStream(roomId, onTranscript, options = {}) {
  // Clean up existing stream for this room
  stopStream(roomId);

  const languageCode = options.languageCode || 'en-US';
  const sampleRateHertz = options.sampleRateHertz || 16000;

  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true,
      // Enable word-level timestamps
      enableWordTimeOffsets: true,
      // Multiple alternatives for better accuracy
      maxAlternatives: 1,
    },
    interimResults: true,
  };

  const speechClient = getClient();
  const startTime = Date.now();

  const recognizeStream = speechClient
    .streamingRecognize(request)
    .on('error', (err) => {
      console.error(`[Speech] Stream error for room ${roomId}:`, err.message);
      // Auto-restart on non-fatal errors
      if (err.code === 11 || err.message.includes('exceeded')) {
        console.log(`[Speech] Restarting stream for room ${roomId}...`);
        setTimeout(() => {
          if (activeStreams.has(roomId)) {
            startStream(roomId, onTranscript, options);
          }
        }, 1000);
      }
    })
    .on('data', (data) => {
      if (data.results[0] && data.results[0].alternatives[0]) {
        const result = data.results[0];
        const transcript = result.alternatives[0].transcript;
        const isFinal = result.isFinal;
        const confidence = result.alternatives[0].confidence || 0;
        const timestamp = Date.now() - startTime;

        onTranscript({
          transcript,
          isFinal,
          confidence,
          timestamp,
          languageCode,
        });
      }
    });

  // Auto-restart before Google's 5 min limit
  const restartTimer = setTimeout(() => {
    console.log(`[Speech] Auto-restarting stream for room ${roomId} (${STREAMING_LIMIT}ms limit)`);
    startStream(roomId, onTranscript, options);
  }, STREAMING_LIMIT);

  activeStreams.set(roomId, {
    recognizeStream,
    restartTimer,
    startTime,
    onTranscript,
    options,
  });

  console.log(`[Speech] Started stream for room: ${roomId} (lang: ${languageCode})`);
  return recognizeStream;
}

/**
 * Write an audio chunk to the active stream for a room.
 * @param {string} roomId 
 * @param {Buffer} audioChunk - raw PCM audio data
 */
function writeAudioChunk(roomId, audioChunk) {
  const streamData = activeStreams.get(roomId);
  if (streamData && streamData.recognizeStream && !streamData.recognizeStream.destroyed) {
    try {
      streamData.recognizeStream.write(audioChunk);
    } catch (err) {
      console.error(`[Speech] Error writing chunk for room ${roomId}:`, err.message);
    }
  }
}

/**
 * Stop the streaming recognition for a room.
 * @param {string} roomId 
 */
function stopStream(roomId) {
  const streamData = activeStreams.get(roomId);
  if (streamData) {
    if (streamData.restartTimer) {
      clearTimeout(streamData.restartTimer);
    }
    if (streamData.recognizeStream && !streamData.recognizeStream.destroyed) {
      try {
        streamData.recognizeStream.end();
      } catch (e) {
        // Stream already ended
      }
    }
    activeStreams.delete(roomId);
    console.log(`[Speech] Stopped stream for room: ${roomId}`);
  }
}

/**
 * Check if a stream is active for a room.
 */
function isStreamActive(roomId) {
  return activeStreams.has(roomId);
}

module.exports = {
  startStream,
  writeAudioChunk,
  stopStream,
  isStreamActive,
};
