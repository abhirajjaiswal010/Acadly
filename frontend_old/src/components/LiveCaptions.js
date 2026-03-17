import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay component for real-time captions on the video stream
 */
const LiveCaptions = ({ captions, isVisible }) => {
  if (!isVisible || !captions || !captions.text) return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-50 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={captions.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-2xl shadow-2xl"
        >
          <p className="text-white text-lg md:text-xl font-medium text-center leading-relaxed">
            {captions.isFinal ? (
              <span className="font-bold text-white drop-shadow-sm">
                {captions.text}
              </span>
            ) : (
              <span className="text-white/80 italic">
                {captions.text}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  |
                </motion.span>
              </span>
            )}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LiveCaptions;
