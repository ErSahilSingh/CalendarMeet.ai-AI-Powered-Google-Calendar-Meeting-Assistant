import { Queue } from 'bullmq';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { GoogleCalendarService } from './googleCalendar.service.js';
import { MeetingModel, inMemoryMeetings } from '../models/Meeting.js';

export interface CalendarJobData {
  action: 'CREATE_MEETING' | 'DELETE_MEETING';
  meetingId: string;
  accessToken: string;
  refreshToken?: string;
  eventDetails: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    hostEmail: string;
    attendeeEmail: string;
    googleEventId?: string;
  };
}

let calendarQueue: Queue | null = null;

// Initialize BullMQ Queue if Redis is connected
if (redisClient) {
  try {
    calendarQueue = new Queue('calendarQueue', {
      connection: redisClient as any,
    });
  } catch (err: any) {
    console.warn('[Queue] BullMQ Queue init note:', err.message);
  }
}

export class QueueService {
  /**
   * Adds a calendar synchronization job to the queue, or processes directly if Redis is offline
   */
  static async enqueueCalendarJob(jobData: CalendarJobData): Promise<any> {
    console.log(`[Queue] Dispatching calendar job: ${jobData.action} for meeting ${jobData.meetingId}`);

    // If BullMQ + Redis are active, use BullMQ job queue
    if (isRedisConnected && calendarQueue) {
      try {
        const job = await calendarQueue.add(jobData.action, jobData, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
        });
        return { queued: true, jobId: job.id };
      } catch (err: any) {
        console.warn('[Queue] Enqueue failed, falling back to direct processing:', err.message);
      }
    }

    // Direct execution fallback (ensures 100% functionality even when Redis is not running)
    return this.processDirectly(jobData);
  }

  /**
   * Directly processes the calendar mutation
   */
  static async processDirectly(jobData: CalendarJobData) {
    const { action, meetingId, accessToken, refreshToken, eventDetails } = jobData;

    try {
      if (action === 'CREATE_MEETING') {
        const result = await GoogleCalendarService.createEvent(
          accessToken,
          refreshToken,
          {
            title: eventDetails.title,
            description: eventDetails.description,
            startTime: eventDetails.startTime,
            endTime: eventDetails.endTime,
            hostEmail: eventDetails.hostEmail,
            attendeeEmail: eventDetails.attendeeEmail,
          }
        );

        // Update Meeting in MongoDB or in-memory
        try {
          await MeetingModel.findByIdAndUpdate(meetingId, {
            googleEventId: result.googleEventId,
            htmlLink: result.htmlLink,
            meetLink: result.meetLink,
            status: 'synced',
          });
        } catch {
          // Fallback to in-memory map
          const existing = inMemoryMeetings.get(meetingId);
          if (existing) {
            existing.googleEventId = result.googleEventId;
            existing.htmlLink = result.htmlLink;
            existing.meetLink = result.meetLink;
            existing.status = 'synced';
            inMemoryMeetings.set(meetingId, existing);
          }
        }

        console.log(`[Queue] Successfully synced meeting ${meetingId} with Google Calendar ID: ${result.googleEventId}`);
        return { success: true, result };
      } else if (action === 'DELETE_MEETING' && eventDetails.googleEventId) {
        await GoogleCalendarService.deleteEvent(
          accessToken,
          refreshToken,
          eventDetails.googleEventId
        );

        try {
          await MeetingModel.findByIdAndUpdate(meetingId, { status: 'cancelled' });
        } catch {
          const existing = inMemoryMeetings.get(meetingId);
          if (existing) {
            existing.status = 'cancelled';
            inMemoryMeetings.set(meetingId, existing);
          }
        }

        return { success: true };
      }
    } catch (err: any) {
      console.error(`[Queue] Error processing calendar action:`, err.message);
      try {
        await MeetingModel.findByIdAndUpdate(meetingId, {
          status: 'failed',
          syncError: err.message,
        });
      } catch {
        const existing = inMemoryMeetings.get(meetingId);
        if (existing) {
          existing.status = 'failed';
          existing.syncError = err.message;
          inMemoryMeetings.set(meetingId, existing);
        }
      }
      return { success: false, error: err.message };
    }
  }
}
