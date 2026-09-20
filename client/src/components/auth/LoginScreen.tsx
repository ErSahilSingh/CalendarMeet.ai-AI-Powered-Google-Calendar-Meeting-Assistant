import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import {
  Calendar,
  Sparkles,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    await loginWithGoogle();
  };

  return (
    <div className="relative min-h-screen w-screen bg-surface-darkest flex flex-col items-center justify-center p-6 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-xl p-8 md:p-10 rounded-3xl bg-surface-card/80 border border-borderGlass-light shadow-glass backdrop-blur-xl"
      >
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent/20 via-surface-elevated to-accent/30 border border-accent/40 flex items-center justify-center shadow-glow-md mb-4"
          >
            <Calendar className="w-7 h-7 text-accent" />
          </motion.div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Calendar Copilot
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            CalendarMeet<span className="text-accent">.ai</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400 max-w-md">
            Schedule meetings, resolve conflicts, and organize your week using natural language commands.
          </p>
        </div>

        {/* Floating preview demo card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 320, damping: 24 }}
          className="mb-8 p-4 rounded-2xl bg-surface-elevated/70 border border-borderGlass space-y-3"
        >
          {/* User query sample */}
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">
              You
            </span>
            <span className="bg-surface-card px-3 py-1.5 rounded-xl border border-borderGlass">
              "Book a 1:1 with Sarah tomorrow at 3pm"
            </span>
          </div>

          {/* AI confirmation preview */}
          <div className="flex items-start gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-accent text-gray-950 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              <Bot className="w-3 h-3" />
            </span>
            <div className="flex-1 p-2.5 rounded-xl bg-surface-card border-l-4 border-l-accent border border-borderGlass space-y-1">
              <div className="flex items-center justify-between font-semibold text-gray-100">
                <span>1:1 Sync with Sarah Chen</span>
                <span className="text-[10px] text-accent font-medium">Auto-Drafted</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1 text-accent-light">
                  <Clock className="w-3 h-3 text-accent" /> Tomorrow, 3:00 PM – 4:00 PM
                </span>
                <span>· Google Meet</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Google Sign-In Action Button */}
        <div className="space-y-4">
          <motion.button
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 24px -2px rgba(34, 197, 94, 0.35)',
            }}
            whileTap={{ scale: 0.98 }}
            disabled={isSigningIn || isLoading}
            onClick={handleSignIn}
            className="w-full py-3.5 px-6 rounded-2xl bg-surface-elevated border border-borderGlass-light hover:border-accent/40 text-gray-100 font-semibold text-sm flex items-center justify-center gap-3 transition-all group relative overflow-hidden shadow-sm"
          >
            {/* Google Colorful Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>

            <span>{isSigningIn ? 'Connecting Google Account...' : 'Continue with Google'}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </motion.button>

          {/* Security & Features badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-2">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              End-to-End Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              Official Google Calendar API
            </span>
          </div>
        </div>
      </motion.div>

      {/* Subtle Footer */}
      <div className="mt-8 text-center text-xs text-gray-600">
        CalendarMeet.ai · React 18 · TypeScript · Motion · Tailwind CSS
      </div>
    </div>
  );
};
