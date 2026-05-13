import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  registerEvidenceSchema,
  updateEvidenceStatusSchema,
  evidenceQuerySchema,
} from '../../schemas/evidence.schema.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl, getSignedDownloadUrls, deleteFile } from '../../services/storage.service.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { sendEmail, evidenceVerifiedEmail, evidenceRejectedEmail } from '../../services/email.service.js';
import { appConfig } from '../../config/index.js';

export default async function evidenceRoutes(fastify: FastifyInstance) {
  fastify.post('/evidence', { preHandler: requireAuth }, async (request, reply) => {
    const body = registerEvidenceSchema.parse(request.body);
    const userId = request.user!.id;

    const evidence = await fastify.prisma.evidence.create({
      data: {
        userId,
        programId:       body.programId,
        milestoneNumber: body.milestoneNumber,
        fileName:        body.fileName,
        storagePath:     body.storagePath,
        fileType:        body.fileType,
        fileSize:        BigInt(body.fileSize),
        mimeType:        body.mimeType,
        description:     body.description,
        category:        body.category,
      },
    });

    return reply.status(201).send({ success: true, data: { ...evidence, fileSize: Number(evidence.fileSize) } });
  });

  fastify.get('/evidence/me', { preHandler: requireAuth }, async (request, reply) => {
    const query = evidenceQuerySchema.parse(request.query);
    const { page, limit, programId, milestoneNumber, status, category } = query;
    const skip = (page - 1) * limit;
    const userId = request.user!.id;

    const where = {
      userId,
      ...(programId       ? { programId }       : {}),
      ...(milestoneNumber ? { milestoneNumber }  : {}),
      ...(status          ? { status }           : {}),
      ...(category        ? { category }         : {}),
    };

    const [evidences, total] = await Promise.all([
      fastify.prisma.evidence.findMany({
        where, skip, take: limit, orderBy: { uploadDate: 'desc' },
      }),
      fastify.prisma.evidence.count({ where }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.evidence,
      evidences.map((e) => e.storagePath),
    );

    const data = evidences.map((e) => ({
      ...e,
      fileSize:    Number(e.fileSize),
      downloadUrl: urlMap.get(e.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.get<{ Params: { id: string } }>('/evidence/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid evidence ID', 400);

    const evidence = await fastify.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) throw new AppError('NOT_FOUND', 'Evidence not found', 404);

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role);
    if (!isAdmin && evidence.userId !== request.user!.id) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    const downloadUrl = await getSignedDownloadUrl(fastify.supabase, appConfig.storage.buckets.evidence, evidence.storagePath);
    return reply.send({ success: true, data: { ...evidence, fileSize: Number(evidence.fileSize), downloadUrl } });
  });

  fastify.delete<{ Params: { id: string } }>('/evidence/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid evidence ID', 400);

    const evidence = await fastify.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) throw new AppError('NOT_FOUND', 'Evidence not found', 404);

    if (evidence.userId !== request.user!.id) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
    if (evidence.status !== 'pending') {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Cannot delete evidence that has been reviewed', 422);
    }

    await deleteFile(fastify.supabase, appConfig.storage.buckets.evidence, evidence.storagePath);
    await fastify.prisma.evidence.delete({ where: { id } });

    return reply.status(204).send();
  });

  fastify.get('/evidence', { preHandler: requireAdmin }, async (request, reply) => {
    const query = evidenceQuerySchema.parse(request.query);
    const { page, limit, status, programId, userId, category, from, to } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status    ? { status }    : {}),
      ...(programId ? { programId } : {}),
      ...(userId    ? { userId }    : {}),
      ...(category  ? { category }  : {}),
      ...(from || to
        ? { uploadDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to) }   : {}),
          } }
        : {}),
    };

    const [evidences, total] = await Promise.all([
      fastify.prisma.evidence.findMany({
        where, skip, take: limit, orderBy: { uploadDate: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.evidence.count({ where }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.evidence,
      evidences.map((e) => e.storagePath),
    );

    const data = evidences.map((e) => ({
      ...e,
      fileSize:    Number(e.fileSize),
      downloadUrl: urlMap.get(e.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.patch('/evidence/bulk-status', { preHandler: requireAdmin }, async (request, reply) => {
    const { ids, status, notes } = (request.body as { ids: number[]; status: string; notes?: string });
    if (!ids?.length) throw new AppError('VALIDATION_ERROR', 'ids required', 400);

    const validStatuses = ['verified', 'rejected'];
    if (!validStatuses.includes(status)) throw new AppError('VALIDATION_ERROR', 'Invalid status', 400);

    const evidences = await fastify.prisma.evidence.findMany({ where: { id: { in: ids } } });

    await fastify.prisma.evidence.updateMany({
      where: { id: { in: ids } },
      data:  { status: status as 'verified' | 'rejected', notes, verifiedById: request.user!.id, verifiedAt: new Date() },
    });

    const users = await fastify.prisma.user.findMany({
      where:  { id: { in: evidences.map((e) => e.userId) } },
      select: { id: true, firstName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    await Promise.all(
      evidences.flatMap((ev) => {
        const user = userMap.get(ev.userId);
        return [
          createNotification(fastify.prisma, fastify.wsRegistry, {
            userId:   ev.userId,
            type:     status === 'verified' ? 'evidence_verified' : 'evidence_rejected',
            title:    `Evidence ${status}`,
            body:     notes ?? `Your evidence has been ${status}.`,
            metadata: { evidenceId: ev.id },
          }),
          user && sendEmail({
            to:      user.email,
            subject: status === 'verified' ? 'Your evidence has been verified' : 'Your evidence needs attention',
            html:    status === 'verified'
              ? evidenceVerifiedEmail(user.firstName)
              : evidenceRejectedEmail(user.firstName, notes),
          }),
        ].filter(Boolean);
      }),
    );

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     `bulk_${status}_evidence`,
      targetType: 'evidence',
      targetId:   ids.join(','),
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.send({ success: true, data: { updated: ids.length } });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/evidence/:id/status',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid evidence ID', 400);

      const { status, notes } = updateEvidenceStatusSchema.parse(request.body);

      const evidence = await fastify.prisma.evidence.update({
        where: { id },
        data:  { status, notes, verifiedById: request.user!.id, verifiedAt: new Date() },
      });

      const notifType = status === 'verified' ? 'evidence_verified' : 'evidence_rejected';

      const user = await fastify.prisma.user.findUnique({
        where:  { id: evidence.userId },
        select: { firstName: true, email: true },
      });

      await Promise.all([
        createNotification(fastify.prisma, fastify.wsRegistry, {
          userId:   evidence.userId,
          type:     notifType,
          title:    `Evidence ${status}`,
          body:     notes ?? `Your evidence has been ${status}.`,
          metadata: { evidenceId: id },
        }),
        user && sendEmail({
          to:      user.email,
          subject: status === 'verified' ? 'Your evidence has been verified' : 'Your evidence needs attention',
          html:    status === 'verified'
            ? evidenceVerifiedEmail(user.firstName)
            : evidenceRejectedEmail(user.firstName, notes),
        }),
      ]);

      fastify.wsRegistry.push(evidence.userId, {
        type: 'evidence_reviewed',
        data: { evidenceId: id, status: evidence.status, notes: notes ?? undefined },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     `${status}_evidence`,
        targetType: 'evidence',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: { ...evidence, fileSize: Number(evidence.fileSize) } });
    },
  );
}
