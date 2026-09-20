import React from 'react';
import { motion } from 'motion/react';
import { CalendarEvent } from '../../models/calendar';
import { Clock, Video, MapPin, Users, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EventCardProps {
  event: CalendarEvent;
  isCompact?: boolean;
  isInChatPreview?: boolean;
  onDelete?: (id: string) => void;
  onClick?: (event: CalendarEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isCompact = false,
  isInChatPreview = false,
  onDelete,
  onClick,
}) => {
  const startDate = parseISO(event.startTime);
  const endDate = parseISO(event.endTime);

  const formatTime = (date: Date) => format(date, 'h:mm a');
  const formatDate = (date: Date) => format(date, 'EEE, MMM d');

  const isConfirmed = event.status === 'confirmed';
  const isCancelled = event.status === 'cancelled';

  // Determine accent border and badge styles
  const borderAccent = isCancelled
    ? 'border-l-rose-500/70 border-rose-500/30'
    : 'border-l-accent border-l-[3.5px]';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
        mass: 0.8,
      }}
      whileHover={
        !isInChatPreview
          ? {
              scale: 1.015,
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5), 0 0 16px -2px rgba(34, 197, 94, 0.15)',
              transition: { type: 'spring', stiffness: 400, damping: 25 },
            }
          : undefined
      }
      onClick={() => onClick?.(event)}
      className={`group relative overflow-hidden rounded-xl bg-surface-card border border-borderGlass ${borderAccent} p-3.5 transition-colors cursor-pointer select-none ${
        isInChatPreview ? 'bg-surface-elevated/90 shadow-glass' : 'hover:bg-surface-hover/70'
      }`}
    >
      {/* Subtle top-right ambient glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-all duration-300" />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Title & Status indicator */}
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="font-semibold text-gray-100 text-sm tracking-tight truncate group-hover:text-white">
              {event.title}
            </h4>
            {isConfirmed && (
              <span className="inline-flex items-center text-accent shrink-0" title="Confirmed in Google Calendar">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center text-rose-400 shrink-0" title="Cancelled">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Time and Date metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1 text-accent-light/90 font-medium">
              <Clock className="w-3 h-3 text-accent" />
              {isInChatPreview ? `${formatDate(startDate)} · ` : ''}
              {formatTime(startDate)} – {formatTime(endDate)}
            </span>

            {event.location && !isCompact && (
              <span className="flex items-center gap-1 truncate max-w-[140px] text-gray-400">
                {event.location.toLowerCase().includes('meet') ? (
                  <Video className="w-3 h-3 text-cyan-400" />
                ) : (
                  <MapPin className="w-3 h-3 text-gray-400" />
                )}
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && !isCompact && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-gray-500 shrink-0" />
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {event.attendees.slice(0, 3).map((attendee, idx) => {
                  const initial = attendee.charAt(0).toUpperCase();
                  return (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-full bg-surface-elevated border border-borderGlass flex items-center justify-center text-[10px] font-medium text-gray-300"
                      title={attendee}
                    >
                      {initial}
                    </div>
                  );
                })}
              </div>
              {event.attendees.length > 3 && (
                <span className="text-[10px] text-gray-500 font-medium">
                  +{event.attendees.length - 3}
                </span>
              )}
              <span className="text-[11px] text-gray-400 truncate max-w-[150px]">
                {event.attendees[0].split('@')[0]}
                {event.attendees.length > 1 ? ` & ${event.attendees.length - 1} other` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Delete action button on hover */}
        {onDelete && !isInChatPreview && (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Delete Event"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};
