import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { AppError } from '../../types/index.js';

const AUTH_RATE_LIMIT = { max: 10, timeWindow: 60_000 };

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/sync-user', { preHandler: requireAuth, config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const user = request.user!;

    const existing = await fastify.prisma.user.findUnique({ where: { id: user.id } });

    if (existing) {
      return reply.status(200).send({
        success: true,
        data: { ...existing, isNewUser: false },
      });
    }

    const created = await fastify.prisma.user.create({
      data: {
        id:        user.id,
        email:     user.email,
        firstName: '',
        lastName:  '',
      },
    });

    return reply.status(201).send({
      success: true,
      data: { ...created, isNewUser: true },
    });
  });

  fastify.get('/auth/profile-check', { preHandler: requireAuth, config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const user = request.user!;

    const dbUser = await fastify.prisma.user.findUnique({
      where:  { id: user.id },
      select: { profileComplete: true, role: true, isMentor: true },
    });

    if (!dbUser) throw new AppError('NOT_FOUND', 'User not found', 404);

    return reply.send({
      success: true,
      data: {
        profileComplete: dbUser.profileComplete,
        role:            dbUser.role,
        isMentor:        dbUser.isMentor,
      },
    });
  });
}
