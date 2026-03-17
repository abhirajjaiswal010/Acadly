# 🛠️ Troubleshooting & Fixes Journal

This document logs specific errors encountered during the development of **LearnLive** and explains how they were resolved.

---

## 1. Express 5 Wildcard Path Error
- **Where**: `backend/server.js` (404 Handler)
- **Why**: Express 5 uses a stricter version of `path-to-regexp`. The traditional `app.use('*', ...)` wildcard string is no longer accepted for midleware without specific parameter names.
- **How**: Changed to `app.use((req, res) => ...)` without a path string. This serves as a "catch-all" for any unmatched routes in Express 5.

## 2. MongoDB Connection Options Deprecation
- **Where**: `backend/config/db.js`
- **Why**: Mongoose 6+ and the underlying MongoDB driver now treat `useNewUrlParser` and `useUnifiedTopology` as the default. Explicitly passing them as `true` causes a `TypeError`.
- **How**: Removed the options object from `mongoose.connect(uri)`.

## 3. Mongoose Async Hook `next()` Error
- **Where**: `backend/models/User.js`
- **Why**: In modern Mongoose, `pre('save')` hooks that use `async/await` should not accept or call the `next()` callback. Doing so leads to a "next is not a function" error because the hook is already handled via the Promise.
- **How**: Changed `async function (next)` to `async function ()` and removed calls to `next()`.

## 4. Duplicate Schema Index Warning
- **Where**: `backend/models/Class.js`
- **Why**: Defining `unique: true` on a field automatically creates a MongoDB index. Manually adding `classSchema.index({ sessionId: 1 })` later created a redundant duplicate index.
- **How**: Removed the explicit `schema.index()` call for `sessionId`.

## 5. ESLint: 'useDispatch' is not defined
- **Where**: `frontend/src/pages/AuthPages.js`
- **Why**: During a code refactor/edit, the import line for React and Redux hooks was accidentally truncated or removed.
- **How**: Restored the missing `import React, { useState } from 'react';` and `import { useDispatch, useSelector } from 'react-redux';`.

## 6. WebRTC Race Condition (Refresh Bug)
- **Where**: `frontend/src/hooks/useWebRTC.js`
- **Why**: When a student refreshed the page, they initiated the WebRTC call immediately. However, their camera/mic stream (`localStream`) wasn't ready yet. The resulting Sdp Offer was "empty" (no tracks), so the teacher's browser never triggered `ontrack`.
- **How**: Implemented a `pendingCalls` queue. The app now detects existing participants but waits until the `localStream` is successfully captured before initiating the calls. This ensures every offer contains active media tracks.

## 7. Password Visibility Toggle Alignment
- **Where**: `frontend/src/index.css` & `AuthPages.js`
- **Why**: Standard input fields don't accommodate absolute-positioned icons without specific padding adjustment.
- **How**: Wrapped the password input in a `.password-input-wrapper`, added `padding-right: 45px` to the input, and used a `button` with absolute positioning for the Eye icon.

---

*This journal serves as a reference for handling similar stack-specific quirks (Express 5, Mongoose 8+, WebRTC Signaling).*
