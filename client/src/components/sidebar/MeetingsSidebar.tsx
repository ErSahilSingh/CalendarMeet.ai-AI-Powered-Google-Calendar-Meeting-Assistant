import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SyncedMeeting } from '../../services/api';
import {
  Calendar,
  Clock,
  Mail,
  Video,
  ExternalLink,
  Trash2,
  X,
  CalendarCheck2,
  RefreshCw,
} from 'lucide-react';

interface MeetingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: SyncedMeeting[];
  onRefresh: () => void;
  onDeleteMeeting: (id: string) => Promise<void>;
}

export const MeetingsSidebar: React.FC<MeetingsSidebarProps> = ({
  isOpen,
  onClose,
  meetings,
  onRefresh,
  onDeleteMeeting,
}) => {
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-darkest/70 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-y-0 right-0 w-80 md:w-96 bg-surface-base border-l border-borderGlass z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-borderGlass flex items-center justify-between bg-surface-darkest/80">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-sm text-gray-100">
                  Google Calendar Meetings
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onRefresh}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Link to Google Calendar */}
            <div className="p-3 bg-accent/5 border-b border-borderGlass flex items-center justify-between">
              <span className="text-xs text-gray-300">calendar.google.com</span>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <span>Open Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
              {meetings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-gray-600 mb-2 opacity-50" />
                  <p>No meetings booked yet.</p>
                  <p className="mt-1 text-gray-400">
                    Ask the assistant in chat to schedule a meeting!
                  </p>
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-3 rounded-2xl bg-surface-card border border-borderGlass hover:border-accent/30 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-xs text-gray-100 truncate">
                        {meeting.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium shrink-0 border border-accent/20">
                        Synced
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Clock className="w-3 h-3 text-accent shrink-0" />
                        <span>
                          {formatDate(meeting.startTime)} · {formatTime(meeting.startTime)} –{' '}
                          {formatTime(meeting.endTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Mail className="w-3 h-3 text-accent-light shrink-0" />
                        <span className="truncate">
                          Guest: <span className="text-gray-200">{meeting.attendeeEmail}</span>
                        </span>
                      </div>
                    </div>

                    {/* Links & Delete */}
                    <div className="pt-2 border-t border-borderGlass flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {meeting.htmlLink && (
                          <a
                            href={meeting.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Google Cal
                          </a>
                        )}

                        {meeting.meetLink && (
                          <a
                            href={meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Video className="w-3 h-3" />
                            Meet
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteMeeting(meeting._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-rose-400 transition-all"
                        title="Cancel meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
