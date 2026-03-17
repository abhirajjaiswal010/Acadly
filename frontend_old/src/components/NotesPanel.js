import React, { useState } from 'react';
import { Sparkles, Brain, ListCheck, Star, FileDown, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Panel to display AI-generated smart notes
 */
const NotesPanel = ({ notes, isLoading, onGenerate, onExport }) => {
  const [activeView, setActiveView] = useState('summary'); // 'summary' | 'bulletPoints' | 'structured'

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-dark text-center px-10">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-text">AI is analyzing the lecture...</h3>
        <p className="text-sm text-text-muted mt-2">Generating structured notes and key concepts from the transcript.</p>
      </div>
    );
  }

  if (!notes && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-dark text-center px-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Brain size={32} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold text-text">No Notes Generated Yet</h3>
        <p className="text-sm text-text-muted mt-3 mb-8">
          Once the lecture has enough transcript data, you can generate smart AI notes with one click.
        </p>
        <button
          onClick={onGenerate}
          className="btn btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Sparkles size={18} />
          Generate Smart Notes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-dark">
      {/* Header */}
      <div className="p-5 border-b border-border bg-surface-light">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-accent" />
            <h3 className="font-bold text-lg text-text">Smart AI Notes</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onGenerate}
              className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-primary transition-colors"
              title="Regenerate"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={() => onExport('pdf')}
              className="p-2 hover:bg-surface rounded-lg text-text-muted hover:text-accent transition-colors"
              title="Export as PDF"
            >
              <FileDown size={16} />
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex bg-surface rounded-lg p-1 gap-1">
          {['summary', 'bulletPoints', 'structured'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeView === view 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-accent text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Star size={14} /> Full Summary
                  </h4>
                  <p className="text-text-light leading-relaxed text-sm bg-surface/30 p-4 rounded-xl border border-white/5">
                    {notes.summary}
                  </p>
                </div>
                
                {notes.keyConcepts?.length > 0 && (
                  <div>
                    <h4 className="text-primary text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Brain size={14} /> Key Concepts
                    </h4>
                    <div className="grid gap-3">
                      {notes.keyConcepts.map((concept, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-surface/50 rounded-lg border border-border">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                          <p className="text-sm text-text-light">{concept}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'bulletPoints' && (
              <div className="space-y-4">
                <h4 className="text-accent text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ListCheck size={14} /> Key Takeaways
                </h4>
                {notes.bulletPoints?.map((point, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full border-2 border-primary group-hover:bg-primary transition-colors" />
                    <p className="text-sm text-text-light group-hover:text-text leading-relaxed">
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {activeView === 'structured' && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div 
                  className="bg-surface/30 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap leading-relaxed text-text-light"
                  dangerouslySetInnerHTML={{ __html: notes.structuredNotes }} // Or use a markdown parser
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Exam Highlights Footer */}
      {notes.examHighlights?.length > 0 && (
        <div className="p-4 bg-accent/10 border-t border-accent/20 mx-4 my-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-accent ring-4 ring-accent/10 rounded-full" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Exam Highlights</span>
          </div>
          <ul className="space-y-1">
            {notes.examHighlights.map((h, i) => (
              <li key={i} className="text-[11px] text-text-light flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
