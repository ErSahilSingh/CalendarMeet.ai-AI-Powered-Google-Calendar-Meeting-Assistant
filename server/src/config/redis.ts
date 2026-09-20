import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export let redisClient: Redis | null = null;
export let isRedisConnected = false;

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 2500,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log(`[Redis] Connected successfully to ${REDIS_URL}`);
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress spamming error logs in dev if redis is offline
  });

  // Attempt initial non-blocking connect
  redisClient.connect().catch((err) => {
    console.warn(`[Redis] Note: Redis not reachable at ${REDIS_URL}. Falling back to direct in-process queue processing for local development.`);
  });
} catch (err: any) {
  console.warn(`[Redis] Initialization warning: ${err.message}`);
}
