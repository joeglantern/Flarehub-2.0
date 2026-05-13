import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  createSmartGoalSchema,
  updateSmartGoalSchema,
  adminCommentSchema,
  submissionQuerySchema,
} from '../../schemas/submission.schema.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function smartGoalRoutes(fastify: FastifyInstance) {
  fastify.get('/submissions/smart-goals/me', { preHandler: requireAuth }, async (request, reply) => {
    const goal = await fastify.prisma.smartGoal.findUnique({
      where: { userId: request.user!.id },
    });
    return reply.send({ success: true, data: goal });
  });

  fastify.post('/submissions/smart-goals', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createSmartGoalSchema.parse(request.body);

    const existing = await fastify.prisma.smartGoal.findUnique({ where: { userId } });
    if (existing) throw new AppError('CONFLICT', 'Smart goal already exists. Use PATCH to update.', 409);

    const goal = await fastify.prisma.smartGoal.create({ data: { userId, ...body } });
    return reply.status(201).send({ success: true, data: goal });
  });

  fastify.patch('/submissions/smart-goals/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = updateSmartGoalSchema.parse(request.body);

    const existing = await fastify.prisma.smartGoal.findUnique({ where: { userId } });
    if (!existing) throw new AppError('NOT_FOUND', 'Smart goal not found', 404);

    const goal = await fastify.prisma.smartGoal.update({ where: { userId }, data: body });
    return reply.send({ success: true, data: goal });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/submissions/smart-goals/:id/comment',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid ID', 400);

      const { adminComment } = adminCommentSchema.parse(request.body);

      const goal = await fastify.prisma.smartGoal.update({
        where: { id },
        data:  { adminComment, commentedAt: new Date(), commentedById: request.user!.id },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   goal.userId,
        type:     'smart_goal_commented',
        title:    'Admin comment on your SMART Goal',
        body:     adminComment.slice(0, 200),
        metadata: { smartGoalId: goal.id },
      });

      fastify.wsRegistry.push(goal.userId, {
        type: 'smart_goal_commented',
        data: { comment: adminComment, commentedAt: new Date().toISOString() },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'commented_smart_goal',
        targetType: 'submission',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: goal });
    },
  );

  fastify.get('/submissions/smart-goals', { preHandler: requireAdmin }, async (request, reply) => {
    const { page, limit, search, hasComment } = submissionQuerySchema.parse(request.query);
    const skip = (page - 1) * limit;

    const where = {
      ...(hasComment === true  ? { adminComment: { not: null } }  : {}),
      ...(hasComment === false ? { adminComment: null }            : {}),
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

    const [goals, total] = await Promise.all([
      fastify.prisma.smartGoal.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.smartGoal.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    goals,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
}
