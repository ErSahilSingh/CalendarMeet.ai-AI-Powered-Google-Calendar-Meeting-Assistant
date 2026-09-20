import { CalendarEvent } from '../models/calendar';
import { ActionProposal, ChatMessage } from '../models/chat';
import { calendarStorage } from './calendarStorage';
import { addDays, setHours, setMinutes, format, isSameDay, parseISO } from 'date-fns';

export interface ParseResult {
  replyText: string;
  actionProposal?: ActionProposal;
}

// Helper to determine target date from text
function extractTargetDate(text: string): Date {
  const lower = text.toLowerCase();
  const now = new Date();

  if (lower.includes('tomorrow')) {
    return addDays(now, 1);
  }
  if (lower.includes('day after tomorrow')) {
    return addDays(now, 2);
  }
  if (lower.includes('today') || lower.includes('tonight')) {
    return now;
  }

  // Day of week match (e.g. "on monday", "this friday", "wednesday")
  const daysMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  for (const [dayName, targetDayNum] of Object.entries(daysMap)) {
    const regex = new RegExp(`\\b${dayName}\\b`, 'i');
    if (regex.test(lower)) {
      const currentDayNum = now.getDay();
      let diff = targetDayNum - currentDayNum;
      if (diff <= 0) diff += 7; // Next occurrence
      return addDays(now, diff);
    }
  }

  // Default to tomorrow if not specified
  return addDays(now, 1);
}

// Helper to extract time
function extractTime(text: string): { hour: number; minute: number } {
  const lower = text.toLowerCase();

  // Pattern: "3:30pm", "3:30 pm", "15:00", "3pm", "3 pm", "11am", "11 am"
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const match = lower.match(timeRegex);

  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3]?.toLowerCase();

    if (modifier === 'pm' && hour < 12) {
      hour += 12;
    } else if (modifier === 'am' && hour === 12) {
      hour = 0;
    } else if (!modifier && hour <= 6) {
      // Assume afternoon for small numbers if unstated, e.g. "at 3" -> 15:00
      hour += 12;
    }
    return { hour, minute };
  }

  if (lower.includes('morning')) return { hour: 10, minute: 0 };
  if (lower.includes('noon')) return { hour: 12, minute: 0 };
  if (lower.includes('afternoon')) return { hour: 14, minute: 0 };
  if (lower.includes('evening')) return { hour: 17, minute: 0 };

  // Default: 14:00 (2:00 PM)
  return { hour: 14, minute: 0 };
}

// Helper to extract duration (default 60 mins)
function extractDurationMinutes(text: string): number {
  const match = text.toLowerCase().match(/\b(\d+)\s*(?:min|minute|mins|hr|hour|hours)\b/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (text.includes('hr') || text.includes('hour')) {
      return val * 60;
    }
    return val;
  }
  return 60;
}

// Helper to extract attendees
function extractAttendees(text: string): string[] {
  const attendees: string[] = [];
  
  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emails = text.match(emailRegex);
  if (emails) {
    attendees.push(...emails);
  }

  // Extract names after "with" (e.g. "with Sarah", "with Alex and David")
  const withMatch = text.match(/\bwith\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+|\s+[A-Z][a-z]+)*)/i);
  if (withMatch && withMatch[1]) {
    const rawNames = withMatch[1].split(/\s+and\s+|,\s*/i);
    for (const name of rawNames) {
      const trimmed = name.trim();
      if (trimmed && !attendees.some(a => a.toLowerCase().includes(trimmed.toLowerCase()))) {
        attendees.push(`${trimmed.toLowerCase()}@company.com`);
      }
    }
  }

  return attendees;
}

