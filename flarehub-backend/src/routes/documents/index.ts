import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  registerDocumentSchema,
  documentQuerySchema,
  documentStatusSchema,
} from '../../schemas/admin.schema.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl, getSignedDownloadUrls, deleteFile } from '../../services/storage.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { appConfig } from '../../config/index.js';
import { randomUUID } from 'crypto';

export default async function documentRoutes(fastify: FastifyInstance) {
  fastify.post('/documents', { preHandler: requireAuth }, async (request, reply) => {
    const body = registerDocumentSchema.parse(request.body);
    const userId = request.user!.id;

    const doc = await fastify.prisma.document.create({
      data: {
        userId,
        filename:         randomUUID(),
        originalName:     body.originalName,
        storagePath:      body.storagePath,
        fileSize:         body.fileSize,
        fileType:         body.fileType,
        documentCategory: body.documentCategory ?? 'milestone',
        description:      body.description,
        priority:         body.priority ?? 'medium',
      },
    });

    return reply.status(201).send({ success: true, data: doc });
  });

  fastify.get('/documents/me', { preHandler: requireAuth }, async (request, reply) => {
    const query = documentQuerySchema.parse(request.query);
    const { page, limit, documentCategory, status } = query;
    const skip = (page - 1) * limit;
    const userId = request.user!.id;

    const where = {
      userId,
      ...(documentCategory ? { documentCategory } : {}),
      ...(status           ? { status }            : {}),
    };

    const [docs, total] = await Promise.all([
      fastify.prisma.document.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      fastify.prisma.document.count({ where }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.documents,
      docs.map((d) => d.storagePath),
    );

    const data = docs.map((d) => ({
      ...d,
      downloadUrl: urlMap.get(d.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.get<{ Params: { id: string } }>('/documents/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid document ID', 400);

    const doc = await fastify.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role);
    if (!isAdmin && doc.userId !== request.user!.id) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    await fastify.prisma.document.update({ where: { id }, data: { lastAccessedAt: new Date() } });

    const downloadUrl = await getSignedDownloadUrl(fastify.supabase, appConfig.storage.buckets.documents, doc.storagePath);
    return reply.send({ success: true, data: { ...doc, downloadUrl } });
  });

  fastify.delete<{ Params: { id: string } }>('/documents/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid document ID', 400);

    const doc = await fastify.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role);
    if (!isAdmin && doc.userId !== request.user!.id) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    await deleteFile(fastify.supabase, appConfig.storage.buckets.documents, doc.storagePath);
    await fastify.prisma.document.delete({ where: { id } });

    return reply.status(204).send();
  });

  fastify.get('/documents', { preHandler: requireAdmin }, async (request, reply) => {
    const query = documentQuerySchema.parse(request.query);
    const { page, limit, documentCategory, status, search, userId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(documentCategory ? { documentCategory } : {}),
      ...(status           ? { status }            : {}),
      ...(userId           ? { userId }             : {}),
      ...(search
        ? {
            OR: [
              { originalName: { contains: search, mode: 'insensitive' as const } },
              { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
              { user: { email:     { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [docs, total] = await Promise.all([
      fastify.prisma.document.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { uploadedAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.document.count({ where }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.documents,
      docs.map((d) => d.storagePath),
    );

    const data = docs.map((d) => ({
      ...d,
      downloadUrl: urlMap.get(d.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/documents/:id/status',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid document ID', 400);

      const { status } = documentStatusSchema.parse(request.body);

      const doc = await fastify.prisma.document.update({
        where: { id },
        data:  { status },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     `updated_document_status_to_${status}`,
        targetType: 'submission',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: doc });
    },
  );
}
