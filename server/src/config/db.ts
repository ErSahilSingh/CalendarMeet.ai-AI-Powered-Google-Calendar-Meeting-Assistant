import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/calendarmeet';

export let isDbConnected = false;

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isDbConnected = true;
    console.log(`[MongoDB] Connected successfully to ${MONGO_URI}`);
  } catch (error: any) {
    isDbConnected = false;
    console.warn(`[MongoDB] Warning: Could not connect to MongoDB at ${MONGO_URI} (${error.message}). Running with in-memory persistence fallback for development.`);
  }
}
