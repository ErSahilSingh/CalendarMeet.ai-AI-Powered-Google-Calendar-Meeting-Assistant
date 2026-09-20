import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatTopBar } from './components/layout/ChatTopBar';
import { ChatInterface } from './components/chat/ChatInterface';
import { MeetingsSidebar } from './components/sidebar/MeetingsSidebar';
import { api, SyncedMeeting } from './services/api';
import { motion } from 'motion/react';
import { Calendar, Loader2 } from 'lucide-react';

const AppMain: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [meetings, setMeetings] = useState<SyncedMeeting[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadMeetings = async () => {
    try {
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [user]);

  const handleDeleteMeeting = async (id: string) => {
    try {
      await api.deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-surface-darkest flex flex-col items-center justify-center select-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-glow-md mb-4"
        >
          <Calendar className="w-7 h-7" />
        </motion.div>
        <span className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          Connecting to CalendarMeet.ai...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-surface-darkest text-gray-100 overflow-hidden font-sans">
      {/* Top Bar with Google OAuth connection status and Calendar direct link */}
      <ChatTopBar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        meetingsCount={meetings.length}
      />

      {/* Main Dedicated Chat Interface Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <ChatInterface onMeetingSynced={loadMeetings} />

        {/* Collapsible Synced Meetings Drawer */}
        <MeetingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          meetings={meetings}
          onRefresh={loadMeetings}
          onDeleteMeeting={handleDeleteMeeting}
        />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppMain />
    </AuthProvider>
  );
};

export default App;
