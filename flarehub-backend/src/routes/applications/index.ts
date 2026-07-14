import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  applySchema,
  updateApplicationStatusSchema,
  updateApplicationCommentSchema,
  updateDraftResponsesSchema,
  bulkStatusSchema,
  applicationQuerySchema,
} from '../../schemas/application.schema.js';
import { formResponseSchema } from '../../schemas/applicationForm.schema.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { exportApplications } from '../../services/csv.service.js';
import { sendEmail, applicationApprovedEmail, applicationRejectedEmail, applicationUnderReviewEmail } from '../../services/email.service.js';
import { sendSms, smsTemplates } from '../../services/sms.service.js';
import { validateFormResponse } from '../../utils/validateFormResponse.js';
import { getSignedDownloadUrl } from '../../services/storage.service.js';
import { appConfig } from '../../config/index.js';
import type { FormSchema, FormResponse, FieldResponseValue, FileResponseValue } from '../../types/applicationForm.js';
import { Prisma, type NotificationType } from '@prisma/client';

function isFileResponse(v: unknown): v is FileResponseValue {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'filePath' in v && 'fileName' in v;
}

async function resolveApplicationFileUrls(
  supabase: FastifyInstance['supabase'],
  responses: Record<string, FieldResponseValue>,
): Promise<Record<string, FieldResponseValue>> {
  const resolved = { ...responses };
  await Promise.all(
    Object.entries(resolved).map(async ([key, val]) => {
      if (isFileResponse(val) && val.filePath) {
        try {
          const signedUrl = await getSignedDownloadUrl(
            supabase,
            appConfig.storage.buckets.submissions,
            val.filePath,
          );
          resolved[key] = { ...val, filePath: signedUrl };
        } catch {
          // If signing fails, leave the raw path — don't crash the request
        }
      }
    }),
  );
  return resolved;
}

function statusToNotificationType(status: string): NotificationType | null {
  if (status === 'Approved')    return 'application_approved';
  if (status === 'Rejected')    return 'application_rejected';
  if (status === 'UnderReview') return 'application_under_review';
  return null;
}

