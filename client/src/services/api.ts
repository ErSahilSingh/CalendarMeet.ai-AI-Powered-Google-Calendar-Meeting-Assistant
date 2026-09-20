const API_BASE = 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  connectedToGoogle: boolean;
}

export interface MeetingDraft {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  hostEmail: string;
  attendeeEmail: string;
  meetLink?: string;
  htmlLink?: string;
}

export interface ActionProposal {
  id: string;
  type: 'create' | 'cancel';
  meetingDraft: MeetingDraft;
  status: 'pending' | 'confirmed' | 'dismissed';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionProposal?: ActionProposal;
}

export interface SyncedMeeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  hostEmail: string;
  attendeeEmail: string;
  attendees: string[];
  meetLink?: string;
  htmlLink?: string;
  status: 'draft' | 'pending_sync' | 'synced' | 'failed' | 'cancelled';
  googleEventId?: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Authentication
  async getMe(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async devLogin(email?: string, name?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
  },

  // Chat
  async sendMessage(message: string): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    actionProposal?: ActionProposal;
  }> {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      throw new Error('Failed to send message');
    }
    return res.json();
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const res = await fetch(`${API_BASE}/chat/history`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  },

  async clearChatHistory(): Promise<void> {
    await fetch(`${API_BASE}/chat/history`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    }).catch(() => {});
  },

  // Calendar
  async confirmBooking(actionProposal: ActionProposal): Promise<{
    success: boolean;
    meeting: SyncedMeeting;
  }> {
    const res = await fetch(`${API_BASE}/calendar/confirm-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ meetingDraft: actionProposal.meetingDraft }),
    });
    if (!res.ok) {
      throw new Error('Failed to confirm booking');
    }
    return res.json();
  },

  async getMeetings(): Promise<SyncedMeeting[]> {
    try {
      const res = await fetch(`${API_BASE}/calendar/meetings`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.meetings || [];
    } catch {
      return [];
    }
  },

  async deleteMeeting(id: string): Promise<void> {
    await fetch(`${API_BASE}/calendar/meetings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  },
};
