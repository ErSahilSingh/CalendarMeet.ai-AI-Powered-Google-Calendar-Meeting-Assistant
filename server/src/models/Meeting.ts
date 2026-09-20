import mongoose, { Schema, Document } from 'mongoose';

export type MeetingSyncStatus = 'draft' | 'pending_sync' | 'synced' | 'failed' | 'cancelled';

export interface IMeeting extends Document {
  userId: string;
  googleEventId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  hostEmail: string;
  attendeeEmail: string;
  attendees: string[];
  meetLink?: string;
  htmlLink?: string; // Direct link to open in calendar.google.com
  status: MeetingSyncStatus;
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    userId: { type: String, required: true, index: true },
    googleEventId: { type: String, sparse: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    hostEmail: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    attendees: [{ type: String }],
    meetLink: { type: String },
    htmlLink: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending_sync', 'synced', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    syncError: { type: String },
  },
  { timestamps: true }
);

// Fallback in-memory map for dev
export const inMemoryMeetings = new Map<string, any>();

export const MeetingModel = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
