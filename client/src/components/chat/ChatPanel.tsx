import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, ActionProposal, QuickPrompt } from '../../models/chat';
import { CalendarEvent } from '../../models/calendar';
import { parseNaturalLanguageCommand } from '../../services/nlpCalendarParser';
import { TypingDots } from './TypingDots';
import { ActionCard } from './ActionCard';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Calendar,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';

interface ChatPanelProps {
  onCommitAction: (proposal: ActionProposal) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'p1',
    title: '📅 Meet with Sarah',
    prompt: 'Book a 1:1 sync with Sarah tomorrow at 3pm for 45 mins',
  },
  {
    id: 'p2',
    title: '🎨 Design Review',
    prompt: 'Schedule Design Critique this Friday at 11am with alex@design.co',
  },
  {
    id: 'p3',
    title: '🔍 Today’s Agenda',
    prompt: "What's on my schedule for today?",
  },
  {
    id: 'p4',
    title: '❌ Cancel Standup',
    prompt: 'Cancel Sprint Kickoff',
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onCommitAction,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello Sahil! I'm your AI calendar assistant. You can speak naturally to schedule, reschedule, or cancel meetings.",
      timestamp: format(new Date(), 'h:mm a'),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: format(new Date(), 'h:mm a'),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate realistic AI thought processing latency
    setTimeout(() => {
      const result = parseNaturalLanguageCommand(text);

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: result.replyText,
        timestamp: format(new Date(), 'h:mm a'),
        actionProposal: result.actionProposal,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 750);
  };

  const handleConfirmAction = (proposal: ActionProposal) => {
    // 1. Commit action to the calendar
    onCommitAction(proposal);

    // 2. Mark proposal as confirmed in chat history
    setMessages((prev) =>
      prev.map((m) => {
        if (m.actionProposal?.id === proposal.id) {
          return {
            ...m,
            actionProposal: {
              ...m.actionProposal,
              status: 'confirmed',
            },
          };
        }
        return m;
      })
    );

    // 3. Assistant confirmation follow-up
    setTimeout(() => {
      const isCreate = proposal.type === 'create';
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: isCreate
            ? `✅ Done! **${proposal.eventDraft.title}** has been synced to your Google Calendar.`
            : `✅ Done! The event has been removed from your Google Calendar.`,
          timestamp: format(new Date(), 'h:mm a'),
        },
      ]);
    }, 300);
  };

  const handleDismissAction = (proposal: ActionProposal) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.actionProposal?.id === proposal.id) {
          return {
            ...m,
            actionProposal: {
              ...m.actionProposal,
              status: 'dismissed',
            },
          };
        }
        return m;
      })
    );
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How can I help you organize your schedule today?',
        timestamp: format(new Date(), 'h:mm a'),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-surface-base border-l border-borderGlass relative select-none">
      {/* Panel Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-borderGlass bg-surface-darkest/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-surface-darkest" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-1.5">
              Calendar Assistant
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium border border-accent/20">
                AI Live
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">Natural language event scheduler</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearChat}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-surface-elevated transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Message Feed with AnimatePresence & Spring Transitions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 26,
                }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[92%]">
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-surface-elevated border border-borderGlass flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}

                  <div>
                    {/* Text Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-accent text-gray-950 font-medium rounded-tr-sm shadow-glow-sm'
                          : 'bg-surface-elevated border border-borderGlass text-gray-100 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {message.text}
                    </div>

                    {/* Action proposal confirmation card if present */}
                    {message.actionProposal && (
                      <ActionCard
                        proposal={message.actionProposal}
                        onConfirm={handleConfirmAction}
                        onDismiss={handleDismissAction}
                      />
                    )}

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] text-gray-500 mt-1 block px-1 ${
                        isUser ? 'text-right' : 'text-left'
                      }`}
                    >
                      {message.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-surface-elevated border border-borderGlass flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading typing dots */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-start gap-2"
            >
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-borderGlass/50 bg-surface-darkest/40">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
            Quick Prompts
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PROMPTS.map((qp) => (
            <motion.button
              key={qp.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSendMessage(qp.prompt)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-xl bg-surface-card border border-borderGlass text-gray-300 hover:text-white hover:border-accent/40 hover:bg-surface-elevated transition-all"
            >
              {qp.title}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input Box Bar */}
      <div className="p-3.5 border-t border-borderGlass bg-surface-darkest/90 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a request (e.g. 'meet Sarah tomorrow 3pm')..."
            className="w-full pl-4 pr-12 py-2.5 bg-surface-card border border-borderGlass rounded-2xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 glow-green-focus transition-all"
          />

          <motion.button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            whileHover={inputText.trim() ? { scale: 1.08 } : undefined}
            whileTap={inputText.trim() ? { scale: 0.92 } : undefined}
            className={`absolute right-1.5 p-2 rounded-xl transition-all ${
              inputText.trim() && !isTyping
                ? 'bg-accent text-gray-950 shadow-glow-sm hover:bg-accent-light'
                : 'text-gray-600 bg-surface-elevated cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
