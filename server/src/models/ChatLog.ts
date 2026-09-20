import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionProposal?: {
    id: string;
    type: 'create' | 'cancel';
    meetingDraft: {
      id?: string;
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      hostEmail: string;
      attendeeEmail: string;
      meetLink?: string;
      htmlLink?: string;
    };
    status: 'pending' | 'confirmed' | 'dismissed';
  };
}

export interface IChatLog extends Document {
  userId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    actionProposal: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ChatLogSchema = new Schema<IChatLog>(
  {
    userId: { type: String, required: true, unique: true },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

export const inMemoryChatLogs = new Map<string, IChatMessage[]>();

export const ChatLogModel = mongoose.models.ChatLog || mongoose.model<IChatLog>('ChatLog', ChatLogSchema);
