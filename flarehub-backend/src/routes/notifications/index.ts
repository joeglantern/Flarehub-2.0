import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { notificationQuerySchema } from '../../schemas/notification.schema.js';
import { AppError } from '../../types/index.js';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from '../../services/cache.service.js';

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/notifications/me', { preHandler: requireAuth }, async (request, reply) => {
    const query = notificationQuerySchema.parse(request.query);
    const { page, limit, isRead } = query;
    const skip = (page - 1) * limit;
    const userId = request.user!.id;

    const cacheKey = CacheKeys.notifications(userId, page, limit, isRead);
    const cached = await cacheGet<object>(cacheKey);
    if (cached) return reply.send(cached);

    const where = {
      userId,
      ...(isRead !== undefined ? { isRead } : {}),
    };

    const [notifications, total] = await Promise.all([
      fastify.prisma.notification.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      fastify.prisma.notification.count({ where }),
    ]);

    const response = {
      success: true,
      data:    notifications,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await cacheSet(cacheKey, response, 30);
    return reply.send(response);
  });

  fastify.patch<{ Params: { id: string } }>('/notifications/:id/read', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid notification ID', 400);

    const existing = await fastify.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Notification not found', 404);
    if (existing.userId !== request.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const notification = await fastify.prisma.notification.update({
      where: { id },
      data:  { isRead: true },
    });

    // Bust cached pages for this user (page 1 with common limits/filters)
    await cacheDel(
      CacheKeys.notifications(existing.userId, 1, 20, undefined),
      CacheKeys.notifications(existing.userId, 1, 20, false),
      CacheKeys.notifications(existing.userId, 1, 50, undefined),
    );

    return reply.send({ success: true, data: notification });
  });

  fastify.patch('/notifications/read-all', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const result = await fastify.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });

    await cacheDel(
      CacheKeys.notifications(userId, 1, 20, undefined),
      CacheKeys.notifications(userId, 1, 20, false),
      CacheKeys.notifications(userId, 1, 50, undefined),
    );

    return reply.send({ success: true, data: { marked: result.count } });
  });
}
