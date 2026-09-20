export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO String (e.g., "2026-09-21T10:00:00")
  endTime: string;   // ISO String (e.g., "2026-09-21T11:00:00")
  location?: string;
  meetUrl?: string;
  attendees?: string[];
  status: EventStatus;
  colorTag?: 'emerald' | 'cyan' | 'purple' | 'amber';
  isAllDay?: boolean;
}

export type CalendarViewMode = 'week' | 'day';

export interface DayColumnData {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayName: string; // e.g., "Mon", "Tue"
  dayNumber: number; // e.g., 21
  isToday: boolean;
  isSelected: boolean;
}

export interface TimeSlot {
  hour: number; // 0 - 23
  label: string; // "9 AM", "10 AM", etc.
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEvents: CalendarEvent[];
}
