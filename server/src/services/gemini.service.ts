import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface ParsedMeetingAction {
  type: 'create' | 'cancel' | 'list' | 'chat';
  replyText: string;
  actionProposal?: {
    id: string;
    type: 'create' | 'cancel';
    meetingDraft: {
      id?: string;
      title: string;
      description?: string;
      startTime: string; // ISO
      endTime: string;   // ISO
      hostEmail: string;
      attendeeEmail: string;
      meetLink?: string;
      htmlLink?: string;
    };
    status: 'pending';
  };
}

export class GeminiService {
  private static genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

  /**
   * Processes a natural language chat prompt from the user
   */
  static async processChat(
    userMessage: string,
    userEmail: string,
    existingMeetings: any[] = []
  ): Promise<ParsedMeetingAction> {
    const text = userMessage.trim();

    // If Gemini API Key is available, use Gemini 1.5 Flash with Function Calling
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.2,
          },
        });

        const prompt = `
You are an intelligent calendar scheduling assistant. The current user's email is "${userEmail}".
Current time: ${new Date().toISOString()} (Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}).

Analyze the user's request: "${text}"

Instructions:
1. If the user wants to schedule/book a meeting:
   - Extract the meeting title (e.g., "1:1 with Alex", "Project Sync").
   - Extract the attendee's email address. If an email is provided (e.g. "alex@company.com"), use it. If only a name is given (e.g. "Sarah"), generate a plausible email "sarah@company.com".
   - Compute the exact start time and end time in ISO 8601 format. Default duration is 45 minutes if not stated.
   - Return valid JSON matching:
     {
       "action": "schedule",
       "title": "...",
       "attendee_email": "...",
       "start_time": "ISO_STRING",
       "end_time": "ISO_STRING",
       "description": "...",
       "reply": "Friendly response summarizing the meeting details."
     }
2. If the user wants to cancel a meeting:
   - Return JSON:
     {
       "action": "cancel",
       "target": "title or email to cancel",
       "reply": "Friendly response asking for confirmation to cancel."
     }
3. Otherwise, for general questions or greetings:
   - Return JSON:
     {
       "action": "chat",
       "reply": "Helpful response explaining how to schedule meetings (e.g. 'schedule a meeting with alex@example.com tomorrow at 3pm')."
     }

IMPORTANT: Output ONLY pure JSON, without any markdown formatting or backticks.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (parsed.action === 'schedule') {
          return {
            type: 'create',
            replyText: parsed.reply || `I've prepared a meeting invite for **${parsed.title}** with **${parsed.attendee_email}**.`,
            actionProposal: {
              id: `prop-${uuidv4()}`,
              type: 'create',
              meetingDraft: {
                title: parsed.title || 'Calendar Meeting',
                description: parsed.description || `Scheduled via CalendarMeet.ai`,
                startTime: parsed.start_time,
                endTime: parsed.end_time,
                hostEmail: userEmail,
                attendeeEmail: parsed.attendee_email,
              },
              status: 'pending',
            },
          };
        } else if (parsed.action === 'cancel') {
          return {
            type: 'cancel',
            replyText: parsed.reply || `I can help cancel that meeting. Please confirm the action below.`,
          };
        } else {
          return {
            type: 'chat',
            replyText: parsed.reply || `How can I help with your calendar schedule?`,
          };
        }
      } catch (err: any) {
        console.warn('[Gemini API] Error during model call, falling back to heuristic parser:', err.message);
      }
    }

    // Heuristic Smart Fallback Parser (Robust & works 100% offline/without API key)
    return this.fallbackHeuristicParser(text, userEmail, existingMeetings);
  }

  /**
   * Deterministic NLP parser for zero-config local runs
   */
  private static fallbackHeuristicParser(
    text: string,
    userEmail: string,
    existingMeetings: any[]
  ): ParsedMeetingAction {
    const lower = text.toLowerCase();

    // 1. Check for cancellation
    if (lower.startsWith('cancel') || lower.startsWith('delete') || lower.startsWith('remove')) {
      const targetTerm = lower.replace(/^(cancel|delete|remove)\s+(the\s+|meeting\s+with\s+|meeting\s+)?/i, '').trim();
      return {
        type: 'cancel',
        replyText: `Are you sure you want to cancel the meeting matching "${targetTerm}"?`,
      };
    }

    // 2. Check for scheduling intent
    const isScheduling =
      lower.includes('meet') ||
      lower.includes('schedule') ||
      lower.includes('book') ||
      lower.includes('sync') ||
      lower.includes('call') ||
      lower.includes('1:1') ||
      lower.includes('tomorrow') ||
      lower.includes('at ');

    if (isScheduling) {
      // Extract email: match any standard email address
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      let attendeeEmail = emailMatch ? emailMatch[0] : '';

      // If no explicit email, extract name after "with" (e.g. "with Sarah", "with David")
      const withMatch = text.match(/\bwith\s+([A-Za-z]+)/i);
      const name = withMatch ? withMatch[1] : 'colleague';
      if (!attendeeEmail) {
        attendeeEmail = `${name.toLowerCase()}@example.com`;
      }

      // Compute target date:
      const now = new Date();
      let targetDate = new Date(now);
      if (lower.includes('tomorrow')) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (lower.includes('day after tomorrow')) {
        targetDate.setDate(targetDate.getDate() + 2);
      } else if (lower.includes('friday')) {
        const diff = (5 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + diff);
      } else if (lower.includes('monday')) {
        const diff = (1 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(targetDate.getDate() + diff);
      } else {
        targetDate.setDate(targetDate.getDate() + 1); // default tomorrow
      }

      // Compute time:
      let hour = 15; // default 3 PM
      let minute = 0;
      const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const mod = timeMatch[3];
        if (mod === 'pm' && h < 12) h += 12;
        if (mod === 'am' && h === 12) h = 0;
        if (!mod && h <= 6) h += 12; // e.g. "3" -> 15:00
        hour = h;
        minute = m;
      }

      targetDate.setHours(hour, minute, 0, 0);
      const endDate = new Date(targetDate.getTime() + 45 * 60 * 1000); // 45 min duration

      const title = `Sync with ${name.charAt(0).toUpperCase() + name.slice(1)}`;

      return {
        type: 'create',
        replyText: `I've prepared a meeting draft for **${title}** with **${attendeeEmail}** for **${targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${targetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}**.\n\nPlease review and confirm below to add it directly to your Google Calendar.`,
        actionProposal: {
          id: `prop-${uuidv4()}`,
          type: 'create',
          meetingDraft: {
            title,
            description: `Scheduled via CalendarMeet.ai assistant.\nHost: ${userEmail}\nAttendee: ${attendeeEmail}`,
            startTime: targetDate.toISOString(),
            endTime: endDate.toISOString(),
            hostEmail: userEmail,
            attendeeEmail,
          },
          status: 'pending',
        },
      };
    }

    // Default conversational reply
    return {
      type: 'chat',
      replyText: `Hello! I'm your AI Calendar assistant. You can chat with me naturally to schedule meetings on your actual Google Calendar.\n\nTry typing:\n• *"Schedule a 1:1 with sarah@company.com tomorrow at 3pm"*\n• *"Book product demo with client@acme.com this Friday at 11am"*\n• *"Set up coffee chat with david@team.org on Monday at 10am"*`,
    };
  }
}
