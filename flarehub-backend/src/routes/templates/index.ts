import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import { registerTemplateSchema, updateTemplateSchema } from '../../schemas/admin.schema.js';
import { z } from 'zod';
import { AppError } from '../../types/index.js';
import { getPublicUrl, deleteFile } from '../../services/storage.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { appConfig } from '../../config/index.js';
import { randomUUID } from 'crypto';

export default async function templateRoutes(fastify: FastifyInstance) {
  fastify.get('/templates', { preHandler: requireAuth }, async (request, reply) => {
    const query = z.object({
      templateType: z.enum(['milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback']).optional(),
    }).parse(request.query);

    const templates = await fastify.prisma.adminTemplate.findMany({
      where: {
        isActive: true,
        ...(query.templateType ? { templateType: query.templateType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = templates.map((t) => ({
      ...t,
      downloadUrl: getPublicUrl(fastify.supabase, appConfig.storage.buckets.templates, t.storagePath),
    }));

    return reply.send({ success: true, data });
  });

  fastify.post('/templates', { preHandler: requireAdmin }, async (request, reply) => {
    const body = registerTemplateSchema.parse(request.body);

    const template = await fastify.prisma.adminTemplate.create({
      data: {
        ...body,
        filename:    randomUUID(),
        createdById: request.user!.id,
      },
    });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'created_template',
      targetType: 'template',
      targetId:   String(template.id),
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.status(201).send({ success: true, data: template });
  });

  fastify.patch<{ Params: { id: string } }>('/templates/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid template ID', 400);

    const body = updateTemplateSchema.parse(request.body);

    const template = await fastify.prisma.adminTemplate.update({ where: { id }, data: body });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'updated_template',
      targetType: 'template',
      targetId:   String(id),
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.send({ success: true, data: template });
  });

  fastify.patch<{ Params: { id: string } }>('/templates/:id/toggle', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid template ID', 400);

    const current = await fastify.prisma.adminTemplate.findUnique({ where: { id } });
    if (!current) throw new AppError('NOT_FOUND', 'Template not found', 404);

    const template = await fastify.prisma.adminTemplate.update({
      where: { id },
      data:  { isActive: !current.isActive },
    });

    return reply.send({ success: true, data: { isActive: template.isActive } });
  });

  fastify.delete<{ Params: { id: string } }>('/templates/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid template ID', 400);

    const subCount = await fastify.prisma.userSubmission.count({ where: { templateId: id } });
    if (subCount > 0) {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Cannot delete a template that has user submissions', 422);
    }

    const template = await fastify.prisma.adminTemplate.findUnique({ where: { id } });
    if (!template) throw new AppError('NOT_FOUND', 'Template not found', 404);

    await deleteFile(fastify.supabase, appConfig.storage.buckets.templates, template.storagePath);
    await fastify.prisma.adminTemplate.delete({ where: { id } });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'deleted_template',
      targetType: 'template',
      targetId:   String(id),
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.status(204).send();
  });
}
