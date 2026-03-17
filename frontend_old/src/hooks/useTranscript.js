import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';

/**
 * Hook to handle real-time transcription and live captions via Web Speech API
 */
const useTranscript = (roomId, userRole, isAudioEnabled) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState({ text: '', isFinal: false });
  const [transcriptChunks, setTranscriptChunks] = useState([]);
  const [language, setLanguage] = useState('en-IN');
  
  const recognitionRef = useRef(null);
  const isTranscribingRef = useRef(false);
  const socket = getSocket();

  // 1. Listen for live transcript events (crucial for students)
  useEffect(() => {
    if (!socket) return;

    const handleLiveTranscript = (data) => {
      const { transcript, isFinal, timestamp, speaker } = data;
      setLiveCaptions({ text: transcript, isFinal });

      if (isFinal) {
        setTranscriptChunks((prev) => {
          // Prevent duplicates if emitting locally and receiving back
          const isDuplicate = prev.some(c => c.timestamp === timestamp && c.text === transcript);
          if (isDuplicate) return prev;
          return [...prev, { text: transcript, timestamp, speaker }];
        });
        
        // Clear live caption after a short delay
        setTimeout(() => {
          setLiveCaptions((prev) => prev.isFinal ? { text: '', isFinal: false } : prev);
        }, 3000);
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.status === 'started') {
        setIsTranscribing(true);
        isTranscribingRef.current = true;
        if (data.language) setLanguage(data.language);
        if (userRole !== 'teacher') toast.success(`Live transcription started by ${data.teacher}`);
      } else if (data.status === 'stopped') {
        setIsTranscribing(false);
        isTranscribingRef.current = false;
        if (userRole !== 'teacher') toast.success('Live transcription stopped');
      }
    };

    socket.on('live-transcript', handleLiveTranscript);
    socket.on('transcript-status', handleStatusUpdate);

    // Initial status check
    socket.emit('get-transcript-status', { roomId });

    return () => {
      socket.off('live-transcript', handleLiveTranscript);
      socket.off('transcript-status', handleStatusUpdate);
    };
  }, [socket, roomId, userRole]);

  // 2. Capture and process audio using Web Speech API
  const startAudioCapture = useCallback(() => {
    if (!socket) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Browser does not support Speech Recognition. Use Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsTranscribing(true);
      isTranscribingRef.current = true;
      socket.emit('start-transcription', { roomId, language });
      toast.success('Live Captions ON', { id: 'captions-status' });
    };

    recognition.onresult = (event) => {
      if (!isAudioEnabled) return; // Muted

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      const isFinal = !!finalTranscript;

      if (text.trim() === '') return;

      const payload = {
        roomId,
        transcript: text,
        isFinal,
        timestamp: Date.now(),
        speaker: socket.userName || 'Teacher',
      };

      // Broadcast to everyone via socket
      socket.emit('live-transcript-broadcast', payload); // Use a specific event
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied for transcription.');
        stopAudioCapture();
      }
    };

    recognition.onend = () => {
      // Auto-restart if it stops unexpectedly (e.g. after a period of silence)
      if (isTranscribingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start recognition:', e);
      toast.error('Could not start microphone for captions.');
    }
  }, [userRole, socket, roomId, language, isAudioEnabled]);

  const stopAudioCapture = useCallback(() => {
    setIsTranscribing(false);
    isTranscribingRef.current = false;
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }

    if (socket) {
      socket.emit('stop-transcription', { roomId });
    }
    toast('Live Captions OFF', { icon: '🛑', id: 'captions-status' });
  }, [socket, roomId]);

  const toggleTranscription = () => {
    if (isTranscribingRef.current) {
      stopAudioCapture();
    } else {
      startAudioCapture();
    }
  };

  return {
    isTranscribing,
    liveCaptions,
    transcriptChunks,
    language,
    setLanguage,
    toggleTranscription,
  };
};

export default useTranscript;
