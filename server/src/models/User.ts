import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
  },
  { timestamps: true }
);

// Fallback in-memory map for local development when Mongo is offline
export const inMemoryUsers = new Map<string, any>();

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
