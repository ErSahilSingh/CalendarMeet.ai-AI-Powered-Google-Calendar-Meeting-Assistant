import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Sparkles,
  ExternalLink,
  CalendarCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface ChatTopBarProps {
  onToggleSidebar: () => void;
  meetingsCount: number;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  onToggleSidebar,
  meetingsCount,
}) => {
  const { user, logout, loginWithGoogle } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 px-4 md:px-6 border-b border-borderGlass bg-surface-darkest/95 backdrop-blur-md flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & App Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/20 via-surface-card to-accent/30 border border-accent/40 flex items-center justify-center shadow-glow-sm">
          <Calendar className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-1">
              CalendarMeet<span className="text-accent">.ai</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-card border border-borderGlass text-[10px] font-medium text-accent">
              <Sparkles className="w-3 h-3" />
              Chat Assistant
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-gray-400">
            AI-powered meeting scheduler with real Google Calendar sync
          </p>
        </div>
      </div>

      {/* Right Side: Google Status, Open Calendar, Meetings Drawer Toggle & Profile */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* Connected Google Calendar Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-borderGlass text-xs text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
          </span>
          <span className="hidden lg:inline text-[11px] text-gray-400">Google Account:</span>
          <span className="text-[11px] text-accent font-semibold truncate max-w-[140px] md:max-w-[180px]">
            {user?.email || 'Connected'}
          </span>
        </div>

        {/* Direct Link to Real Google Calendar */}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-borderGlass text-xs font-semibold text-gray-200 hover:text-white hover:border-accent/40 transition-all shadow-sm"
          title="Open Google Calendar in new tab"
        >
          <span>Google Calendar</span>
          <ExternalLink className="w-3.5 h-3.5 text-accent" />
        </a>

        {/* Synced Meetings Drawer Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggleSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-borderGlass hover:border-borderGlass-light text-xs font-medium text-gray-200 transition-all"
          title="View scheduled Google meetings"
        >
          <CalendarCheck className="w-4 h-4 text-accent" />
          <span className="hidden md:inline">Meetings</span>
          {meetingsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-gray-950 font-bold text-[10px] flex items-center justify-center">
              {meetingsCount}
            </span>
          )}
        </motion.button>

        {/* Profile Avatar & Dropdown */}
        {user && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-card border border-borderGlass hover:border-borderGlass-light transition-all"
            >
              <img
                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-accent/40"
              />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-card border border-borderGlass-light shadow-glass p-2 z-50 text-xs"
                >
                  <div className="px-3 py-2 border-b border-borderGlass mb-1">
                    <p className="font-semibold text-gray-100">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>

                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-200 hover:bg-surface-elevated transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    Open calendar.google.com
                  </a>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      loginWithGoogle();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-accent hover:bg-accent/10 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Connect OAuth Google Account
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};
