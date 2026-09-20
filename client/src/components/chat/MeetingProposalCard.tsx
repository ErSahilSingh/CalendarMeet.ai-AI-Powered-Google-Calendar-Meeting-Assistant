import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ActionProposal, SyncedMeeting } from '../../services/api';
import {
  Calendar,
  Clock,
  Mail,
  User,
  Video,
  CheckCircle2,
  ExternalLink,
  Loader2,
  CalendarCheck,
  X,
} from 'lucide-react';

interface MeetingProposalCardProps {
  proposal: ActionProposal;
  onConfirm: (proposal: ActionProposal) => Promise<SyncedMeeting | void>;
  onDismiss?: (proposal: ActionProposal) => void;
}

export const MeetingProposalCard: React.FC<MeetingProposalCardProps> = ({
  proposal,
  onConfirm,
  onDismiss,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncedMeeting, setSyncedMeeting] = useState<SyncedMeeting | null>(null);
  const [isDismissed, setIsDismissed] = useState(proposal.status === 'dismissed');

  const draft = proposal.meetingDraft;
  const startDate = new Date(draft.startTime);
  const endDate = new Date(draft.endTime);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await onConfirm(proposal);
      if (res) {
        setSyncedMeeting(res);
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDismissed) {
    return (
      <div className="mt-2 px-3 py-1.5 rounded-xl bg-surface-card border border-borderGlass text-xs text-gray-500 italic">
        Meeting proposal discarded
      </div>
    );
  }

  const isConfirmed = proposal.status === 'confirmed' || !!syncedMeeting;
  const gEventLink = syncedMeeting?.htmlLink || draft.htmlLink || 'https://calendar.google.com';
  const meetLink = syncedMeeting?.meetLink || draft.meetLink;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={`mt-3 overflow-hidden rounded-2xl border transition-all ${
        isConfirmed
          ? 'bg-surface-card border-accent/40 shadow-glow-sm'
          : 'bg-surface-elevated/90 border-borderGlass-light shadow-glass'
      } p-4 max-w-md w-full`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-borderGlass/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent block">
              {isConfirmed ? 'Google Calendar Synced' : 'Ready to Schedule'}
            </span>
            <h4 className="text-sm font-semibold text-white tracking-tight">{draft.title}</h4>
          </div>
        </div>

        {isConfirmed ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold border border-accent/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Added
          </span>
        ) : (
          onDismiss && (
            <button
              onClick={() => {
                setIsDismissed(true);
                onDismiss(proposal);
              }}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-surface-card transition-colors"
              title="Discard"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Meeting Details Body */}
      <div className="py-3 space-y-2 text-xs">
        {/* Date & Time */}
        <div className="flex items-center gap-2.5 text-gray-300">
          <Clock className="w-4 h-4 text-accent shrink-0" />
          <span className="font-medium text-gray-200">
            {formatDate(startDate)} · {formatTime(startDate)} – {formatTime(endDate)}
          </span>
        </div>

        {/* Host Email */}
        <div className="flex items-center gap-2.5 text-gray-400">
          <User className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="truncate">
            <strong className="text-gray-300">Host (You):</strong> {draft.hostEmail}
          </span>
        </div>

        {/* Attendee Email */}
        <div className="flex items-center gap-2.5 text-gray-400">
          <Mail className="w-4 h-4 text-accent-light shrink-0" />
          <span className="truncate">
            <strong className="text-gray-300">Attendee:</strong>{' '}
            <span className="text-accent-light font-medium bg-accent/10 px-1.5 py-0.5 rounded">
              {draft.attendeeEmail}
            </span>
          </span>
        </div>

        {/* Google Meet link preview */}
        <div className="flex items-center gap-2.5 text-gray-400">
          <Video className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Google Meet (auto-generated conference)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-borderGlass/60 flex items-center justify-between gap-2">
        {isConfirmed ? (
          <div className="w-full flex flex-wrap items-center gap-2">
            <a
              href={gEventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent text-gray-950 font-semibold text-xs hover:bg-accent-light transition-all shadow-glow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Google Calendar
            </a>

            {meetLink && (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-elevated border border-borderGlass text-cyan-300 font-semibold text-xs hover:bg-surface-hover transition-all"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                Join Meet
              </a>
            )}
          </div>
        ) : (
          <div className="w-full flex items-center justify-end gap-2">
            {onDismiss && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss(proposal);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                Discard
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 18px -2px rgba(34, 197, 94, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-gray-950 font-semibold text-xs hover:bg-accent-light transition-all shadow-glow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing Google Calendar...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm & Add to Google Calendar</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
