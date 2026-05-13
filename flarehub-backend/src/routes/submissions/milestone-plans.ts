import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  createMilestonePlanSchema,
  updateMilestonePlanSchema,
  adminCommentSchema,
  submissionQuerySchema,
} from '../../schemas/submission.schema.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function milestonePlanRoutes(fastify: FastifyInstance) {
  fastify.get('/submissions/milestones/me', { preHandler: requireAuth }, async (request, reply) => {
    const plan = await fastify.prisma.milestonePlan.findUnique({
      where: { userId: request.user!.id },
    });
    return reply.send({ success: true, data: plan });
  });

  fastify.post('/submissions/milestones', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createMilestonePlanSchema.parse(request.body);

    const existing = await fastify.prisma.milestonePlan.findUnique({ where: { userId } });
    if (existing) throw new AppError('CONFLICT', 'Milestone plan already exists. Use PATCH to update.', 409);

    const plan = await fastify.prisma.milestonePlan.create({
      data: { userId, ...body, milestones: body.milestones },
    });
    return reply.status(201).send({ success: true, data: plan });
  });

  fastify.patch('/submissions/milestones/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = updateMilestonePlanSchema.parse(request.body);

    const existing = await fastify.prisma.milestonePlan.findUnique({ where: { userId } });
    if (!existing) throw new AppError('NOT_FOUND', 'Milestone plan not found', 404);

    const plan = await fastify.prisma.milestonePlan.update({
      where: { userId },
      data:  body,
    });
    return reply.send({ success: true, data: plan });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/submissions/milestones/:id/comment',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid ID', 400);

      const { adminComment } = adminCommentSchema.parse(request.body);

      const plan = await fastify.prisma.milestonePlan.update({
        where: { id },
        data:  { adminComment, commentedAt: new Date(), commentedById: request.user!.id },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   plan.userId,
        type:     'milestone_plan_commented',
        title:    'Admin comment on your Milestone Plan',
        body:     adminComment.slice(0, 200),
        metadata: { milestonePlanId: plan.id },
      });

      fastify.wsRegistry.push(plan.userId, {
        type: 'submission_commented',
        data: { submissionType: 'milestone_plan', comment: adminComment, commentedAt: new Date().toISOString() },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'commented_milestone_plan',
        targetType: 'submission',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: plan });
    },
  );

  fastify.get('/submissions/milestones', { preHandler: requireAdmin }, async (request, reply) => {
    const { page, limit, search, hasComment } = submissionQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const where = {
      ...(hasComment === true  ? { adminComment: { not: null } } : {}),
      ...(hasComment === false ? { adminComment: null }           : {}),
      ...(search
        ? {
            user: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName:  { contains: search, mode: 'insensitive' as const } },
                { email:     { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const [plans, total] = await Promise.all([
      fastify.prisma.milestonePlan.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.milestonePlan.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    plans,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
}
