/**
 * Socket.io Signaling Server for WebRTC
 *
 * Handles:
 * - Room management (join/leave)
 * - WebRTC signaling: SDP offer/answer exchange
 * - ICE candidate exchange
 * - Chat messages
 * - Screen share notifications
 * - Reactions/emojis
 * - User presence notifications
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Class = require('../models/Class');

// Map: roomId -> Set of connected socket IDs
const rooms = new Map();
// Map: socketId -> { userId, userName, userRole, roomId }
const socketUsers = new Map();

const initializeSocket = (io) => {
  // ────────────────────────────────────────────────────────────────
  // Middleware: Authenticate socket connections via JWT
  // ────────────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userRole = user.role;
      socket.userAvatar = user.avatar;

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ────────────────────────────────────────────────────────────────
  // Connection handler
  // ────────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.userName} - ${socket.userRole})`);

    // ─────────────────────────────────────────
    // JOIN ROOM
    // ─────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      try {
        // Validate class exists
        const classItem = await Class.findOne({ sessionId: roomId });
        if (!classItem) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        socket.join(roomId);

        // Track room participants
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }

        const roomParticipants = rooms.get(roomId);
        roomParticipants.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          userAvatar: socket.userAvatar,
          socketId: socket.id,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isScreenSharing: false,
        });

        socketUsers.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          roomId,
        });

        // Send existing participants list to the new user
        const existingParticipants = Array.from(roomParticipants.entries())
          .filter(([id]) => id !== socket.id)
          .map(([id, data]) => ({ socketId: id, ...data }));

        socket.emit('room-participants', {
          participants: existingParticipants,
          roomId,
        });

        // Notify others about new user
        socket.to(roomId).emit('user-joined', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          userAvatar: socket.userAvatar,
        });

        // Update class isLive status for teachers
        if (socket.userRole === 'teacher') {
          await Class.findOneAndUpdate({ sessionId: roomId }, { isLive: true });
        }

        // Update session history
        await Class.findOneAndUpdate(
          { sessionId: roomId },
          {
            $push: {
              sessionHistory: {
                userName: socket.userName,
                userRole: socket.userRole,
                action: 'joined',
              },
            },
          }
        );

        console.log(`👥 ${socket.userName} joined room: ${roomId} (${roomParticipants.size} total)`);

      } catch (err) {
        console.error('join-room error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─────────────────────────────────────────
    // WebRTC SIGNALING: SDP OFFER
    // Sender → Server → Target
    // ─────────────────────────────────────────
    socket.on('webrtc-offer', ({ targetSocketId, sdp }) => {
      console.log(`📡 SDP offer: ${socket.id} → ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc-offer', {
        sdp,
        fromSocketId: socket.id,
        fromUserName: socket.userName,
        fromUserRole: socket.userRole,
      });
    });

    // ─────────────────────────────────────────
    // WebRTC SIGNALING: SDP ANSWER
    // ─────────────────────────────────────────
    socket.on('webrtc-answer', ({ targetSocketId, sdp }) => {
      console.log(`📡 SDP answer: ${socket.id} → ${targetSocketId}`);
      io.to(targetSocketId).emit('webrtc-answer', {
        sdp,
        fromSocketId: socket.id,
      });
    });

    // ─────────────────────────────────────────
    // WebRTC SIGNALING: ICE CANDIDATE
    // ─────────────────────────────────────────
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─────────────────────────────────────────
    // MEDIA STATE UPDATES (mute/unmute, video toggle)
    // ─────────────────────────────────────────
    socket.on('media-state-change', ({ roomId, isAudioEnabled, isVideoEnabled }) => {
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.isAudioEnabled = isAudioEnabled;
        participant.isVideoEnabled = isVideoEnabled;
        roomParticipants.set(socket.id, participant);
      }

      socket.to(roomId).emit('participant-media-change', {
        socketId: socket.id,
        isAudioEnabled,
        isVideoEnabled,
      });
    });

    // ─────────────────────────────────────────
    // SCREEN SHARE START
    // ─────────────────────────────────────────
    socket.on('screen-share-start', ({ roomId }) => {
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.isScreenSharing = true;
        roomParticipants.set(socket.id, participant);
      }

      socket.to(roomId).emit('user-screen-share-started', {
        socketId: socket.id,
        userName: socket.userName,
        userRole: socket.userRole,
      });
    });

    // ─────────────────────────────────────────
    // SCREEN SHARE STOP
    // ─────────────────────────────────────────
    socket.on('screen-share-stop', ({ roomId }) => {
      const roomParticipants = rooms.get(roomId);
      if (roomParticipants && roomParticipants.has(socket.id)) {
        const participant = roomParticipants.get(socket.id);
        participant.isScreenSharing = false;
        roomParticipants.set(socket.id, participant);
      }

      socket.to(roomId).emit('user-screen-share-stopped', {
        socketId: socket.id,
        userName: socket.userName,
      });
    });

    // ─────────────────────────────────────────
    // CHAT MESSAGE
    // ─────────────────────────────────────────
    socket.on('chat-message', ({ roomId, message }) => {
      if (!message || !message.trim()) return;

      const chatPayload = {
        id: `${socket.id}-${Date.now()}`,
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        userAvatar: socket.userAvatar,
        message: message.trim().substring(0, 500), // Limit message length
        timestamp: new Date().toISOString(),
      };

      // Broadcast to everyone in the room (including sender)
      io.to(roomId).emit('chat-message', chatPayload);
    });

    // ─────────────────────────────────────────
    // USER TYPING
    // ─────────────────────────────────────────
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user-typing', {
        userName: socket.userName,
        isTyping,
      });
    });

    // ─────────────────────────────────────────
    // REACTIONS / EMOJIS
    // ─────────────────────────────────────────
    socket.on('send-reaction', ({ roomId, emoji }) => {
      socket.to(roomId).emit('reaction-received', {
        socketId: socket.id,
        userName: socket.userName,
        emoji,
        timestamp: new Date().toISOString(),
      });
    });

    // ─────────────────────────────────────────
    // RAISE HAND
    // ─────────────────────────────────────────
    socket.on('raise-hand', ({ roomId, isRaised }) => {
      socket.to(roomId).emit('hand-raised', {
        socketId: socket.id,
        userName: socket.userName,
        isRaised,
      });
    });

    // ─────────────────────────────────────────
    // WHITEBOARD EVENTS
    // ─────────────────────────────────────────
    socket.on('draw', (data) => {
      // data should contain roomId
      if (data.roomId) {
        socket.to(data.roomId).emit('draw', data);
      }
    });

    socket.on('clear-whiteboard', ({ roomId }) => {
      if (roomId) {
        io.to(roomId).emit('clear-whiteboard');
      }
    });

    // ─────────────────────────────────────────
    // GET ROOM PARTICIPANTS (re-request)
    // ─────────────────────────────────────────
    socket.on('get-participants', ({ roomId }) => {
      const roomParticipants = rooms.get(roomId);
      const participants = roomParticipants
        ? Array.from(roomParticipants.entries()).map(([id, data]) => ({
            socketId: id,
            ...data,
          }))
        : [];

      socket.emit('room-participants', { participants, roomId });
    });

    // ─────────────────────────────────────────
    // LEAVE ROOM (explicit)
    // ─────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      handleUserLeave(socket, roomId, io);
    });

    // ─────────────────────────────────────────
    // DISCONNECT (implicit)
    // ─────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${socket.userName})`);

      const userData = socketUsers.get(socket.id);
      if (userData) {
        handleUserLeave(socket, userData.roomId, io);
      }

      socketUsers.delete(socket.id);
    });
  });
};

/**
 * Helper: Handle user leaving a room (socket leave / disconnect)
 */
