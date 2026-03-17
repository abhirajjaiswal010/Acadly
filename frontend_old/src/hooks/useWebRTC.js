import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '../utils/socket';

/**
 * ICE server configuration (STUN/TURN)
 * Using free Google STUN servers for development
 * For production, add TURN server credentials
 */
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

/**
 * useWebRTC - Core WebRTC hook managing:
 * - Local media streams (camera/mic/screen)
 * - Peer connections management
 * - Signaling via Socket.io (offer/answer/ICE)
 * - Remote stream tracking per participant
 *
 * @param {string} roomId - Session/room ID
 * @param {string} userRole - 'teacher' | 'student'
 */
const useWebRTC = (roomId, userRole) => {
  const socket = getSocket();

  // Local streams
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Remote peers: Map<socketId, { stream, userName, userRole, userAvatar, isAudioEnabled, isVideoEnabled, isScreenSharing }>
  const [peers, setPeers] = useState(new Map());
  const [participants, setParticipants] = useState([]);
  const [pendingCalls, setPendingCalls] = useState([]); // Pupils to call once media is ready

  // Refs (avoid stale closure issues in event listeners)
  const peerConnections = useRef(new Map()); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef(new Map()); // socketId -> ICECandidate[]

  // ──────────────────────────────────────────────────────────────
  // Initialize local media
  // ──────────────────────────────────────────────────────────────
  const initLocalMedia = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 } : false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);
      setIsCameraReady(true);

      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      // Try audio-only fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsVideoEnabled(false);
        setIsAudioEnabled(true);
        setIsCameraReady(true);
        return audioStream;
      } catch (audioErr) {
        console.error('Failed to get audio:', audioErr);
        setIsCameraReady(false);
        return null;
      }
    }
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Create a new RTCPeerConnection for a remote socket
  // ──────────────────────────────────────────────────────────────
  const createPeerConnection = useCallback(
    (targetSocketId, userName, userRole, userAvatar) => {
      if (peerConnections.current.has(targetSocketId)) {
        return peerConnections.current.get(targetSocketId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to the peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`ICE state [${targetSocketId}]: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce();
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setPeers((prev) => {
          const next = new Map(prev);
          const existing = next.get(targetSocketId) || {};
          next.set(targetSocketId, {
            ...existing,
            stream: remoteStream,
            userName,
            userRole,
            userAvatar,
            socketId: targetSocketId,
          });
          return next;
        });
      };

      peerConnections.current.set(targetSocketId, pc);
      return pc;
    },
    [socket]
  );

  // ──────────────────────────────────────────────────────────────
  // Initiate call to a remote socket (create offer)
  // ──────────────────────────────────────────────────────────────
  const callPeer = useCallback(
    async (targetSocketId, userName, userRole, userAvatar) => {
      if (!socket) return;

      const pc = createPeerConnection(targetSocketId, userName, userRole, userAvatar);

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          targetSocketId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    },
    [socket, createPeerConnection]
  );

  // ──────────────────────────────────────────────────────────────
  // Close a peer connection
  // ──────────────────────────────────────────────────────────────
  const closePeerConnection = useCallback((socketId) => {
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
    pendingCandidates.current.delete(socketId);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Socket.io Event Handlers
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    // ── Receive existing participants when joining ──
    const onRoomParticipants = ({ participants: existingOnes }) => {
      setParticipants(existingOnes);
      // Queue these peers to be called once local media is ready
      setPendingCalls(existingOnes);
    };

    // ── New user joined → call them ──
    const onUserJoined = async ({ socketId, userName, userRole, userAvatar }) => {
      setParticipants((prev) => [
        ...prev.filter((p) => p.socketId !== socketId),
        { socketId, userName, userRole, userAvatar },
      ]);
    };

    // ── Receive offer → create answer ──
    const onWebRTCOffer = async ({ sdp, fromSocketId, fromUserName, fromUserRole }) => {
      const pc = createPeerConnection(fromSocketId, fromUserName, fromUserRole, '');
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Apply any pending candidates
        const pending = pendingCandidates.current.get(fromSocketId) || [];
        for (const candidate of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current.delete(fromSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          targetSocketId: fromSocketId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    // ── Receive answer → set remote desc ──
    const onWebRTCAnswer = async ({ sdp, fromSocketId }) => {
      const pc = peerConnections.current.get(fromSocketId);
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          // Apply pending candidates
          const pending = pendingCandidates.current.get(fromSocketId) || [];
          for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current.delete(fromSocketId);
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    // ── Receive ICE candidate ──
    const onIceCandidate = async ({ candidate, fromSocketId }) => {
      const pc = peerConnections.current.get(fromSocketId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        // Queue candidate until remote description is set
        if (!pendingCandidates.current.has(fromSocketId)) {
          pendingCandidates.current.set(fromSocketId, []);
        }
        pendingCandidates.current.get(fromSocketId).push(candidate);
      }
    };

    // ── User left ──
    const onUserLeft = ({ socketId, userName }) => {
      closePeerConnection(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // ── Participant media state changed ──
    const onParticipantMediaChange = ({ socketId, isAudioEnabled, isVideoEnabled }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        if (peer) {
          next.set(socketId, { ...peer, isAudioEnabled, isVideoEnabled });
        }
        return next;
      });
    };

    // ── Screen share events ──
    const onScreenShareStarted = ({ socketId, userName, userRole }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        if (peer) next.set(socketId, { ...peer, isScreenSharing: true });
        return next;
      });
    };

    const onScreenShareStopped = ({ socketId }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const peer = next.get(socketId);
        if (peer) next.set(socketId, { ...peer, isScreenSharing: false });
        return next;
      });
    };

    // Register listeners
    socket.on('room-participants', onRoomParticipants);
    socket.on('user-joined', onUserJoined);
    socket.on('webrtc-offer', onWebRTCOffer);
    socket.on('webrtc-answer', onWebRTCAnswer);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('user-left', onUserLeft);
    socket.on('participant-media-change', onParticipantMediaChange);
    socket.on('user-screen-share-started', onScreenShareStarted);
    socket.on('user-screen-share-stopped', onScreenShareStopped);

    return () => {
      socket.off('room-participants', onRoomParticipants);
      socket.off('user-joined', onUserJoined);
      socket.off('webrtc-offer', onWebRTCOffer);
      socket.off('webrtc-answer', onWebRTCAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('user-left', onUserLeft);
      socket.off('participant-media-change', onParticipantMediaChange);
      socket.off('user-screen-share-started', onScreenShareStarted);
      socket.off('user-screen-share-stopped', onScreenShareStopped);
    };
  }, [socket, roomId, callPeer, createPeerConnection, closePeerConnection]);

  // ── Trigger pending calls once localStream is ready ──
  useEffect(() => {
    if (localStream && pendingCalls.length > 0) {
      console.log(`🚀 Media ready. Calling ${pendingCalls.length} pending peers...`);
      pendingCalls.forEach((p) => {
        callPeer(p.socketId, p.userName, p.userRole, p.userAvatar);
      });
      setPendingCalls([]);
    }
  }, [localStream, pendingCalls, callPeer]);

  // ──────────────────────────────────────────────────────────────
  // Toggle Audio
  // ──────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    const newState = audioTracks[0]?.enabled ?? false;
    setIsAudioEnabled(newState);

    if (socket) {
      socket.emit('media-state-change', {
        roomId,
        isAudioEnabled: newState,
        isVideoEnabled,
      });
    }
  }, [socket, roomId, isVideoEnabled]);

  // ──────────────────────────────────────────────────────────────
  // Toggle Video
  // ──────────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    const newState = videoTracks[0]?.enabled ?? false;
    setIsVideoEnabled(newState);

    if (socket) {
      socket.emit('media-state-change', {
        roomId,
        isAudioEnabled,
        isVideoEnabled: newState,
      });
    }
  }, [socket, roomId, isAudioEnabled]);

  // ──────────────────────────────────────────────────────────────
  // Screen Share
  // ──────────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: true,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const screenVideoTrack = stream.getVideoTracks()[0];
      peerConnections.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenVideoTrack);
        }
      });

      // Notify room
      if (socket) {
        socket.emit('screen-share-start', { roomId });
      }

      // Handle user stopping screen share via browser UI
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      console.error('Screen share error:', err);
      return null;
    }
  }, [socket, roomId]);

  const stopScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) return;

    screenStreamRef.current.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);

    // Restore camera track in all peer connections
    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(cameraTrack);
        });
      }
    }

    if (socket) {
      socket.emit('screen-share-stop', { roomId });
    }
  }, [socket, roomId]);

  // ──────────────────────────────────────────────────────────────
  // Cleanup on unmount
  // ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close all peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    setLocalStream(null);
    setScreenStream(null);
    setPeers(new Map());
    setParticipants([]);
    setIsScreenSharing(false);
  }, []);

  return {
    // Local state
    localStream,
    screenStream,
    isScreenSharing,
    isAudioEnabled,
    isVideoEnabled,
    isCameraReady,
    // Remote peers
    peers,
    participants,
    // Actions
    initLocalMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
};

export default useWebRTC;
