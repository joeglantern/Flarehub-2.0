import fp from 'fastify-plugin';
import { AppError } from '../types/index.js';

// Cache verified tokens for 60s — first hit calls Supabase, rest are instant
const tokenCache = new Map<string, { id: string; email: string; expiresAt: number }>();
const CACHE_TTL = 60_000;

async function resolveToken(supabase: typeof import('../lib/supabase.js').supabaseAdmin, token: string) {
  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) return cached;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  const entry = { id: data.user.id, email: data.user.email, expiresAt: now + CACHE_TTL };
  tokenCache.set(token, entry);

  // Prune stale entries to prevent unbounded growth
  if (tokenCache.size > 500) {
    for (const [k, v] of tokenCache) {
      if (v.expiresAt < now) tokenCache.delete(k);
    }
  }

  return entry;
}

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: Parameters<typeof fastify.authenticate>[0], _reply: Parameters<typeof fastify.authenticate>[1]) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Missing or invalid Authorization header', 401);
    }

    const token = authHeader.slice(7);
    const resolved = await resolveToken(fastify.supabase, token);

    if (!resolved) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }

    // Fetch role from DB — never trust role from JWT
    let user = await fastify.prisma.user.findUnique({
      where:  { id: resolved.id },
      select: { id: true, email: true, role: true, isMentor: true },
    });

    if (!user) {
      // User exists in Supabase Auth but not our DB — create them
      await fastify.prisma.user.create({
        data: { id: resolved.id, email: resolved.email, firstName: '', lastName: '' },
      }).catch(() => null);

      user = await fastify.prisma.user.findUnique({
        where:  { id: resolved.id },
        select: { id: true, email: true, role: true, isMentor: true },
      });

      if (!user) throw new AppError('UNAUTHORIZED', 'User account not found', 401);
    }

    request.user = user;
  });
});
