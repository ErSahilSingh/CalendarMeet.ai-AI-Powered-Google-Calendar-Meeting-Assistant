import React from 'react';
import { motion } from 'motion/react';
import { ActionProposal } from '../../models/chat';
import { EventCard } from '../calendar/EventCard';
import { Check, X, AlertTriangle, CalendarPlus, CalendarX } from 'lucide-react';

interface ActionCardProps {
  proposal: ActionProposal;
  onConfirm: (proposal: ActionProposal) => void;
  onDismiss: (proposal: ActionProposal) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  proposal,
  onConfirm,
  onDismiss,
}) => {
  const isPending = proposal.status === 'pending';
  const isConfirmed = proposal.status === 'confirmed';
  const isDismissed = proposal.status === 'dismissed';

  const isCreate = proposal.type === 'create';
  const isCancel = proposal.type === 'cancel';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="mt-2.5 p-3.5 rounded-2xl bg-surface-elevated/90 border border-borderGlass-light shadow-glass space-y-3"
    >
      {/* Action Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {isCreate ? (
            <span className="flex items-center gap-1.5 text-accent">
              <CalendarPlus className="w-4 h-4" />
              Calendar Proposal Draft
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400">
              <CalendarX className="w-4 h-4" />
              Cancellation Proposal
            </span>
          )}
        </div>

        {/* Status indicator badge */}
        {isConfirmed && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
            <Check className="w-3 h-3" />
            Committed to Calendar
          </span>
        )}
        {isDismissed && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-400 border border-borderGlass">
            <X className="w-3 h-3" />
            Discarded
          </span>
        )}
      </div>

      {/* Embedded Reusable EventCard */}
      <div className="pointer-events-none">
        <EventCard event={proposal.eventDraft} isInChatPreview />
      </div>

      {/* Conflict Warning notice if any */}
      {proposal.conflictDetected && isPending && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>Notice: This slot has a schedule overlap with another event on your calendar.</span>
        </div>
      )}

      {/* Confirmation Actions */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-borderGlass">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDismiss(proposal)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-card transition-colors"
          >
            Discard
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: isCancel
                ? '0 0 16px -2px rgba(244, 63, 94, 0.4)'
                : '0 0 16px -2px rgba(34, 197, 94, 0.4)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onConfirm(proposal)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-glow-sm ${
              isCancel
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-accent text-gray-950 hover:bg-accent-light'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {isCancel ? 'Confirm Cancellation' : 'Confirm Booking'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
