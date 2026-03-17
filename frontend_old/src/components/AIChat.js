import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, MessageCircleQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AI Chat component to ask questions about the lecture
 */
const AIChat = ({ onAsk, isLoading, history = [] }) => {
  const [question, setQuestion] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onAsk(question);
    setQuestion('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-surface-light">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="font-bold text-text text-sm">Lecture AI Assistant</h3>
          <p className="text-[10px] text-text-muted">Analyzing context in real-time</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {history.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-10">
            <MessageCircleQuestion size={48} className="mb-4" />
            <p className="text-sm">Ask me anything about today's lecture!</p>
            <p className="text-[10px] mt-2">Example: "What are the three main components discussed?"</p>
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className="space-y-4">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="bg-primary/20 border border-primary/20 rounded-2xl p-3 max-w-[85%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-[10px] font-bold text-primary uppercase">You</span>
                  <User size={12} className="text-primary" />
                </div>
                <p className="text-sm text-text-light text-right">{msg.question}</p>
              </div>
            </div>

            {/* AI Answer */}
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-2xl p-4 max-w-[90%] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} className="text-accent" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">AI Assistant</span>
                </div>
                <p className="text-sm text-text-light leading-relaxed">{msg.answer}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <Loader2 size={16} className="text-accent animate-spin" />
              <span className="text-xs text-text-muted italic">Analyzing lecture transcript...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-light border-t border-border">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the lecture..."
            disabled={isLoading}
            className="w-full bg-surface-dark border border-border focus:border-primary text-text text-sm rounded-xl py-4 pl-5 pr-14 focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-text-muted"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 disabled:grayscale transition-all shadow-md shadow-primary/20"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[9px] text-center text-text-muted mt-3 uppercase tracking-tighter">
          AI generated content may be incomplete or inaccurate
        </p>
      </div>
    </div>
  );
};

export default AIChat;
