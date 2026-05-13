import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  createUserSubmissionSchema,
  userSubmissionQuerySchema,
  userSubmissionStatusSchema,
} from '../../schemas/admin.schema.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl, getSignedDownloadUrls } from '../../services/storage.service.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { appConfig } from '../../config/index.js';
import { randomUUID } from 'crypto';

export default async function userSubmissionRoutes(fastify: FastifyInstance) {
  fastify.post('/user-submissions', { preHandler: requireAuth }, async (request, reply) => {
    const body = createUserSubmissionSchema.parse(request.body);
    const userId = request.user!.id;

    const template = await fastify.prisma.adminTemplate.findUnique({ where: { id: body.templateId } });
    if (!template) throw new AppError('NOT_FOUND', 'Template not found', 404);

    const submission = await fastify.prisma.userSubmission.create({
      data: {
        templateId:     body.templateId,
        userId,
        submissionName: body.submissionName,
        filename:       randomUUID(),
        originalName:   body.originalName,
        storagePath:    body.storagePath,
        fileSize:       body.fileSize,
        fileType:       body.fileType,
      },
    });

    return reply.status(201).send({ success: true, data: submission });
  });

  fastify.get('/user-submissions/me', { preHandler: requireAuth }, async (request, reply) => {
    const query = userSubmissionQuerySchema.parse(request.query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const userId = request.user!.id;

    const [submissions, total] = await Promise.all([
      fastify.prisma.userSubmission.findMany({
        where:   { userId },
        skip,
        take:    limit,
        orderBy: { submittedAt: 'desc' },
        include: { template: { select: { id: true, title: true, templateType: true } } },
      }),
      fastify.prisma.userSubmission.count({ where: { userId } }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.submissions,
      submissions.map((s) => s.storagePath),
    );

    const data = submissions.map((s) => ({
      ...s,
      downloadUrl: urlMap.get(s.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.get<{ Params: { id: string } }>('/user-submissions/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid submission ID', 400);

    const submission = await fastify.prisma.userSubmission.findUnique({
      where:   { id },
      include: { template: { select: { id: true, title: true, templateType: true } } },
    });
    if (!submission) throw new AppError('NOT_FOUND', 'Submission not found', 404);

    const isAdmin = ['admin', 'super_admin'].includes(request.user!.role);
    if (!isAdmin && submission.userId !== request.user!.id) {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }

    const downloadUrl = await getSignedDownloadUrl(fastify.supabase, appConfig.storage.buckets.submissions, submission.storagePath);
    return reply.send({ success: true, data: { ...submission, downloadUrl } });
  });

  fastify.get('/user-submissions', { preHandler: requireAdmin }, async (request, reply) => {
    const query = userSubmissionQuerySchema.parse(request.query);
    const { page, limit, templateId, status, userId, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(templateId ? { templateId } : {}),
      ...(status     ? { status }     : {}),
      ...(userId     ? { userId }     : {}),
      ...(search
        ? {
            OR: [
              { submissionName: { contains: search, mode: 'insensitive' as const } },
              { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
              { user: { email:     { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [submissions, total] = await Promise.all([
      fastify.prisma.userSubmission.findMany({
        where, skip, take: limit, orderBy: { submittedAt: 'desc' },
        include: {
          template: { select: { id: true, title: true, templateType: true } },
          user:     { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      fastify.prisma.userSubmission.count({ where }),
    ]);

    const urlMap = await getSignedDownloadUrls(
      fastify.supabase, appConfig.storage.buckets.submissions,
      submissions.map((s) => s.storagePath),
    );

    const data = submissions.map((s) => ({
      ...s,
      downloadUrl: urlMap.get(s.storagePath) ?? null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/user-submissions/:id/status',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid submission ID', 400);

      const { status, notes } = userSubmissionStatusSchema.parse(request.body);

      const submission = await fastify.prisma.userSubmission.update({
        where: { id },
        data:  { status, notes },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   submission.userId,
        type:     'submission_reviewed',
        title:    'Your submission has been reviewed',
        body:     notes ?? `Your submission status is now: ${status}`,
        metadata: { submissionId: id, status },
      });

      fastify.wsRegistry.push(submission.userId, {
        type: 'submission_reviewed',
        data: { submissionId: id, status: submission.status, notes: notes ?? undefined },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     `reviewed_submission_as_${status}`,
        targetType: 'submission',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: submission });
    },
  );
}