const handleUserLeave = async (socket, roomId, io) => {
  if (!roomId) return;

  socket.leave(roomId);

  const roomParticipants = rooms.get(roomId);
  if (roomParticipants) {
    roomParticipants.delete(socket.id);

    // Notify remaining participants
    io.to(roomId).emit('user-left', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
    });

    // If room is empty, clean up
    if (roomParticipants.size === 0) {
      rooms.delete(roomId);
      // Mark class as not live if teacher left and no one remains
      try {
        await Class.findOneAndUpdate({ sessionId: roomId }, { isLive: false });
      } catch (e) {
        // Non-critical
      }
    } else {
      // If the teacher left, notify students
      if (socket.userRole === 'teacher') {
        io.to(roomId).emit('teacher-left', {
          socketId: socket.id,
          userName: socket.userName,
        });
        // Update live status
        try {
          await Class.findOneAndUpdate({ sessionId: roomId }, { isLive: false });
        } catch (e) {}
      }
    }
  }

  // Log to session history
  try {
    await Class.findOneAndUpdate(
      { sessionId: roomId },
      {
        $push: {
          sessionHistory: {
            userName: socket.userName,
            userRole: socket.userRole,
            action: 'left',
          },
        },
      }
    );
  } catch (e) {}

  console.log(`👋 ${socket.userName} left room: ${roomId}`);
};

module.exports = initializeSocket;
