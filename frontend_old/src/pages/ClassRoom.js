import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClassBySession, clearCurrentClass } from '../redux/slices/classSlice';
import useWebRTC from '../hooks/useWebRTC';
import { initSocket, disconnectSocket } from '../utils/socket';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/ChatBox';
import toast from 'react-hot-toast';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, 
  Smile, Hand, PhoneOff, MessageSquare, Users, 
  LogOut, GraduationCap, Users2, ShieldCheck, MonitorOff,
  FileText, Brain, Sparkles, Languages, Search as SearchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Transcript System Components
import useTranscript from '../hooks/useTranscript';
import LiveCaptions from '../components/LiveCaptions';
import TranscriptPanel from '../components/TranscriptPanel';
import NotesPanel from '../components/NotesPanel';
import AIChat from '../components/AIChat';
import SearchBar from '../components/SearchBar';
import { transcriptAPI } from '../utils/api';

const ClassRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, token } = useSelector((state) => state.auth);
  const { currentClass, loading } = useSelector((state) => state.classes);
  
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants' | 'transcript' | 'notes' | 'ai-chat'
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState([]); // { id, emoji, userName }
  
  // Transcript API states
  const [aiNotes, setAiNotes] = useState(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([]);
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // 1. Initialize WebRTC Hook
  const {
    localStream,
    peers,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isCameraReady,
    initLocalMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup
  } = useWebRTC(sessionId, user?.role);

  // 1b. Initialize Transcript Hook
  const {
    isTranscribing,
    liveCaptions,
    transcriptChunks,
    toggleTranscription,
    language,
    setLanguage
  } = useTranscript(sessionId, user?.role, isAudioEnabled);

  // 2. Setup Socket & Data
  useEffect(() => {
    if (!sessionId || !token) return;

    dispatch(fetchClassBySession(sessionId));

    const s = initSocket(token);
    setSocket(s);

    s.emit('join-room', { roomId: sessionId });

    s.on('reaction-received', ({ emoji, userName }) => {
      const id = Date.now();
      setReactions(prev => [...prev, { id, emoji, userName }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    });

    return () => {
      s.emit('leave-room', { roomId: sessionId });
      disconnectSocket();
      cleanup();
      dispatch(clearCurrentClass());
    };
  }, [sessionId, token, dispatch, cleanup]);

  // 3. Initialize Media after socket is ready
  useEffect(() => {
    if (socket && !localStream) {
      initLocalMedia();
    }
  }, [socket, localStream, initLocalMedia]);

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave the classroom?')) {
      navigate('/dashboard');
    }
  };

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('send-reaction', { roomId: sessionId, emoji });
      setShowReactions(false);
      const id = Date.now();
      setReactions(prev => [...prev, { id, emoji, userName: 'You' }]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    }
  };

  if (loading && !currentClass) {
    return (
      <div className="classroom-page items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="loading-spinner" 
        />
        <p className="mt-2 text-muted">Entering classroom...</p>
      </div>
    );
  }

  if (!currentClass) return null;

  const peerArray = Array.from(peers.values());
  const totalTiles = peerArray.length + 1;
  let gridClass = 'grid-many';
  if (totalTiles === 1) gridClass = 'grid-1';
  else if (totalTiles === 2) gridClass = 'grid-2';
  else if (totalTiles === 3) gridClass = 'grid-3';
  else if (totalTiles <= 4) gridClass = 'grid-4';

  const handleGenerateNotes = async () => {
    try {
      setIsGeneratingNotes(true);
      const res = await transcriptAPI.generateNotes(sessionId);
      if (res.data.success) {
        setAiNotes(res.data.notes);
        toast.success('Smart Notes generated!');
      }
    } catch (err) {
      toast.error('Failed to generate notes. Is there enough transcript?');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleAskAI = async (question) => {
    try {
      setIsAiAnswering(true);
      const res = await transcriptAPI.askAI(sessionId, question);
      if (res.data.success) {
        setAiChatHistory(prev => [...prev, { question, answer: res.data.answer }]);
      }
    } catch (err) {
      toast.error('AI assistant is busy or has no context.');
    } finally {
      setIsAiAnswering(false);
    }
  };

  const handleExport = async (type) => {
    try {
      if (type === 'markdown') {
        const res = await transcriptAPI.exportMarkdown(sessionId);
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${sessionId}-transcript.md`);
        document.body.appendChild(link);
        link.click();
        toast.success('Transcript exported!');
      } else {
        toast('PDF export coming soon. Use Markdown for now!');
      }
    } catch (err) {
      toast.error('Failed to export. Transcript might be empty.');
    }
  };

  return (
    <div className="classroom-page">
      {/* 1. Header */}
      <header className="classroom-header">
        <div className="flex items-center gap-3">
          <div className="logo-icon" style={{ width: 32, height: 32 }}>
            <GraduationCap size={18} />
          </div>
          <div>
            <h1 className="classroom-title">{currentClass.title}</h1>
            <div className="classroom-room-code">
              Teacher: <span className="font-semibold text-primary">{currentClass.teacher?.name || 'Loading...'}</span>
              <span className="mx-2 opacity-30">•</span>
              Code: <span className="font-mono text-accent">{sessionId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentClass.isLive && <span className="badge badge-live">🔴 LIVE</span>}
          <div className="participant-icons flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border">
            <Users2 size={14} className="text-primary" />
            <span className="text-sm font-semibold">{participants.length + 1}</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLeave}>
             Leave
          </button>
        </div>
      </header>

      <div className="classroom-body">
        {/* 2. Video Area */}
        <main className="video-area">
          <motion.div 
            layout
            className={`video-grid ${gridClass}`}
          >
            {/* Local Stream */}
            <VideoPlayer
              stream={localStream}
              userName={user?.name}
              userRole={user?.role}
              isLocal={true}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
            />

            {/* Live Captions Overlay */}
            <LiveCaptions captions={liveCaptions} isVisible={true} />

            {/* Remote Peers */}
            <AnimatePresence>
              {peerArray.map((peer) => (
                <motion.div
                  key={peer.socketId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <VideoPlayer
                    stream={peer.stream}
                    userName={peer.userName}
                    userRole={peer.userRole}
                    isAudioEnabled={peer.isAudioEnabled !== false}
                    isVideoEnabled={peer.isVideoEnabled !== false}
                    isScreenSharing={peer.isScreenSharing}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 3. Controls Bar */}
          <div className="controls-bar">
            <button 
              className={`control-btn ${!isAudioEnabled ? 'muted' : 'active'}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              <span className="icon">
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </span>
              <span>{isAudioEnabled ? 'Mute' : 'Unmute'}</span>
            </button>

            <button 
              className={`control-btn ${!isVideoEnabled ? 'muted' : 'active'}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            >
              <span className="icon">
                {isVideoEnabled ? <VideoIcon size={20} /> : <VideoOff size={20} />}
              </span>
              <span>{isVideoEnabled ? 'Video' : 'Camera'}</span>
            </button>

            <button 
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              title="Share Screen"
            >
              <span className="icon">
                {isScreenSharing ? <MonitorOff size={20} /> : <ScreenShare size={20} />}
              </span>
              <span>{isScreenSharing ? 'Stop' : 'Share'}</span>
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                className={`control-btn ${showReactions ? 'active' : ''}`}
                onClick={() => setShowReactions(!showReactions)}
              >
                <span className="icon"><Smile size={20} /></span>
                <span>React</span>
              </button>
              
              <AnimatePresence>
                {showReactions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="reaction-picker"
                  >
                    {['👏', '🔥', '❤️', '😂', '😮', '👍'].map(emoji => (
                      <span 
                        key={emoji} 
                        className="reaction-option"
                        onClick={() => sendReaction(emoji)}
                      >
                        {emoji}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Anyone can start transcribing for demo purposes */}
            <button 
              className={`control-btn ${isTranscribing ? 'active' : ''}`}
              onClick={toggleTranscription}
              title={isTranscribing ? 'Stop Transcribing' : 'Start Transcribing'}
            >
              <span className="icon">
                {isTranscribing ? <Languages size={20} className="text-primary animate-pulse" /> : <Languages size={20} />}
              </span>
              <span>{isTranscribing ? 'Captions ON' : 'Captions'}</span>
            </button>

            <button className="control-btn" onClick={() => setActiveTab('ai-chat')}>
              <span className="icon"><Brain size={20} /></span>
              <span>Ask AI</span>
            </button>

            <button className="control-btn" onClick={() => toast.success('Raise Hand toggled (Demo)')}>
              <span className="icon"><Hand size={20} /></span>
              <span>Hand</span>
            </button>

            <button className="control-btn danger" onClick={handleLeave}>
              <span className="icon"><PhoneOff size={20} /></span>
              <span>End</span>
            </button>
          </div>
        </main>

        {/* 4. Sidebar */}
        <aside className="classroom-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              <FileText size={16} />
              <span>Transcript</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <Sparkles size={16} />
              <span>Notes</span>
            </button>
            <button 
              className={`sidebar-tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              <Users size={16} />
              <span>People</span>
            </button>
          </div>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {activeTab === 'chat' && (
              <ChatBox socket={socket} roomId={sessionId} />
            )}

            {activeTab === 'transcript' && (
              <TranscriptPanel 
                chunks={transcriptChunks} 
                roomId={sessionId}
                onExport={(type) => handleExport(type)}
              />
            )}

            {activeTab === 'notes' && (
              <NotesPanel 
                notes={aiNotes} 
                isLoading={isGeneratingNotes}
                onGenerate={handleGenerateNotes}
                onExport={(type) => handleExport(type)}
              />
            )}

            {activeTab === 'ai-chat' && (
              <AIChat 
                history={aiChatHistory}
                isLoading={isAiAnswering}
                onAsk={handleAskAI}
              />
            )}

            {activeTab === 'participants' && (
              <div className="participants-panel overflow-y-auto">
                <div className="p-4 border-b border-border bg-surface-light">
                  <h3 className="font-semibold text-sm">Participants ({participants.length + 1})</h3>
                </div>
                {/* Local */}
                <div className="participant-item">
                  <div className="participant-avatar">{user?.name?.charAt(0)}</div>
                  <div className="participant-info">
                    <div className="participant-name">{user?.name} (You)</div>
                    <div className="participant-role">{user?.role}</div>
                  </div>
                  <div className="participant-icons">
                    {isAudioEnabled ? <Mic size={14} className="text-primary" /> : <MicOff size={14} className="text-danger" />}
                    {isVideoEnabled ? <VideoIcon size={14} className="text-primary" /> : <VideoOff size={14} className="text-danger" />}
                  </div>
                </div>

                {/* Remotes */}
                {participants.map(p => {
                  const peerData = peers.get(p.socketId);
                  return (
                    <div key={p.socketId} className="participant-item">
                      <div className="participant-avatar">{p.userName?.charAt(0)}</div>
                      <div className="participant-info">
                        <div className="participant-name">
                          {p.userName}
                          {p.userRole === 'teacher' && (
                            <span className="badge badge-accent ml-2">
                              <ShieldCheck size={10} className="mr-1" />
                              Teacher
                            </span>
                          )}
                        </div>
                        <div className="participant-role">{p.userRole}</div>
                      </div>
                      <div className="participant-icons">
                        {peerData?.isAudioEnabled !== false ? <Mic size={14} className="text-primary" /> : <MicOff size={14} className="text-danger" />}
                        {peerData?.isVideoEnabled !== false ? <VideoIcon size={14} className="text-primary" /> : <VideoOff size={14} className="text-danger" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </aside>
      </div>

      {/* Floating Reactions */}
      <div className="reactions-overlay">
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: -200 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="reaction-bubble flex flex-col items-center"
            >
              <span className="text-3xl">{r.emoji}</span>
              <span className="text-xs bg-black/50 px-2 py-0.5 rounded-full text-white backdrop-blur-sm">
                {r.userName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClassRoom;