export function parseNaturalLanguageCommand(userText: string): ParseResult {
  const text = userText.trim();
  const lower = text.toLowerCase();
  const allEvents = calendarStorage.getEvents();

  // 1. Cancellation / Deletion Intent
  if (lower.startsWith('cancel') || lower.startsWith('delete') || lower.startsWith('remove')) {
    // Find matching event
    const searchTerm = lower.replace(/^(cancel|delete|remove)\s+(the\s+|meeting\s+with\s+|meeting\s+|sync\s+with\s+|event\s+)?/i, '').trim();
    
    const matchedEvent = allEvents.find((evt) => {
      const titleLower = evt.title.toLowerCase();
      const attendeesStr = (evt.attendees || []).join(' ').toLowerCase();
      return (
        titleLower.includes(searchTerm) ||
        attendeesStr.includes(searchTerm) ||
        (searchTerm.length > 2 && (searchTerm.includes(titleLower) || titleLower.includes(searchTerm)))
      );
    });

    if (matchedEvent) {
      const proposal: ActionProposal = {
        id: `prop-cancel-${Date.now()}`,
        type: 'cancel',
        eventDraft: { ...matchedEvent, status: 'cancelled' },
        targetEventId: matchedEvent.id,
        status: 'pending',
        explanation: `Are you sure you want to cancel "${matchedEvent.title}" on ${format(parseISO(matchedEvent.startTime), 'EEEE, MMM d @ h:mm a')}?`,
      };

      return {
        replyText: `I found **${matchedEvent.title}** on your calendar. Please review and confirm the cancellation below.`,
        actionProposal: proposal,
      };
    } else {
      return {
        replyText: `I couldn't find an active meeting matching "${searchTerm}". Could you check the title or date?`,
      };
    }
  }

  // 2. Query / Schedule Overview Intent
  if (
    lower.startsWith('what') ||
    lower.startsWith('show') ||
    lower.includes('schedule') ||
    lower.includes('free time') ||
    lower.includes('agenda')
  ) {
    const targetDate = extractTargetDate(text);
    const dayEvents = allEvents.filter((e) => isSameDay(parseISO(e.startTime), targetDate));
    const formattedDate = format(targetDate, 'EEEE, MMMM d');

    if (dayEvents.length === 0) {
      return {
        replyText: `You have no scheduled meetings for **${formattedDate}**. Your calendar is completely clear! ✨`,
      };
    }

    const eventList = dayEvents
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map(
        (e) =>
          `• **${format(parseISO(e.startTime), 'h:mm a')} - ${format(parseISO(e.endTime), 'h:mm a')}**: ${e.title} (${e.location || 'Google Meet'})`
      )
      .join('\n');

    return {
      replyText: `Here is your schedule for **${formattedDate}** (${dayEvents.length} events):\n\n${eventList}`,
    };
  }

  // 3. Scheduling / Booking Intent
  const isBooking =
    lower.includes('book') ||
    lower.includes('schedule') ||
    lower.includes('meet') ||
    lower.includes('sync') ||
    lower.includes('set up') ||
    lower.includes('call') ||
    lower.includes('catch up') ||
    lower.includes('coffee') ||
    lower.includes('1:1');

  if (isBooking || lower.includes('tomorrow') || lower.includes('at ')) {
    const targetDate = extractTargetDate(text);
    const { hour, minute } = extractTime(text);
    const durationMins = extractDurationMinutes(text);

    const startTime = setMinutes(setHours(targetDate, hour), minute);
    const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);

    const attendees = extractAttendees(text);
    
    // Generate an intelligent title
    let title = 'Meeting';
    const attendeeName = attendees[0] ? attendees[0].split('@')[0].replace('.', ' ') : '';
    const capitalizedName = attendeeName.charAt(0).toUpperCase() + attendeeName.slice(1);

    if (lower.includes('1:1') || lower.includes('one on one')) {
      title = capitalizedName ? `1:1 with ${capitalizedName}` : '1:1 Sync';
    } else if (lower.includes('coffee')) {
      title = capitalizedName ? `Coffee with ${capitalizedName}` : 'Coffee Catch-up';
    } else if (lower.includes('standup')) {
      title = 'Team Standup';
    } else if (lower.includes('demo')) {
      title = capitalizedName ? `Product Demo with ${capitalizedName}` : 'Product Demo';
    } else if (capitalizedName) {
      title = `Sync with ${capitalizedName}`;
    } else {
      title = 'Calendar Meeting';
    }

    // Check for schedule conflicts
    const conflict = calendarStorage.checkConflict(startTime.toISOString(), endTime.toISOString());

    const draftEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title,
      description: `Scheduled via CalendarMeet.ai assistant. Attendees: ${attendees.length > 0 ? attendees.join(', ') : 'Sahil Sharma'}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: 'Google Meet',
      meetUrl: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
      attendees: attendees.length > 0 ? attendees : ['colleague@company.com'],
      status: 'confirmed',
      colorTag: 'emerald',
    };

    const proposal: ActionProposal = {
      id: `prop-${Date.now()}`,
      type: 'create',
      eventDraft: draftEvent,
      status: 'pending',
      conflictDetected: conflict.hasConflict,
      explanation: conflict.hasConflict
        ? `⚠️ Note: You have an overlap with "${conflict.conflictingEvents[0].title}". Would you still like to schedule this?`
        : `Ready to schedule **${title}** on ${format(startTime, 'EEEE, MMM d')} at ${format(startTime, 'h:mm a')}.`,
    };

    let reply = `I've prepared a calendar invite for **${title}** on **${format(startTime, 'EEEE, MMMM d')}** at **${format(startTime, 'h:mm a')}** (${durationMins} min).`;
    if (conflict.hasConflict) {
      reply += `\n\n⚠️ **Notice**: This overlaps with your existing meeting: *${conflict.conflictingEvents[0].title}*.`;
    }
    reply += `\n\nPlease verify details and click **Confirm Booking** to add it to your Google Calendar.`;

    return {
      replyText: reply,
      actionProposal: proposal,
    };
  }

  // 4. Fallback conversational reply
  return {
    replyText: `I can help you manage your calendar! Try asking me:\n\n` +
      `• *"Book a 1:1 with Sarah tomorrow at 3pm"*\n` +
      `• *"Schedule team design critique this Friday at 11am"*\n` +
      `• *"What's on my schedule for today?"*\n` +
      `• *"Cancel 1:1 Sync with Sarah Chen"*`,
  };
}
