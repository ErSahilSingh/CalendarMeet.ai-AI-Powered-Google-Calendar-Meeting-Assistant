import { CalendarEvent, ConflictCheckResult } from '../models/calendar';
import { format, addDays, startOfWeek, setHours, setMinutes, areIntervalsOverlapping } from 'date-fns';

const EVENTS_STORAGE_KEY = 'calendar_meet_events';

// Generate dynamic sample events anchored around the current week
export const generateSeedEvents = (): CalendarEvent[] => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start

  // Mon: Sprint Kickoff 9:30 AM - 10:30 AM
  const monStart = setMinutes(setHours(addDays(weekStart, 0), 9), 30);
  const monEnd = setMinutes(setHours(addDays(weekStart, 0), 10), 30);

  // Tue: Product Architecture Review 11:00 AM - 12:30 PM
  const tueStart = setMinutes(setHours(addDays(weekStart, 1), 11), 0);
  const tueEnd = setMinutes(setHours(addDays(weekStart, 1), 12), 30);

  // Wed: 1:1 Sync with Sarah 14:00 - 15:00
  const wedStart = setMinutes(setHours(addDays(weekStart, 2), 14), 0);
  const wedEnd = setMinutes(setHours(addDays(weekStart, 2), 15), 0);

  // Thu: AI Assistant Demo 15:30 - 16:30
  const thuStart = setMinutes(setHours(addDays(weekStart, 3), 15), 30);
  const thuEnd = setMinutes(setHours(addDays(weekStart, 3), 16), 30);

  // Fri: Team Retrospective 16:00 - 17:00
  const friStart = setMinutes(setHours(addDays(weekStart, 4), 16), 0);
  const friEnd = setMinutes(setHours(addDays(weekStart, 4), 17), 0);

  return [
    {
      id: 'evt-seed-1',
      title: 'Weekly Sprint Kickoff',
      description: 'Review upcoming priorities, backlog items, and engineering blockers.',
      startTime: monStart.toISOString(),
      endTime: monEnd.toISOString(),
      location: 'Google Meet',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      attendees: ['sarah.c@company.com', 'david.k@company.com', 'alex.m@company.com'],
      status: 'confirmed',
      colorTag: 'emerald',
    },
    {
      id: 'evt-seed-2',
      title: 'Product Architecture Review',
      description: 'Deep dive into real-time calendar synchronization & state management.',
      startTime: tueStart.toISOString(),
      endTime: tueEnd.toISOString(),
      location: 'Conference Room 4B / Meet',
      meetUrl: 'https://meet.google.com/qrs-tuvw-xyz',
      attendees: ['elena.v@design.co', 'marcus.l@eng.org'],
      status: 'confirmed',
      colorTag: 'cyan',
    },
    {
      id: 'evt-seed-3',
      title: '1:1 Sync with Sarah Chen',
      description: 'Quarterly roadmap alignment and AI feature milestone check-in.',
      startTime: wedStart.toISOString(),
      endTime: wedEnd.toISOString(),
      location: 'Google Meet',
      meetUrl: 'https://meet.google.com/sarah-sync-1on1',
      attendees: ['sarah.chen@company.com'],
      status: 'confirmed',
      colorTag: 'emerald',
    },
    {
      id: 'evt-seed-4',
      title: 'CalendarMeet.ai Live Demo',
      description: 'Showcase natural language event drafting and Motion UI transitions.',
      startTime: thuStart.toISOString(),
      endTime: thuEnd.toISOString(),
      location: 'Executive Briefing Center',
      meetUrl: 'https://meet.google.com/demo-meet-live',
      attendees: ['stakeholders@company.com'],
      status: 'confirmed',
      colorTag: 'purple',
    },
    {
      id: 'evt-seed-5',
      title: 'Team Retrospective & Happy Hour',
      description: 'Celebrating product release milestones with the engineering team.',
      startTime: friStart.toISOString(),
      endTime: friEnd.toISOString(),
      location: 'Virtual Lounge',
      attendees: ['team-all@company.com'],
      status: 'confirmed',
      colorTag: 'amber',
    }
  ];
};

export const calendarStorage = {
  getEvents: (): CalendarEvent[] => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load events from storage:', e);
    }
    const seed = generateSeedEvents();
    calendarStorage.saveEvents(seed);
    return seed;
  },

  saveEvents: (events: CalendarEvent[]): void => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      window.dispatchEvent(new Event('calendar_events_updated'));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  },

  addEvent: (event: CalendarEvent): CalendarEvent[] => {
    const events = calendarStorage.getEvents();
    const updated = [event, ...events];
    calendarStorage.saveEvents(updated);
    return updated;
  },

  updateEvent: (id: string, updates: Partial<CalendarEvent>): CalendarEvent[] => {
    const events = calendarStorage.getEvents();
    const updated = events.map((evt) => (evt.id === id ? { ...evt, ...updates } : evt));
    calendarStorage.saveEvents(updated);
    return updated;
  },

  deleteEvent: (id: string): CalendarEvent[] => {
    const events = calendarStorage.getEvents();
    const updated = events.filter((evt) => evt.id !== id);
    calendarStorage.saveEvents(updated);
    return updated;
  },

  checkConflict: (startTimeISO: string, endTimeISO: string, excludeId?: string): ConflictCheckResult => {
    const events = calendarStorage.getEvents();
    const start = new Date(startTimeISO);
    const end = new Date(endTimeISO);

    const conflicting = events.filter((evt) => {
      if (excludeId && evt.id === excludeId) return false;
      if (evt.status === 'cancelled') return false;
      const evtStart = new Date(evt.startTime);
      const evtEnd = new Date(evt.endTime);
      return areIntervalsOverlapping(
        { start, end },
        { start: evtStart, end: evtEnd }
      );
    });

    return {
      hasConflict: conflicting.length > 0,
      conflictingEvents: conflicting,
    };
  },

  resetDefaults: (): CalendarEvent[] => {
    const seed = generateSeedEvents();
    calendarStorage.saveEvents(seed);
    return seed;
  }
};
