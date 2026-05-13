import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { requireSuperAdmin } from '../../middleware/require-super-admin.js';
import { updateSettingsSchema } from '../../schemas/admin.schema.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function adminSettingsRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/settings', { preHandler: requireAdmin }, async (request, reply) => {
    const settings = await fastify.prisma.adminSetting.findMany();

    const data: Record<string, string> = {};
    for (const s of settings) {
      data[s.settingKey] = s.settingValue;
    }

    return reply.send({ success: true, data });
  });

  fastify.patch('/admin/settings', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const updates = updateSettingsSchema.parse(request.body);

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        fastify.prisma.adminSetting.upsert({
          where:  { settingKey: key },
          update: { settingValue: value },
          create: { settingKey: key, settingValue: value },
        }),
      ),
    );

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'updated_settings',
      targetType: 'system',
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    const settings = await fastify.prisma.adminSetting.findMany();
    const data: Record<string, string> = {};
    for (const s of settings) data[s.settingKey] = s.settingValue;

    return reply.send({ success: true, data });
  });
}
