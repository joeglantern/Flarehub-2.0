import type { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    let dbStatus = 'connected';
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }
    return reply.send({
      status:    'ok',
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      db:        dbStatus,
    });
  });
}
