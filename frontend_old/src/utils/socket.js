import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize and return a singleton Socket.io client instance
 * @param {string} token - JWT auth token
 */
export const initSocket = (token) => {
  if (socket && socket.connected) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

/**
 * Get existing socket instance
 */
export const getSocket = () => socket;

/**
 * Disconnect and cleanup socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and cleaned up');
  }
};

export default { initSocket, getSocket, disconnectSocket };
