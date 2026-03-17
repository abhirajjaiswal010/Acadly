import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SendHorizontal, MessageCircle, ShieldCheck, Smile, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatBox = ({ socket, roomId }) => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleTyping = ({ userName, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping && userName !== user?.name) next.add(userName);
        else next.delete(userName);
        return next;
      });
    };

    const handleSystemMessage = (data, action) => {
      const systemMsg = {
        id: `system-${Date.now()}-${data.socketId}`,
        message: `${data.userName} has ${action} the room.`,
        isSystem: true,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, systemMsg]);
    };

    socket.on('chat-message', handleMessage);
    socket.on('user-typing', handleTyping);
    socket.on('user-joined', (data) => handleSystemMessage(data, 'joined'));
    socket.on('user-left', (data) => handleSystemMessage(data, 'left'));

    return () => {
      socket.off('chat-message', handleMessage);
      socket.off('user-typing', handleTyping);
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, user?.name]);

  const sendMessage = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !socket) return;

    socket.emit('chat-message', { roomId, message: text });
    setInputText('');
    
    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { roomId, isTyping: false });
    
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (socket) {
      socket.emit('typing', { roomId, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId, isTyping: false });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-panel flex flex-col h-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
      {/* 1. Header is usually handled by the sidebar tabs in ClassRoom.js, 
          so we focus on the messages and input area */}
      
      {/* 2. Messages area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4"
            >
              <MessageCircle size={32} />
            </motion.div>
            <h3 className="text-lg font-bold">No messages yet</h3>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center py-2"
                >
                  <span className="text-[10px] text-muted font-bold px-3 py-1 bg-surface-hover border border-border rounded-full opacity-60">
                    {msg.message}
                  </span>
                </motion.div>
              );
            }

            const isOwn = msg.userId === user?._id;
            const isTeacher = (isOwn ? user?.role : msg.userRole) === 'teacher';
            
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-muted px-1">
                    {isOwn ? 'You' : msg.userName}
                  </span>
                  {isTeacher && (
                    <span className="badge badge-accent py-0 px-1.5 flex items-center gap-1" style={{ fontSize: '0.65rem' }}>
                      <ShieldCheck size={10} />
                      Teacher
                    </span>
                  )}
                </div>
                
                <div className="group relative max-w-[85%]">
                  <div className={`chat-bubble p-3 rounded-2xl shadow-sm border ${
                    isOwn 
                      ? 'bg-primary text-white border-primary rounded-tr-none' 
                      : 'bg-card-hover text-white border-border rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                  </div>
                  <div className={`mt-1 text-[9px] text-muted font-mono opacity-60 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                  
                  {/* Hover Reactions Placeholder */}
                  <div className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 p-1 bg-surface border border-border rounded-full shadow-lg z-10`}>
                    {['👍', '❤️', '🔥'].map(e => (
                      <span key={e} className="cursor-pointer hover:scale-125 transition-transform text-xs p-1">{e}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {Array.from(typingUsers).map(name => (
            <motion.div 
              key={name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2"
            >
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span className="text-[10px] font-bold text-muted italic">{name} is typing...</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Sticky Input Area */}
      <div className="p-4 bg-surface border-t border-border mt-auto">
        <form onSubmit={sendMessage} className="relative flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <button type="button" className="absolute left-3 text-muted hover:text-primary transition-colors">
              <Smile size={18} />
            </button>
            <textarea
              ref={inputRef}
              className="w-full bg-card-hover border border-border rounded-2xl py-3 px-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none overflow-hidden h-[46px] leading-[22px] text-white"
              placeholder="Start typing..."
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={500}
              rows={1}
            />
            <button type="button" className="absolute right-3 text-muted hover:text-primary transition-colors">
              <Paperclip size={18} />
            </button>
          </div>
          <button
            type="submit"
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-lg ${
              inputText.trim() 
                ? 'bg-primary text-white hover:bg-primary-dark scale-100 hover:scale-105 active:scale-95' 
                : 'bg-muted/10 text-muted scale-95 opacity-50 cursor-not-allowed'
            }`}
            disabled={!inputText.trim()}
          >
            <SendHorizontal size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;

