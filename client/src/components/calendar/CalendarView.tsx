import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent, CalendarViewMode } from '../../models/calendar';
import { EventCard } from './EventCard';
import { EventModal } from './EventModal';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isToday as isDateToday,
  addWeeks,
  subWeeks,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onResetEvents?: () => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM (20:00)

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onResetEvents,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date>(new Date());

  // Week start: Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Display days depending on view mode
  const displayedDays = viewMode === 'week' ? weekDays : [currentDate];

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const target = new Date(date);
    target.setHours(hour, 0, 0, 0);
    setModalInitialDate(target);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCardClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Helper to calculate top position and height for events within the day column
  const getEventStyle = (event: CalendarEvent) => {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    // Base grid starts at 8:00 AM (480 minutes)
    const gridStartMinutes = 8 * 60;
    const totalGridMinutes = 12 * 60; // 8 AM to 8 PM (720 minutes)

    const topPercent = Math.max(0, ((startMinutes - gridStartMinutes) / totalGridMinutes) * 100);
    const durationMinutes = Math.max(30, endMinutes - startMinutes);
    const heightPercent = Math.min(100 - topPercent, (durationMinutes / totalGridMinutes) * 100);

    return {
      top: `${topPercent}%`,
      height: `${Math.max(4.5, heightPercent)}%`,
    };
  };

  // Current time position indicator
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const gridStartMinutes = 8 * 60;
  const totalGridMinutes = 12 * 60;
  const currentTimePercent = ((currentMinutes - gridStartMinutes) / totalGridMinutes) * 100;
  const showCurrentTimeLine = currentTimePercent >= 0 && currentTimePercent <= 100;

  return (
    <div className="flex flex-col h-full bg-surface-darkest select-none overflow-hidden">
      {/* Calendar Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-borderGlass bg-surface-darkest/90 backdrop-blur-md shrink-0">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-surface-card border border-borderGlass p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-surface-elevated transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-gray-200 hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Today
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-surface-elevated transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" />
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Week / Day View Toggle */}
          <div className="flex items-center rounded-xl bg-surface-card border border-borderGlass p-1 text-xs font-medium">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-accent/20 text-accent font-semibold shadow-glow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-accent/20 text-accent font-semibold shadow-glow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Day
            </button>
          </div>

          {/* Reset Demo Data Button */}
          {onResetEvents && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onResetEvents}
              className="p-2 rounded-xl bg-surface-card border border-borderGlass text-gray-400 hover:text-gray-200 hover:bg-surface-elevated transition-colors"
              title="Reset Sample Calendar Events"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}

          {/* New Event Button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 16px -2px rgba(34, 197, 94, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedEvent(null);
              setModalInitialDate(new Date());
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent text-gray-950 text-xs font-semibold hover:bg-accent-light transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </motion.button>
        </div>
      </div>

      {/* Main Grid Header: Day Columns */}
      <div className="grid grid-cols-[60px_repeat(auto-fit,_minmax(0,_1fr))] border-b border-borderGlass bg-surface-darkest/95 shrink-0 pr-2">
        {/* Time gutter spacer */}
        <div className="py-2.5 text-center text-[11px] font-medium text-gray-500 border-r border-borderGlass">
          GMT
        </div>

        {/* Days Header */}
        <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} flex-1 divide-x divide-borderGlass`}>
          {displayedDays.map((day, idx) => {
            const isToday = isDateToday(day);
            return (
              <div
                key={idx}
                className={`py-2 px-2 text-center transition-colors ${
                  isToday ? 'bg-accent/5' : ''
                }`}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 block">
                  {format(day, 'EEE')}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 mt-0.5 rounded-full text-xs font-semibold transition-all ${
                    isToday
                      ? 'bg-accent text-gray-950 shadow-glow-sm'
                      : 'text-gray-200 hover:bg-surface-elevated'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Hourly Time Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scroll">
        <div className="grid grid-cols-[60px_repeat(auto-fit,_minmax(0,_1fr))] min-h-[720px] relative">
          {/* Time Labels Column */}
          <div className="divide-y divide-borderGlass/50 border-r border-borderGlass bg-surface-darkest/40">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-[11px] font-medium text-gray-500 pr-2.5 pt-1 text-right select-none"
              >
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Days Grid Columns */}
          <div
            className={`grid ${
              viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'
            } flex-1 divide-x divide-borderGlass/50 relative`}
          >
            {/* Current Time Horizontal Line (if visible today) */}
            {showCurrentTimeLine && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                style={{ top: `${currentTimePercent}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <div className="flex-1 border-t-2 border-rose-500/80" />
              </div>
            )}

            {displayedDays.map((day, dayIndex) => {
              const isToday = isDateToday(day);
              // Filter events that fall on this day
              const dayEvents = events.filter((evt) =>
                isSameDay(parseISO(evt.startTime), day)
              );

              return (
                <div
                  key={dayIndex}
                  className={`relative divide-y divide-borderGlass/30 ${
                    isToday ? 'bg-accent/[0.015]' : ''
                  }`}
                >
                  {/* Background hour slots for clicking */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => handleSlotClick(day, hour)}
                      className="h-[60px] hover:bg-surface-elevated/30 transition-colors cursor-pointer group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 text-[10px] text-accent/60 pl-2 pt-1 select-none">
                        + Add event
                      </div>
                    </div>
                  ))}

                  {/* Render Day's Events with Motion layout */}
                  <div className="absolute inset-0 px-1 pointer-events-none">
                    <AnimatePresence>
                      {dayEvents.map((evt) => {
                        const style = getEventStyle(evt);
                        return (
                          <div
                            key={evt.id}
                            style={{
                              position: 'absolute',
                              top: style.top,
                              height: style.height,
                              left: '4px',
                              right: '4px',
                            }}
                            className="pointer-events-auto z-10"
                          >
                            <EventCard
                              event={evt}
                              isCompact={viewMode === 'week'}
                              onClick={handleCardClick}
                              onDelete={onDeleteEvent}
                            />
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct Add / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(savedEvent) => {
          if (selectedEvent) {
            onUpdateEvent(savedEvent.id, savedEvent);
          } else {
            onAddEvent(savedEvent);
          }
        }}
        onDelete={onDeleteEvent}
        initialDate={modalInitialDate}
        initialEvent={selectedEvent}
      />
    </div>
  );
};
