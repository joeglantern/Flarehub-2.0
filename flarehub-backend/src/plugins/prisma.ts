import fp from 'fastify-plugin';
import { prisma } from '../lib/prisma.js';

export default fp(async (fastify) => {
  await prisma.$connect();
  fastify.decorate('prisma', prisma);

  // Supabase's connection pooler closes idle connections after ~60s.
  // Ping every 45s to keep the single connection alive.
  const keepAlive = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Prisma will reconnect automatically on the next real query
    }
  }, 45_000);

  fastify.addHook('onClose', async () => {
    clearInterval(keepAlive);
    await prisma.$disconnect();
  });
});