export default async function applicationRoutes(fastify: FastifyInstance) {

  // ── GET /applications/me ──────────────────────────────────────────────────
  fastify.get('/applications/me', { preHandler: requireAuth }, async (request, reply) => {
    const applications = await fastify.prisma.application.findMany({
      where:   { userId: request.user!.id },
      include: { program: { select: { name: true } } },
      orderBy: { appliedAt: 'desc' },
    });

    const data = applications.map((a) => ({
      id:          a.id,
      programId:   a.programId,
      programName: a.program.name,
      status:      a.status,
      isDraft:     a.isDraft,
      submittedAt: a.submittedAt,
      appliedAt:   a.appliedAt,
    }));

    return reply.send({ success: true, data });
  });

  // ── GET /applications/:id ─────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/applications/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

    const currentUser = request.user!;
    const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);

    const application = await fastify.prisma.application.findUnique({
      where:   { id },
      include: {
        program: { select: { id: true, name: true, description: true, applicationForm: true } },
        score:   true,
        ...(isAdmin ? { user: { select: { id: true, firstName: true, lastName: true, email: true } } } : {}),
      },
    });

    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
    if (!isAdmin && application.userId !== currentUser.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    // Resolve file storage paths → signed download URLs
    let resolvedApplication: typeof application = application;
    const rawResponses = application.responses as { version?: number; fields?: Record<string, unknown> } | null;
    if (rawResponses?.fields) {
      const resolvedFields = await resolveApplicationFileUrls(
        fastify.supabase,
        rawResponses.fields as Record<string, FieldResponseValue>,
      );
      resolvedApplication = {
        ...application,
        responses: { ...rawResponses, fields: resolvedFields } as typeof application.responses,
      };
    }

    return reply.send({ success: true, data: resolvedApplication });
  });

  // ── POST /applications ────────────────────────────────────────────────────
  fastify.post('/applications', { preHandler: requireAuth }, async (request, reply) => {
    const { programId, isDraft, responses } = applySchema.parse(request.body);
    const userId = request.user!.id;

    // Validate program exists and is open
    const program = await fastify.prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);
    if (program.status !== 'Active') {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Program is not active', 422);
    }
    if (program.applicationDeadline && new Date() > program.applicationDeadline) {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Application deadline has passed', 422);
    }

    // Check for existing application
    const existing = await fastify.prisma.application.findUnique({
      where: { userId_programId: { userId, programId } },
    });

    // ── Form validation ───────────────────────────────────────────────────
    const formSchema = program.applicationForm as FormSchema | null;

    // Additional forms allow re-submission (upsert overwrites previous response)
    const isAdditionalForm =
      (formSchema?.settings as { purpose?: string } | undefined)?.purpose === 'additional';

    if (existing && !existing.isDraft && !isAdditionalForm) {
      throw new AppError('CONFLICT', 'You have already submitted an application for this program', 409);
    }

    if (formSchema && !isDraft) {
      // Full submission: responses are required and must be valid
      if (!responses) {
        throw new AppError(
          'FORM_VALIDATION_FAILED',
          'This program requires a completed application form',
          422,
        );
      }

      // Structural validation (Zod)
      const parsed = formResponseSchema.safeParse(responses);
      if (!parsed.success) {
        throw new AppError(
          'FORM_VALIDATION_FAILED',
          'Invalid form response structure',
          422,
          parsed.error.flatten().fieldErrors,
        );
      }

      // Business logic validation (required fields, options, conditional logic)
      const validationErrors = validateFormResponse(formSchema, responses as FormResponse);
      if (validationErrors.length > 0) {
        throw new AppError(
          'FORM_VALIDATION_FAILED',
          'Please fill in all required fields',
          422,
          validationErrors,
        );
      }
    }

    const now = new Date();
    const applicationData = {
      userId,
      programId,
      isDraft:     isDraft ?? false,
      responses:   responses ? (responses as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      submittedAt: isDraft ? null : now,
    };

    // Upsert: update existing draft or create new application
    const application = existing
      ? await fastify.prisma.application.update({
          where: { userId_programId: { userId, programId } },
          data:  applicationData,
        })
      : await fastify.prisma.application.create({
          data: applicationData,
        });

    // Only fire notifications/emails for final submissions (not drafts)
    if (!isDraft) {
      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId,
        type:     'application_approved',  // reuse as "submitted" — could be a separate type
        title:    'Application submitted',
        body:     `Your application for ${program.name} has been submitted and is under review.`,
        metadata: { applicationId: application.id, programId },
      }).catch(() => {/* non-critical */});
    }

    return reply.status(existing ? 200 : 201).send({ success: true, data: application });
  });

  // ── PATCH /applications/:id/draft ─────────────────────────────────────────
  // Auto-save endpoint — updates responses on an existing draft (no full validation)
  fastify.patch<{ Params: { id: string } }>(
    '/applications/:id/draft',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

      const { responses } = updateDraftResponsesSchema.parse(request.body);
      const userId = request.user!.id;

      const application = await fastify.prisma.application.findUnique({ where: { id } });
      if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
      if (application.userId !== userId) throw new AppError('FORBIDDEN', 'Access denied', 403);
      if (!application.isDraft) throw new AppError('BUSINESS_RULE_VIOLATION', 'Cannot update a submitted application', 422);

      const updated = await fastify.prisma.application.update({
        where: { id },
        data:  { responses: responses as unknown as Prisma.InputJsonValue, updatedAt: new Date() },
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // ── PATCH /applications/:id/comment ───────────────────────────────────────
  // Admin leaves a comment/feedback on an application
  fastify.patch<{ Params: { id: string } }>(
    '/applications/:id/comment',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

      const { adminComment } = updateApplicationCommentSchema.parse(request.body);

      const application = await fastify.prisma.application.findUnique({ where: { id } });
      if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);

      const updated = await fastify.prisma.application.update({
        where: { id },
        data:  { adminComment },
      });

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     'commented_on_application',
        targetType: 'application',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // ── PATCH /applications/:id/status ────────────────────────────────────────
  fastify.patch<{ Params: { id: string } }>(
    '/applications/:id/status',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);

      const { status } = updateApplicationStatusSchema.parse(request.body);

      const application = await fastify.prisma.application.update({
        where:   { id },
        data:    { status },
        include: { program: { select: { name: true } } },
      });

      const notifType = statusToNotificationType(status);
      if (notifType) {
        await createNotification(fastify.prisma, fastify.wsRegistry, {
          userId:   application.userId,
          type:     notifType,
          title:    `Application ${status.toLowerCase()}`,
          body:     `Your application for ${application.program.name} has been ${status.toLowerCase()}.`,
          metadata: { applicationId: id, programId: application.programId },
        });

        fastify.wsRegistry.push(application.userId, {
          type: 'application_status_changed',
          data: { applicationId: id, programName: application.program.name, status: application.status },
        });

        const user = await fastify.prisma.user.findUnique({
          where:  { id: application.userId },
          select: { email: true, firstName: true, phone: true },
        });
        if (user) {
          const htmlFn =
            status === 'Approved'    ? applicationApprovedEmail :
            status === 'Rejected'    ? applicationRejectedEmail :
            applicationUnderReviewEmail;
          await sendEmail({
            to:      user.email,
            subject: `Application ${status} — ${application.program.name}`,
            html:    htmlFn(user.firstName, application.program.name),
          });
          if (status === 'Approved' || status === 'Rejected') {
            await sendSms(user.phone,
              status === 'Approved'
                ? smsTemplates.applicationApproved(application.program.name)
                : smsTemplates.applicationRejected(application.program.name),
            );
          }
        }
      }

      await logAdminAction(fastify.prisma, {
        adminId:    request.user!.id,
        action:     `updated_application_status_to_${status}`,
        targetType: 'application',
        targetId:   String(id),
        ipAddress:  request.ip,
        userAgent:  request.headers['user-agent'],
      });

      return reply.send({ success: true, data: application });
    },
  );

  // ── GET /applications (admin) ─────────────────────────────────────────────
  fastify.get('/applications', { preHandler: requireAdmin }, async (request, reply) => {
    const query = applicationQuerySchema.parse(request.query);
    const { page, limit, status, programId, search, from, to } = query;
    const skip = (page - 1) * limit;

    const where = {
      isDraft: false,  // admins only see submitted applications
      ...(status    ? { status }    : {}),
      ...(programId ? { programId } : {}),
      ...(from || to
        ? { appliedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to) }   : {}),
            } }
        : {}),
      ...(search
        ? {
            OR: [
              { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
              { user: { lastName:  { contains: search, mode: 'insensitive' as const } } },
              { user: { email:     { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [applications, total] = await Promise.all([
      fastify.prisma.application.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          user:    { select: { firstName: true, lastName: true, email: true } },
          program: { select: { name: true, applicationForm: true } },
          score:   true,
        },
      }),
      fastify.prisma.application.count({ where }),
    ]);

    // Include hasApplicationForm flag without exposing full schema in list
    const data = applications.map((a) => ({
      ...a,
      program: {
        name:               a.program.name,
        hasApplicationForm: a.program.applicationForm !== null,
      },
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  // ── GET /applications/export ───────────────────────────────────────────────
  fastify.get('/applications/export', { preHandler: requireAdmin }, async (request, reply) => {
    const query = applicationQuerySchema.parse(request.query);
    const { status, programId, search, from, to } = query;

    const where = {
      isDraft: false,
      ...(status    ? { status }    : {}),
      ...(programId ? { programId } : {}),
      ...(from || to
        ? { appliedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to) }   : {}),
            } }
        : {}),
      ...(search
        ? {
            OR: [
              { user: { firstName: { contains: search, mode: 'insensitive' as const } } },
              { user: { lastName:  { contains: search, mode: 'insensitive' as const } } },
              { user: { email:     { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const applications = await fastify.prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        user:    { select: { firstName: true, lastName: true, email: true } },
        program: { select: { name: true } },
        score:   true,
      },
    });

    const csv = await exportApplications(
      applications.map((a) => ({ ...a, responses: a.responses as Record<string, unknown> | null })),
    );
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="applications.csv"')
      .send(csv);
  });

  // ── PATCH /applications/bulk-status ───────────────────────────────────────
  fastify.patch('/applications/bulk-status', { preHandler: requireAdmin }, async (request, reply) => {
    const { ids, status } = bulkStatusSchema.parse(request.body);

    const applications = await fastify.prisma.application.findMany({
      where:   { id: { in: ids } },
      include: { program: { select: { name: true } } },
    });

    await fastify.prisma.application.updateMany({
      where: { id: { in: ids } },
      data:  { status },
    });

    const notifType = statusToNotificationType(status);
    if (notifType) {
      await Promise.all(
        applications.map((a) =>
          createNotification(fastify.prisma, fastify.wsRegistry, {
            userId:   a.userId,
            type:     notifType,
            title:    `Application ${status.toLowerCase()}`,
            body:     `Your application for ${a.program.name} has been ${status.toLowerCase()}.`,
            metadata: { applicationId: a.id, programId: a.programId },
          }),
        ),
      );

      for (const a of applications) {
        fastify.wsRegistry.push(a.userId, {
          type: 'application_status_changed',
          data: { applicationId: a.id, programName: a.program.name, status },
        });
      }
    }

    await logAdminAction(fastify.prisma, {
      adminId:     request.user!.id,
      action:      `bulk_updated_applications_to_${status}`,
      targetType:  'application',
      description: `Updated ${ids.length} applications`,
      ipAddress:   request.ip,
      userAgent:   request.headers['user-agent'],
    });

    return reply.send({ success: true, data: { updated: ids.length } });
  });
}
