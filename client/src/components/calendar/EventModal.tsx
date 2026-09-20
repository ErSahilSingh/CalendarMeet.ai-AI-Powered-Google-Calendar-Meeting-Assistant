import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent } from '../../models/calendar';
import { X, Calendar, Clock, MapPin, Users, Video, Trash2, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  initialEvent?: CalendarEvent | null;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialDate,
  initialEvent,
}) => {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('10:00');
  const [endTimeStr, setEndTimeStr] = useState('11:00');
  const [location, setLocation] = useState('Google Meet');
  const [attendeesStr, setAttendeesStr] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      const start = parseISO(initialEvent.startTime);
      const end = parseISO(initialEvent.endTime);
      setDateStr(format(start, 'yyyy-MM-dd'));
      setStartTimeStr(format(start, 'HH:mm'));
      setEndTimeStr(format(end, 'HH:mm'));
      setLocation(initialEvent.location || 'Google Meet');
      setAttendeesStr(initialEvent.attendees ? initialEvent.attendees.join(', ') : '');
      setDescription(initialEvent.description || '');
    } else {
      const target = initialDate || new Date();
      setTitle('');
      setDateStr(format(target, 'yyyy-MM-dd'));
      setStartTimeStr('10:00');
      setEndTimeStr('11:00');
      setLocation('Google Meet');
      setAttendeesStr('');
      setDescription('');
    }
  }, [initialEvent, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const [year, month, day] = dateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);

    const attendees = attendeesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newEvent: CalendarEvent = {
      id: initialEvent ? initialEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      location: location.trim(),
      meetUrl: location.toLowerCase().includes('meet')
        ? initialEvent?.meetUrl || `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
        : undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      status: 'confirmed',
      colorTag: 'emerald',
    };

    onSave(newEvent);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface-darkest/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-lg bg-surface-card border border-borderGlass-light rounded-2xl shadow-glass overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-borderGlass">
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {initialEvent ? 'Edit Calendar Event' : 'New Calendar Event'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design System Review"
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-borderGlass rounded-xl text-sm text-gray-100 placeholder-gray-500 glow-green-focus transition-all"
                autoFocus
              />
            </div>

            {/* Date and Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-borderGlass rounded-xl text-xs text-gray-200 glow-green-focus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Start
                </label>
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-borderGlass rounded-xl text-xs text-gray-200 glow-green-focus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  End
                </label>
                <input
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-borderGlass rounded-xl text-xs text-gray-200 glow-green-focus"
                />
              </div>
            </div>

            {/* Location & Video Conferencing */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Location / Conference
                </span>
                <button
                  type="button"
                  onClick={() => setLocation('Google Meet')}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                >
                  <Video className="w-3 h-3" />
                  Use Google Meet
                </button>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Google Meet or Room name"
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-borderGlass rounded-xl text-sm text-gray-100 placeholder-gray-500 glow-green-focus transition-all"
              />
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                Attendees (comma separated)
              </label>
              <input
                type="text"
                value={attendeesStr}
                onChange={(e) => setAttendeesStr(e.target.value)}
                placeholder="sarah@company.com, david@company.com"
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-borderGlass rounded-xl text-sm text-gray-100 placeholder-gray-500 glow-green-focus transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes / Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agenda, discussion points..."
                className="w-full px-3.5 py-2 bg-surface-elevated border border-borderGlass rounded-xl text-sm text-gray-100 placeholder-gray-500 glow-green-focus resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-borderGlass mt-4">
              {initialEvent && onDelete ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onDelete(initialEvent.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </motion.button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 16px -2px rgba(34, 197, 94, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-xl bg-accent text-gray-950 font-semibold text-xs flex items-center gap-1.5 hover:bg-accent-light transition-all shadow-glow-sm"
                >
                  <Check className="w-4 h-4" />
                  {initialEvent ? 'Save Changes' : 'Create Event'}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
