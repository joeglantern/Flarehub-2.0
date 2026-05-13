import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { logAdminAction } from '../../services/admin-log.service.js';

const scoreSchema = z.object({
  innovation:      z.number().int().min(1).max(10),
  feasibility:     z.number().int().min(1).max(10),
  impact:          z.number().int().min(1).max(10),
  teamStrength:    z.number().int().min(1).max(10),
  marketPotential: z.number().int().min(1).max(10),
  notes:           z.string().optional(),
});

const scoreQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export default async function scoringRoutes(fastify: FastifyInstance) {
  fastify.post<{ Params: { id: string } }>(
    '/applications/:id/score',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

      const body = scoreSchema.parse(request.body);
      const total = body.innovation + body.feasibility + body.impact + body.teamStrength + body.marketPotential;

      const application = await fastify.prisma.application.findUnique({ where: { id } });
      if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);

      const score = await fastify.prisma.applicationScore.upsert({
        where:  { applicationId: id },
        update: { ...body, totalScore: total, adminId: request.user!.id },
        create: { applicationId: id, adminId: request.user!.id, ...body, totalScore: total },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'scored_application',
        targetType: 'application',
        targetId:   String(id),
        description: `Score: ${total}/50`,
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: score });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/applications/:id/score',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

      const score = await fastify.prisma.applicationScore.findUnique({
        where:   { applicationId: id },
        include: { admin: { select: { id: true, firstName: true, lastName: true } } },
      });

      return reply.send({ success: true, data: score });
    },
  );

  fastify.get('/admin/scores', { preHandler: requireAdmin }, async (request, reply) => {
    const { page, limit } = scoreQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      fastify.prisma.applicationScore.findMany({
        skip,
        take:    limit,
        orderBy: { totalScore: 'desc' },
        include: {
          application: {
            include: {
              user:    { select: { id: true, firstName: true, lastName: true, email: true } },
              program: { select: { id: true, name: true } },
            },
          },
          admin: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      fastify.prisma.applicationScore.count(),
    ]);

    return reply.send({
      success: true,
      data:    scores,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
}
