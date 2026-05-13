import { config } from 'dotenv';
config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export const appConfig = {
  port:           parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:        process.env.NODE_ENV ?? 'development',
  apiPrefix:      process.env.API_PREFIX ?? '/api/v1',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
  isDev:          (process.env.NODE_ENV ?? 'development') === 'development',

  db: {
    url:       requireEnv('DATABASE_URL'),
    directUrl: requireEnv('DIRECT_URL'),
  },

  supabase: {
    url:            requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret:      requireEnv('SUPABASE_JWT_SECRET'),
  },

  storage: {
    buckets: {
      documents:   process.env.STORAGE_BUCKET_DOCUMENTS   ?? 'documents',
      evidence:    process.env.STORAGE_BUCKET_EVIDENCE     ?? 'evidence',
      profiles:    process.env.STORAGE_BUCKET_PROFILES     ?? 'profiles',
      templates:   process.env.STORAGE_BUCKET_TEMPLATES    ?? 'templates',
      submissions: process.env.STORAGE_BUCKET_SUBMISSIONS  ?? 'submissions',
    },
  },

  rateLimit: {
    max:      parseInt(process.env.RATE_LIMIT_MAX        ?? '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS  ?? '60000', 10),
  },

  email: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from:   process.env.EMAIL_FROM     ?? 'noreply@flarehub.org',
  },

  sms: {
    apiKey:   process.env.AT_API_KEY   ?? '',
    username: process.env.AT_USERNAME  ?? '',
    senderId: process.env.AT_SENDER_ID ?? 'FLAREHUB',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  vapid: {
    publicKey:  process.env.VAPID_PUBLIC_KEY  ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    email:      process.env.VAPID_EMAIL       ?? '',
  },
} as const;

export type AppConfig = typeof appConfig;
