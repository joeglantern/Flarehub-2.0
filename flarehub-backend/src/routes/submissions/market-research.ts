import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  createMarketResearchSchema,
  updateMarketResearchSchema,
  adminCommentSchema,
  submissionQuerySchema,
} from '../../schemas/submission.schema.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function marketResearchRoutes(fastify: FastifyInstance) {
  fastify.get('/submissions/market-research/me', { preHandler: requireAuth }, async (request, reply) => {
    const research = await fastify.prisma.marketResearch.findUnique({
      where: { userId: request.user!.id },
    });
    return reply.send({ success: true, data: research });
  });

  fastify.post('/submissions/market-research', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = createMarketResearchSchema.parse(request.body);

    const existing = await fastify.prisma.marketResearch.findUnique({ where: { userId } });
    if (existing) throw new AppError('CONFLICT', 'Market research already exists. Use PATCH to update.', 409);

    const research = await fastify.prisma.marketResearch.create({
      data: {
        userId,
        ...body,
        surveyDate: body.surveyDate ? new Date(body.surveyDate) : undefined,
      },
    });
    return reply.status(201).send({ success: true, data: research });
  });

  fastify.patch('/submissions/market-research/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const body = updateMarketResearchSchema.parse(request.body);

    const existing = await fastify.prisma.marketResearch.findUnique({ where: { userId } });
    if (!existing) throw new AppError('NOT_FOUND', 'Market research not found', 404);

    const research = await fastify.prisma.marketResearch.update({
      where: { userId },
      data:  {
        ...body,
        surveyDate: body.surveyDate ? new Date(body.surveyDate) : undefined,
      },
    });
    return reply.send({ success: true, data: research });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/submissions/market-research/:id/comment',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid ID', 400);

      const { adminComment } = adminCommentSchema.parse(request.body);

      const research = await fastify.prisma.marketResearch.update({
        where: { id },
        data:  { adminComment, commentedAt: new Date(), commentedById: request.user!.id },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   research.userId,
        type:     'market_research_commented',
        title:    'Admin comment on your Market Research',
        body:     adminComment.slice(0, 200),
        metadata: { marketResearchId: research.id },
      });

      fastify.wsRegistry.push(research.userId, {
        type: 'submission_commented',
        data: { submissionType: 'market_research', comment: adminComment, commentedAt: new Date().toISOString() },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'commented_market_research',
        targetType: 'submission',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: research });
    },
  );

  fastify.get('/submissions/market-research', { preHandler: requireAdmin }, async (request, reply) => {
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

    const [researches, total] = await Promise.all([
      fastify.prisma.marketResearch.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.marketResearch.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    researches,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
}
