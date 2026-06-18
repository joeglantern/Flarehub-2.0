import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';

const mentorApplicationSchema = z.object({
  expertise:       z.array(z.string()).min(1),
  yearsExperience: z.coerce.number().int().min(0).max(50),
  currentRole:     z.string().min(1),
  currentCompany:  z.string().optional(),
  linkedIn:        z.string().optional(),
  motivation:      z.string().min(20),
  availability:    z.string().min(1),
});

export default async function mentorApplicationRoutes(fastify: FastifyInstance) {
  fastify.post('/mentor-applications', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;

    const existing = await fastify.prisma.mentorApplication.findUnique({ where: { userId } });
    if (existing) {
      return reply.status(409).send({ success: false, error: 'Application already submitted' });
    }

    const body = mentorApplicationSchema.parse(request.body);

    const application = await fastify.prisma.$transaction(async (tx) => {
      const app = await tx.mentorApplication.create({
        data: { userId, ...body, linkedIn: body.linkedIn || null },
      });
      await tx.user.update({
        where: { id: userId },
        data:  { profileComplete: true },
      });
      return app;
    });

    return reply.status(201).send({ success: true, data: application });
  });

  fastify.get('/mentor-applications/me', { preHandler: requireAuth }, async (request, reply) => {
    const application = await fastify.prisma.mentorApplication.findUnique({
      where: { userId: request.user!.id },
    });
    return reply.send({ success: true, data: application ?? null });
  });
}
