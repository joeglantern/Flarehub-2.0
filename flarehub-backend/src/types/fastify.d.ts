import type { PrismaClient } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './index.js';
import type { ConnectionRegistry } from '../ws/registry.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma:       PrismaClient;
    supabase:     SupabaseClient;
    wsRegistry:   ConnectionRegistry;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthUser;
  }
}
