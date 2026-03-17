# 🎓 Acadly: Real-Time Live Class Platform

Acadly is a modern MERN-stack application designed for seamless real-time learning. It leverages WebRTC for high-quality video/audio streaming, Socket.io for instant signaling and interactivity, and MongoDB for persistent data.

---

## 🚀 API Documentation

Base URL: `http://localhost:5000/api`

### 🔒 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new user (Teacher/Student) | Public |
| POST | `/login` | Authenticate and get JWT token | Public |
| GET | `/me` | Get current user profile | Protected |
| PUT | `/profile` | Update user profile details | Protected |
| PUT | `/change-password` | Update account password | Protected |
| GET | `/users` | Get list of all users | Admin |

### 📚 Classes (`/api/classes`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/` | List all classes for current user | Protected |
| POST | `/` | Create a new class session | Teacher/Admin |
| GET | `/:id` | Get class details by ID | Protected |
| PUT | `/:id` | Update class details | Teacher/Admin |
| DELETE | `/:id` | Remove a class session | Teacher/Admin |
| POST | `/join` | Join a class using Session Code | Student/Admin |
| GET | `/session/:sessionId` | Find class using 8-digit code | Protected |
| GET | `/admin/all` | List every class in the system | Admin |

### 🖍️ Whiteboard (`/api/whiteboard`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| GET | `/:roomId` | Retrieve saved whiteboard data | Protected |
| POST | `/save` | Save current whiteboard state | Protected |

---

## ⚡ Socket.io Events

The socket server facilitates WebRTC signaling and real-time interactive features. All events require a valid JWT token in the handshake.

### Client-to-Server (Emit)
- **`join-room`**: `{ roomId }` - Join a specific classroom session.
- **`webrtc-offer`**: `{ targetSocketId, sdp }` - Initiate a WebRTC connection.
- **`webrtc-answer`**: `{ targetSocketId, sdp }` - Respond to an offer.
- **`ice-candidate`**: `{ targetSocketId, candidate }` - Exchange network path.
- **`chat-message`**: `{ roomId, message }` - Send message to classroom.
- **`typing`**: `{ roomId, isTyping }` - Broadcast typing status.
- **`send-reaction`**: `{ roomId, emoji }` - Send instant emoji reaction.
- **`raise-hand`**: `{ roomId, isRaised }` - Notify teacher of a doubt.
- **`draw`**: `{ roomId, ...drawData }` - Real-time whiteboard sync.
- **`clear-whiteboard`**: `{ roomId }` - Reset drawing board for all.
- **`media-state-change`**: `{ roomId, isAudioEnabled, isVideoEnabled }` - Update stream status.
- **`screen-share-start`**: `{ roomId }` - Notify others of incoming screen share.

### Server-to-Client (Listen)
- **`room-participants`**: Received upon joining; lists all current users.
- **`user-joined`**: Notifies others when a new student/teacher joins.
- **`chat-message`**: Incoming real-time message payload.
- **`reaction-received`**: Floating emoji notification.
- **`hand-raised`**: Visual indicator in participant list.
- **`participant-media-change`**: Syncs mute/unmute status icons.
- **`teacher-left`**: Special alert when the host disconnects.
- **`error`**: Handles room not found or auth failures.

---

## 🛠️ Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` file with `MONGO_URI`, `JWT_SECRET`, and `PORT`.
4. `npm run dev` (Runs on port 5000 by default)

### Frontend
1. `cd frontend_old`
2. `bun install` (or `npm install`)
3. `bun run dev` (Runs on port 3000)

---

## 🏗️ Architecture
- **Signaling**: Custom Node.js/Socket.io signaling logic for WebRTC handshakes.
- **P2P Streaming**: `simple-peer` for direct browser-to-browser media streams.
- **State**: Redux Toolkit for auth and class state management.
- **UI**: Modern React with Glassmorphism styling and `framer-motion` animations.
