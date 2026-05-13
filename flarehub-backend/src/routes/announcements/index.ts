import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { sendEmail, announcementEmail } from '../../services/email.service.js';

const createAnnouncementSchema = z.object({
  title:      z.string().min(1),
  body:       z.string().min(1),
  isPinned:   z.boolean().optional(),
  targetRole: z.enum(['all', 'entrepreneur', 'mentor']).optional(),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export default async function announcementRoutes(fastify: FastifyInstance) {
  fastify.get('/announcements', { preHandler: requireAuth }, async (request, reply) => {
    const user = request.user!;
    const role = user.role === 'entrepreneur' ? 'entrepreneur'
               : user.isMentor               ? 'mentor'
               : null;

    const announcements = await fastify.prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { targetRole: 'all' },
          ...(role ? [{ targetRole: role as 'entrepreneur' | 'mentor' }] : []),
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      take: 50,
    });

    return reply.send({ success: true, data: announcements });
  });

  fastify.post('/admin/announcements', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createAnnouncementSchema.parse(request.body);

    const announcement = await fastify.prisma.announcement.create({
      data: {
        ...body,
        createdById: request.user!.id,
      },
    });

    fastify.wsRegistry.broadcast({
      type: 'new_announcement',
      data: { id: announcement.id, title: announcement.title, body: announcement.body, isPinned: announcement.isPinned },
    });

    // Fire-and-forget email to targeted users
    const roleFilter = body.targetRole === 'entrepreneur' ? { role: 'entrepreneur' as const }
                     : body.targetRole === 'mentor'       ? { isMentor: true }
                     : {};
    const recipients = await fastify.prisma.user.findMany({
      where:  { ...roleFilter, isVerified: true },
      select: { firstName: true, email: true },
    });
    void Promise.all(
      recipients.map((u) =>
        sendEmail({
          to:      u.email,
          subject: `Announcement: ${announcement.title}`,
          html:    announcementEmail(u.firstName, announcement.title, announcement.body),
        }),
      ),
    );

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'created_announcement',
      targetType: 'system',
      targetId:   String(announcement.id),
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.status(201).send({ success: true, data: announcement });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/admin/announcements/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid announcement ID', 400);

      const body = updateAnnouncementSchema.parse(request.body);
      const announcement = await fastify.prisma.announcement.update({ where: { id }, data: body });

      return reply.send({ success: true, data: announcement });
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/admin/announcements/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid announcement ID', 400);

      await fastify.prisma.announcement.delete({ where: { id } });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'deleted_announcement',
        targetType: 'system',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.status(204).send();
    },
  );
}
