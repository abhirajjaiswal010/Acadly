import React, { useRef, useEffect, useState } from 'react';
import { Search, Clock, MessageSquare, Download, FileText, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';

/**
 * Panel to display the full transcript history during and after class
 */
const TranscriptPanel = ({ chunks, onSeek, roomId, onExport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom only if not searching
  useEffect(() => {
    if (scrollRef.current && !searchQuery) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks, searchQuery]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredChunks = chunks.filter(chunk => 
    chunk.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-primary/30 text-white rounded px-0.5">{part}</mark> 
        : part
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface-light">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="font-semibold text-text text-sm">Transcripts</h3>
          </div>
          <button 
            onClick={() => onExport('markdown')}
            className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted hover:text-primary"
            title="Export as Markdown"
          >
            <Download size={16} />
          </button>
        </div>
        
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Transcript List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {filteredChunks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-6">
            <MessageSquare size={40} className="mb-4" />
            <p className="text-sm">
              {searchQuery ? 'No matches found.' : 'Waiting for lecture to start...'}
            </p>
          </div>
        ) : (
          filteredChunks.map((chunk, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={idx}
              className="group relative pl-10 pb-2 hover:bg-white/5 rounded-lg p-2 transition-all cursor-pointer border-l-2 border-transparent hover:border-primary/30"
              onClick={() => onSeek && onSeek(chunk.timestamp)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                  {formatTime(chunk.timestamp)}
                </span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {chunk.speaker || 'Teacher'}
                </span>
              </div>
              
              <p className="text-sm text-text-light leading-relaxed group-hover:text-text">
                {highlightText(chunk.text, searchQuery)}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Status */}
      <div className="px-4 py-2 bg-surface/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
            {searchQuery ? `${filteredChunks.length} results` : 'Live Stream Active'}
          </span>
        </div>
        <ChevronDown size={14} className="text-text-muted" />
      </div>
    </div>
  );
};

export default TranscriptPanel;
