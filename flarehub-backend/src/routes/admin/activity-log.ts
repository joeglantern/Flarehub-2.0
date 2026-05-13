import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { activityLogQuerySchema } from '../../schemas/admin.schema.js';

export default async function adminActivityLogRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/activity-log', { preHandler: requireAdmin }, async (request, reply) => {
    const query = activityLogQuerySchema.parse(request.query);
    const { page, limit, adminId, targetType, from, to } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(adminId    ? { adminId }    : {}),
      ...(targetType ? { targetType } : {}),
      ...(from || to
        ? { createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to) }   : {}),
          } }
        : {}),
    };

    const [logs, total] = await Promise.all([
      fastify.prisma.adminLog.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      fastify.prisma.adminLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    logs,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });
}

