import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import {
  createProgramSchema,
  updateProgramSchema,
  programQuerySchema,
} from '../../schemas/program.schema.js';
import { formSchemaSchema } from '../../schemas/applicationForm.schema.js';
import { AppError } from '../../types/index.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { sendEmail, newProgramEmail } from '../../services/email.service.js';
import { Prisma } from '@prisma/client';
import type { FormSchema } from '../../types/applicationForm.js';

export default async function programRoutes(fastify: FastifyInstance) {

  // ── GET /programs ─────────────────────────────────────────────────────────
  fastify.get('/programs', async (request, reply) => {
    const query = programQuerySchema.parse(request.query);
    const { page, limit, search, status, tag } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [programs, total] = await Promise.all([
      fastify.prisma.program.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      fastify.prisma.program.count({ where }),
    ]);

    const data = programs.map((p) => ({
      ...p,
      applicationCount:    p._count.applications,
      hasApplicationForm:  p.applicationForm !== null,
      applicationForm:     undefined,   // never expose full schema in list
      _count:              undefined,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  // ── GET /programs/:id ─────────────────────────────────────────────────────
  fastify.get<{ Params: { id: string } }>('/programs/:id', async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

    const program = await fastify.prisma.program.findUnique({
      where:   { id },
      include: { _count: { select: { applications: true } } },
    });

    if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);

    let hasApplied = false;
    try {
      await request.server.authenticate(request, reply);
      if (request.user) {
        const app = await fastify.prisma.application.findUnique({
          where: { userId_programId: { userId: request.user.id, programId: id } },
        });
        hasApplied = !!app;
      }
    } catch {
      // unauthenticated — hasApplied stays false
    }

    return reply.send({
      success: true,
      data: {
        ...program,
        applicationCount:   program._count.applications,
        hasApplicationForm: program.applicationForm !== null,
        applicationForm:    undefined,  // fetched separately via GET /programs/:id/form
        _count:             undefined,
        hasApplied,
      },
    });
  });

  // ── GET /programs/:id/form ────────────────────────────────────────────────
  // Returns the raw FormSchema for admin builder + applicant renderer
  fastify.get<{ Params: { id: string } }>(
    '/programs/:id/form',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const program = await fastify.prisma.program.findUnique({
        where:  { id },
        select: { id: true, applicationForm: true },
      });

      if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);

      return reply.send({ success: true, data: program.applicationForm ?? null });
    },
  );

  // ── PUT /programs/:id/form ────────────────────────────────────────────────
  // Replaces (or clears) the application form schema for a program
  fastify.put<{ Params: { id: string } }>(
    '/programs/:id/form',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const program = await fastify.prisma.program.findUnique({ where: { id } });
      if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);

      // Body can be a FormSchema object or null (to clear the form)
      const body = request.body as unknown;
      let applicationForm: FormSchema | null = null;

      if (body !== null && body !== undefined) {
        const parsed = formSchemaSchema.safeParse(body);
        if (!parsed.success) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Invalid form schema',
            400,
            parsed.error.flatten().fieldErrors,
          );
        }
        applicationForm = parsed.data as FormSchema;
      }

      const updated = await fastify.prisma.program.update({
        where: { id },
        data:  {
          applicationForm: applicationForm
            ? (applicationForm as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
        select: { id: true, applicationForm: true },
      });

      await logAdminAction(fastify.prisma, {
        adminId:     request.user!.id,
        action:      applicationForm ? 'updated_program_form' : 'cleared_program_form',
        targetType:  'program',
        targetId:    String(id),
        description: applicationForm
          ? `Form has ${applicationForm.sections.length} section(s) and ${applicationForm.sections.reduce((n, s) => n + s.fields.length, 0)} field(s)`
          : 'Form cleared',
        ipAddress:   request.ip,
        userAgent:   request.headers['user-agent'],
      });

      return reply.send({ success: true, data: updated.applicationForm ?? null });
    },
  );

  // ── POST /programs ────────────────────────────────────────────────────────
  fastify.post('/programs', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createProgramSchema.parse(request.body);

    const program = await fastify.prisma.program.create({
      data: {
        name:                    body.name,
        description:             body.description,
        applicationDeadline:     body.applicationDeadline ? new Date(body.applicationDeadline) : undefined,
        status:                  body.status ?? 'Active',
        maxParticipants:         body.maxParticipants,
        grantAmount:             body.grantAmount,
        eligibilityRequirements: body.eligibilityRequirements,
        tags:                    body.tags ?? [],
      },
    });

    const verifiedUsers = await fastify.prisma.user.findMany({
      where:  { isVerified: true },
      select: { id: true, firstName: true, email: true },
    });

    if (verifiedUsers.length > 0) {
      await fastify.prisma.notification.createMany({
        data: verifiedUsers.map((u) => ({
          userId:   u.id,
          type:     'new_program' as const,
          title:    'New program available',
          body:     `${program.name} is now open for applications.`,
          metadata: { programId: program.id },
        })),
      });

      // Fire-and-forget — don't block the response while emailing everyone
      void Promise.all(
        verifiedUsers.map((u) =>
          sendEmail({
            to:      u.email,
            subject: `New program: ${program.name}`,
            html:    newProgramEmail(u.firstName, program.name),
          }),
        ),
      );
    }

    fastify.wsRegistry.broadcast({ type: 'new_program', data: { programId: program.id, programName: program.name } });

    return reply.status(201).send({ success: true, data: { ...program, hasApplicationForm: false } });
  });

  // ── PATCH /programs/:id ───────────────────────────────────────────────────
  fastify.patch<{ Params: { id: string } }>('/programs/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

    const body = updateProgramSchema.parse(request.body);

    const program = await fastify.prisma.program.update({
      where: { id },
      data:  {
        ...body,
        applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : undefined,
      },
    });

    return reply.send({ success: true, data: { ...program, hasApplicationForm: program.applicationForm !== null } });
  });

  // ── DELETE /programs/:id ──────────────────────────────────────────────────
  fastify.delete<{ Params: { id: string } }>('/programs/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

    const appCount = await fastify.prisma.application.count({ where: { programId: id } });
    if (appCount > 0) {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Cannot delete a program with existing applications', 422);
    }

    await fastify.prisma.program.delete({ where: { id } });
    return reply.status(204).send();
  });
}
