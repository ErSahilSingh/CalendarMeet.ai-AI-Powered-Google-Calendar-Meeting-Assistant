import { CalendarEvent } from './calendar';

export type ActionType = 'create' | 'reschedule' | 'cancel';
export type ActionStatus = 'pending' | 'confirmed' | 'dismissed';

export interface ActionProposal {
  id: string;
  type: ActionType;
  eventDraft: CalendarEvent;
  targetEventId?: string; // id of existing event if updating or deleting
  status: ActionStatus;
  explanation?: string;
  conflictDetected?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO string or time display
  actionProposal?: ActionProposal;
}

export interface QuickPrompt {
  id: string;
  title: string;
  prompt: string;
  category?: 'meeting' | 'query' | 'focus';
}
