require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const initializeSocket = require('./socket/socketHandler');

// ────────────────────────────────────────────────────────
// Initialize Express App
// ────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ────────────────────────────────────────────────────────
// Initialize Socket.io
// ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ────────────────────────────────────────────────────────
// Connect to MongoDB
// ────────────────────────────────────────────────────────
connectDB();

// ────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LearnLive API is running 🚀',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/transcripts', transcriptRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ────────────────────────────────────────────────────────
// Global Error Handler (must be last)
// ────────────────────────────────────────────────────────
app.use(errorHandler);

// ────────────────────────────────────────────────────────
// Initialize Socket.io Signaling
// ────────────────────────────────────────────────────────
initializeSocket(io);

// ────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🎓 LearnLive Server Started        ║
  ║   Port:    ${PORT}                       ║
  ║   Mode:    ${process.env.NODE_ENV}            ║
  ╚══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
