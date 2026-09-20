import { Worker, Job } from 'bullmq';
import { redisClient, isRedisConnected } from '../config/redis.js';
import { QueueService, CalendarJobData } from '../services/queue.service.js';

let calendarWorker: Worker | null = null;

export function initCalendarWorker() {
  if (!redisClient || !isRedisConnected) {
    console.log('[Worker] Redis not connected; BullMQ worker skipped (jobs will run via direct executor).');
    return;
  }

  try {
    calendarWorker = new Worker(
      'calendarQueue',
      async (job: Job<CalendarJobData>) => {
        console.log(`[Worker] Processing BullMQ job #${job.id}: ${job.data.action}`);
        return await QueueService.processDirectly(job.data);
      },
      {
        connection: redisClient as any,
        concurrency: 5,
      }
    );

    calendarWorker.on('completed', (job) => {
      console.log(`[Worker] Job #${job.id} completed successfully`);
    });

    calendarWorker.on('failed', (job, err) => {
      console.error(`[Worker] Job #${job?.id} failed with error:`, err.message);
    });

    console.log('[Worker] BullMQ Calendar Worker initialized.');
  } catch (err: any) {
    console.warn('[Worker] Initialization notice:', err.message);
  }
}
