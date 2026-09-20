import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const TypingDots: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-elevated/80 border border-borderGlass w-fit max-w-[85%]"
    >
      <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
      </div>
      <div className="flex items-center gap-1.5 px-1 py-0.5">
        <motion.span
          animate={{
            y: [-3, 3, -3],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0,
          }}
          className="w-2 h-2 rounded-full bg-accent"
        />
        <motion.span
          animate={{
            y: [-3, 3, -3],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
          className="w-2 h-2 rounded-full bg-accent"
        />
        <motion.span
          animate={{
            y: [-3, 3, -3],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.4,
          }}
          className="w-2 h-2 rounded-full bg-accent"
        />
      </div>
      <span className="text-xs text-gray-400 font-medium ml-1">AI Assistant is thinking...</span>
    </motion.div>
  );
};
