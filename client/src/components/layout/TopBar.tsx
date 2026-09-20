import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import {
  Calendar as CalendarIcon,
  Sparkles,
  LogOut,
  ChevronDown,
  CheckCircle,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

interface TopBarProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isChatOpen, onToggleChat }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 px-4 md:px-6 border-b border-borderGlass bg-surface-darkest/90 backdrop-blur-md flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.05 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/20 via-surface-card to-accent/30 border border-accent/40 flex items-center justify-center shadow-glow-sm"
        >
          <CalendarIcon className="w-5 h-5 text-accent" />
        </motion.div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
              CalendarMeet<span className="text-accent">.ai</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-card border border-borderGlass text-[10px] font-medium text-accent">
              <Sparkles className="w-3 h-3" />
              v1.0
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-gray-400">
            Intelligent Google Calendar Assistant
          </p>
        </div>
      </div>

      {/* Right Side: Connection Status + Chat Toggle + Google Account Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Connected Status Indicator with Pulsing Green Dot */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-borderGlass text-xs text-gray-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent shadow-[0_0_8px_rgba(34,197,94,0.9)]" />
          </span>
          <span className="hidden sm:inline font-medium text-gray-300 text-[11px]">
            Google Calendar
          </span>
          <span className="text-[11px] text-accent font-semibold">Connected</span>
        </div>

        {/* Chat Drawer Toggle (Useful for mobile / compact screens) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleChat}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            isChatOpen
              ? 'bg-accent/15 border-accent/40 text-accent shadow-glow-sm'
              : 'bg-surface-card border-borderGlass text-gray-300 hover:text-white'
          }`}
          title="Toggle Chat Assistant"
        >
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="hidden sm:inline">AI Chat</span>
          {isChatOpen ? (
            <PanelRightClose className="w-3.5 h-3.5 hidden lg:block opacity-70" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5 hidden lg:block opacity-70" />
          )}
        </motion.button>

        {/* Google Account Profile & Dropdown */}
        {user && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl bg-surface-card border border-borderGlass hover:border-borderGlass-light transition-all"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-accent/40"
              />
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-gray-200 leading-tight">
                  {user.name}
                </span>
                <span className="block text-[10px] text-gray-400 leading-tight truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </motion.button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-card border border-borderGlass-light shadow-glass p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-borderGlass mb-1">
                    <p className="text-xs font-semibold text-gray-100">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-accent">
                      <CheckCircle className="w-3 h-3" />
                      Google Workspace Synced
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
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
