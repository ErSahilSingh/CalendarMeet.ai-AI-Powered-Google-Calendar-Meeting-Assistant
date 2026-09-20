import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service.js';
import { ChatLogModel, inMemoryChatLogs, IChatMessage } from '../models/ChatLog.js';
import { MeetingModel, inMemoryMeetings } from '../models/Meeting.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_calendar_meet_2026';

function getUserFromReq(req: Request): any {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.token;
  if (token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  return {
    userId: 'usr_default',
    email: 'user@example.com',
    name: 'Calendar User',
  };
}

/**
 * Handle incoming conversational chat message
 */
router.post('/message', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const user = getUserFromReq(req);

  // Retrieve user's existing meetings for context
  let meetings: any[] = [];
  try {
    meetings = await MeetingModel.find({ userId: user.userId, status: { $ne: 'cancelled' } });
  } catch {
    meetings = Array.from(inMemoryMeetings.values()).filter((m) => m.userId === user.userId);
  }

  // Process prompt via Gemini (or intelligent fallback)
  const result = await GeminiService.processChat(message, user.email, meetings);

  const userMsg: IChatMessage = {
    id: `msg-${uuidv4()}`,
    sender: 'user',
    text: message.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const assistantMsg: IChatMessage = {
    id: `msg-${uuidv4()}`,
    sender: 'assistant',
    text: result.replyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionProposal: result.actionProposal,
  };

  // Persist messages in ChatLog
  try {
    await ChatLogModel.findOneAndUpdate(
      { userId: user.userId },
      { $push: { messages: { $each: [userMsg, assistantMsg] } } },
      { upsert: true }
    );
  } catch {
    const existing = inMemoryChatLogs.get(user.userId) || [];
    existing.push(userMsg, assistantMsg);
    inMemoryChatLogs.set(user.userId, existing);
  }

  res.json({
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    actionProposal: result.actionProposal,
  });
});

/**
 * Retrieve chat history for the user
 */
router.get('/history', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);

  try {
    const log = await ChatLogModel.findOne({ userId: user.userId });
    if (log && log.messages.length > 0) {
      return res.json({ messages: log.messages });
    }
  } catch {}

  const inMemory = inMemoryChatLogs.get(user.userId);
  if (inMemory && inMemory.length > 0) {
    return res.json({ messages: inMemory });
  }

  // Default welcome message if empty
  const defaultWelcome: IChatMessage = {
    id: 'msg-welcome-0',
    sender: 'assistant',
    text: `Hello ${user.name.split(' ')[0]}! I'm your AI Calendar assistant.\n\nAsk me to schedule a meeting with anyone by email, for example:\n• *"Schedule a 30-minute sync with sarah@company.com tomorrow at 3pm"*\n• *"Book architecture review with alex@team.org this Friday at 11am"*`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  res.json({ messages: [defaultWelcome] });
});

/**
 * Clear chat history
 */
router.delete('/history', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  try {
    await ChatLogModel.findOneAndDelete({ userId: user.userId });
  } catch {}
  inMemoryChatLogs.delete(user.userId);
  res.json({ success: true });
});

export default router;
