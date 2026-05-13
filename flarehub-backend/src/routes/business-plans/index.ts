import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { requireAuth } from '../../middleware/require-auth.js';

export default async function businessPlanRoutes(fastify: FastifyInstance) {
  fastify.get('/business-plans/me', { preHandler: requireAuth }, async (request, reply) => {
    const plan = await fastify.prisma.businessPlan.findUnique({
      where: { userId: request.user!.id },
    });
    return reply.send({ success: true, data: plan });
  });

  fastify.post('/business-plans', { preHandler: requireAuth }, async (request, reply) => {
    const { planData } = z.object({ planData: z.record(z.string(), z.unknown()) }).parse(request.body);
    const userId = request.user!.id;
    const jsonData = planData as unknown as Prisma.InputJsonValue;

    const existing = await fastify.prisma.businessPlan.findUnique({ where: { userId } });

    if (existing) {
      const updated = await fastify.prisma.businessPlan.update({
        where: { userId },
        data:  { planData: jsonData },
      });
      return reply.status(200).send({ success: true, data: updated });
    }

    const created = await fastify.prisma.businessPlan.create({
      data: { userId, planData: jsonData },
    });
    return reply.status(201).send({ success: true, data: created });
  });
}
