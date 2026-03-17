# 🎓 LearnLive: Real-Time Video Collaboration Platform

A high-performance remote learning platform built with the MERN stack, WebRTC, and Socket.io. It supports real-time video/audio streaming, screen sharing, and interactive classrooms.

> [!NOTE]
> Detailed development notes and fixes for common stack errors can be found in [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## 🚀 Key Features

- **Authentication**: JWT-based auth with Role-Based Access Control (Student/Teacher/Admin).
- **Classroom Management**: Teachers can create/manage classes with unique session codes.
- **WebRTC Streaming**: Peer-to-peer video/audio with low latency.
- **Screen Sharing**: High-resolution screen sharing for teachers and students.
- **Real-Time Signaling**: Handled via Socket.io for offer/answer/ICE exchange.
- **Interactive Chat**: Built-in chat system for every classroom.
- **Reactions**: Send live emojis to keep sessions engaging.
- **Modern UI**: Dark-themed, glassmorphic design using Vanilla CSS.

---

## 🛠️ Technology Stack

- **Frontend**: React (Hooks), Redux Toolkit, Socket.io-client, Axios, Lucide-icons.
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB).
- **RTC**: Native WebRTC API via `simple-peer` logic.
- **Styling**: Vanilla CSS with Design Tokens.

---

## 📦 Project Structure

```text
backend/
├── config/         # DB connection
├── controllers/    # API logic (Auth, Class)
├── middleware/     # Auth & Error handlers
├── models/         # Mongoose Schemas
├── routes/         # Express routes
├── socket/         # Signaling Server logic
└── server.js       # Entry point

frontend/
├── src/
│   ├── components/ # Reusable UI (Video, Chat, Navbar)
│   ├── hooks/      # useWebRTC core logic
│   ├── pages/      # Main views (Dashboard, ClassRoom)
│   ├── redux/      # Global state management
│   └── utils/      # API & Socket singletons
└── .env            # Frontend environment variables
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Running locally on `27017` or Atlas URI)

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   - Fill in your `MONGO_URI` and `JWT_SECRET`.
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm start
   ```

---

## 📖 How to Use

1. **Register as a Teacher**: Create a new account and select the "Teacher" role.
2. **Create a Class**: From the dashboard, click "Create Class". A unique 8-digit **Session Code** will be generated.
3. **Go Live**: Ener the classroom and enable your camera/mic.
4. **Student Join**: Register as a "Student", enter the session code on your dashboard, and click "Join".
5. **Interactive Tools**: Use the chat panel on the right or the reaction picker in the center console.

---

## 🔒 Security & Optimization

- **JWT Security**: All sensitive routes are protected by JWT verification.
- **ICE/TURN**: Configured with Google STUN servers. For production, add a TURN server (e.g., Metered or Twilio) in `useWebRTC.js`.
- **Performance**: Track replacement for screen sharing avoids renegotiation where possible.

---

Created with ❤️ by Antigravity AI
