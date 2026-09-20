import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './TopBar';
import { CalendarView } from '../calendar/CalendarView';
import { ChatPanel } from '../chat/ChatPanel';
import { CalendarEvent } from '../../models/calendar';
import { ActionProposal } from '../../models/chat';
import { calendarStorage } from '../../services/calendarStorage';

export const AppShell: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Load initial events from storage
  useEffect(() => {
    setEvents(calendarStorage.getEvents());

    // Listen for storage events across components
    const handleStorageUpdate = () => {
      setEvents(calendarStorage.getEvents());
    };
    window.addEventListener('calendar_events_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('calendar_events_updated', handleStorageUpdate);
    };
  }, []);

  const handleAddEvent = (newEvent: CalendarEvent) => {
    const updated = calendarStorage.addEvent(newEvent);
    setEvents(updated);
  };

  const handleUpdateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const updated = calendarStorage.updateEvent(id, updates);
    setEvents(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = calendarStorage.deleteEvent(id);
    setEvents(updated);
  };

  const handleResetEvents = () => {
    const reset = calendarStorage.resetDefaults();
    setEvents(reset);
  };

  const handleCommitAction = (proposal: ActionProposal) => {
    if (proposal.type === 'create') {
      handleAddEvent(proposal.eventDraft);
    } else if (proposal.type === 'cancel' && proposal.targetEventId) {
      handleDeleteEvent(proposal.targetEventId);
    } else if (proposal.type === 'reschedule' && proposal.targetEventId) {
      handleUpdateEvent(proposal.targetEventId, proposal.eventDraft);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-col h-screen w-screen bg-surface-darkest overflow-hidden text-gray-100"
    >
      {/* Top Bar with Profile & Status */}
      <TopBar
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Main Workspace Layout Grid */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Main Area: Calendar View */}
        <section className="flex-1 h-full min-w-0 flex flex-col overflow-hidden">
          <CalendarView
            events={events}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onResetEvents={handleResetEvents}
          />
        </section>

        {/* Right Side: Chat Assistant Panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: '380px', opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="h-full shrink-0 border-l border-borderGlass relative z-20 hidden md:block overflow-hidden"
            >
              <div className="w-[380px] h-full">
                <ChatPanel onCommitAction={handleCommitAction} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Chat Drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-x-0 bottom-0 top-16 z-40 bg-surface-darkest md:hidden border-t border-borderGlass shadow-2xl"
            >
              <ChatPanel
                onCommitAction={handleCommitAction}
                isOpenMobile={isChatOpen}
                onCloseMobile={() => setIsChatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};
