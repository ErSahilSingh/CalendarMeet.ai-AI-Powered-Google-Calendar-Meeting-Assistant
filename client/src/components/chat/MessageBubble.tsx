import React from 'react';
import { motion } from 'motion/react';
import { ChatMessage, ActionProposal, SyncedMeeting } from '../../services/api';
import { MeetingProposalCard } from './MeetingProposalCard';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onConfirmProposal: (proposal: ActionProposal) => Promise<SyncedMeeting | void>;
  onDismissProposal?: (proposal: ActionProposal) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onConfirmProposal,
  onDismissProposal,
}) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}
    >
      <div className={`flex items-start gap-2.5 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
            isUser
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-surface-elevated border-borderGlass text-gray-300 shadow-sm'
          }`}
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4 text-accent" />}
        </div>

        {/* Bubble Text */}
        <div className="flex flex-col">
          <div
            className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-accent text-gray-950 font-medium rounded-tr-sm shadow-glow-sm'
                : 'bg-surface-elevated/90 border border-borderGlass text-gray-100 rounded-tl-sm shadow-sm'
            }`}
          >
            {message.text}
          </div>

          {/* Render Action Proposal if assistant proposed a meeting */}
          {message.actionProposal && (
            <MeetingProposalCard
              proposal={message.actionProposal}
              onConfirm={onConfirmProposal}
              onDismiss={onDismissProposal}
            />
          )}

          {/* Timestamp */}
          <span
            className={`text-[10px] text-gray-500 mt-1 px-1 ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {message.timestamp}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
