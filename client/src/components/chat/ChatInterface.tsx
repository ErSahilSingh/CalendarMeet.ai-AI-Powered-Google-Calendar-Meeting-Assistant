import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, ChatMessage, ActionProposal, SyncedMeeting } from '../../services/api';
import { MessageBubble } from './MessageBubble';
import { TypingDots } from './TypingDots';
import {
  Send,
  Sparkles,
  Zap,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ChatInterfaceProps {
  onMeetingSynced: () => void;
}

const QUICK_PROMPTS = [
  {
    title: '📅 1:1 with Sarah',
    prompt: 'Schedule a 1:1 meeting with sarah@company.com tomorrow at 3pm',
  },
  {
    title: '🎨 Design Review',
    prompt: 'Book design review with alex@design.co this Friday at 11am for 45 mins',
  },
  {
    title: '☕ Coffee Chat',
    prompt: 'Set up coffee catch-up with david@team.org on Monday at 10am',
  },
  {
    title: '📊 Sprint Planning',
    prompt: 'Schedule team sprint planning with team@acme.com tomorrow at 10am',
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onMeetingSynced }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load initial chat history from backend
    api.getChatHistory().then((history) => {
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            id: 'msg-welcome',
            sender: 'assistant',
            text: `Hello! I'm your AI Calendar assistant.\n\nType naturally to schedule meetings with anyone. I will create the meeting on your actual Google Calendar and send email invites to the attendee!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    setErrorMsg(null);
    setInput('');

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const response = await api.sendMessage(text);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to backend server');
      // Fallback response if offline
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Network error connecting to backend API. Please make sure the server is running on http://localhost:5000.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleConfirmProposal = async (proposal: ActionProposal): Promise<SyncedMeeting | void> => {
    try {
      const result = await api.confirmBooking(proposal);

      // Update proposal state in chat message
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.actionProposal?.id === proposal.id) {
            return {
              ...msg,
              actionProposal: {
                ...msg.actionProposal,
                status: 'confirmed',
                meetingDraft: {
                  ...msg.actionProposal.meetingDraft,
                  htmlLink: result.meeting.htmlLink,
                  meetLink: result.meeting.meetLink,
                },
              },
            };
          }
          return msg;
        })
      );

      // Assistant confirmation message
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-confirmed-${Date.now()}`,
            sender: 'assistant',
            text: `🎉 Meeting **${result.meeting.title}** has been synced with your Google Calendar!\n\nEmail invites were sent to **${result.meeting.attendeeEmail}** and **${result.meeting.hostEmail}**.\n\nYou can click below to open the event in your Google Calendar or join the Google Meet call.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 400);

      onMeetingSynced();
      return result.meeting;
    } catch (err: any) {
      setErrorMsg(`Failed to sync with Google Calendar: ${err.message}`);
    }
  };

  const handleDismissProposal = (proposal: ActionProposal) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.actionProposal?.id === proposal.id) {
          return {
            ...msg,
            actionProposal: {
              ...msg.actionProposal,
              status: 'dismissed',
            },
          };
        }
        return msg;
      })
    );
  };

  const handleClearHistory = async () => {
    await api.clearChatHistory();
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How can I help you organize your meetings today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-darkest select-none overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accent/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-2 custom-scroll z-10 max-w-4xl w-full mx-auto">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onConfirmProposal={handleConfirmProposal}
              onDismissProposal={handleDismissProposal}
            />
          ))}
        </AnimatePresence>

        {/* Typing Dots Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="mb-4"
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Container: Quick Prompts + Input Bar */}
      <div className="border-t border-borderGlass bg-surface-darkest/95 backdrop-blur-xl z-20 shrink-0 max-w-4xl w-full mx-auto px-4 md:px-8 pb-4 pt-2">
        {/* Quick Prompts Bar */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" />
              Suggested Meeting Prompts
            </span>
            <button
              onClick={handleClearHistory}
              className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              title="Clear message thread"
            >
              <Trash2 className="w-3 h-3" />
              Clear Chat
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_PROMPTS.map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSend(item.prompt)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-surface-card border border-borderGlass text-gray-300 hover:text-white hover:border-accent/40 hover:bg-surface-elevated transition-all"
              >
                {item.title}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Text Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a request (e.g. 'Schedule a 1:1 with sarah@company.com tomorrow 3pm')..."
            className="w-full pl-4 pr-12 py-3.5 bg-surface-card border border-borderGlass rounded-2xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 glow-green-focus transition-all shadow-sm"
          />

          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            whileHover={input.trim() ? { scale: 1.08 } : undefined}
            whileTap={input.trim() ? { scale: 0.92 } : undefined}
            className={`absolute right-2 p-2 rounded-xl transition-all ${
              input.trim() && !isTyping
                ? 'bg-accent text-gray-950 shadow-glow-sm hover:bg-accent-light'
                : 'text-gray-600 bg-surface-elevated cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>

        <p className="text-center text-[11px] text-gray-500 mt-2">
          Meetings confirmed here are dispatched via BullMQ and added to your genuine Google Calendar.
        </p>
      </div>
    </div>
  );
};
