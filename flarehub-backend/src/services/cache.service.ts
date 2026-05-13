import { Redis } from 'ioredis';
import { appConfig } from '../config/index.js';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!redis) {
    try {
      redis = new Redis(appConfig.redis.url, {
        lazyConnect:        true,
        maxRetriesPerRequest: 1,
        connectTimeout:     3000,
        enableOfflineQueue: false,
      });
      redis.on('error', () => {
        // Silently handle — cache is optional
        redis = null;
      });
    } catch {
      redis = null;
    }
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(...keys);
  } catch {
    // Non-fatal
  }
}

export const CacheKeys = {
  analyticsOverview:             'analytics:overview',
  analyticsByMonth:              (months: number) => `analytics:by-month:${months}`,
  analyticsGender:               'analytics:gender',
  analyticsCounty:               'analytics:county',
  analyticsSubmissionCompletion: 'analytics:submission-completion',
  analyticsBusinessStage:        'analytics:business-stage',
  analyticsApplicationStatus:    'analytics:application-status',
  analyticsProgramProgress:      (id: number) => `analytics:program-progress:${id}`,
  notifications:                 (userId: string, page: number, limit: number, isRead?: boolean) =>
    `notifications:${userId}:${page}:${limit}:${isRead ?? 'all'}`,
  conversations:                 (userId: string) => `conversations:${userId}`,
};
