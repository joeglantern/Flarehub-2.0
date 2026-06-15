import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireMentor } from '../../middleware/require-mentor.js';
import { z } from 'zod';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';

export default async function mentorshipApplicationRoutes(fastify: FastifyInstance) {
  // Public — get mentor + program info from invite token (no auth required)
  fastify.get<{ Params: { token: string } }>(
    '/mentorship/apply/:token',
    async (request, reply) => {
      const { token } = request.params;

      const link = await fastify.prisma.mentorInviteLink.findUnique({
        where: { token },
        include: {
          programMentor: {
            include: {
              mentor: {
                select: {
                  id: true, firstName: true, lastName: true,
                  email: true, profilePic: true, county: true,
                },
              },
              program: {
                select: { id: true, name: true, description: true, status: true, tags: true },
              },
            },
          },
        },
      });

      if (!link) throw new AppError('NOT_FOUND', 'Invite link not found', 404);
      if (!link.isActive) throw new AppError('GONE', 'This invite link is no longer active', 410);

      return reply.send({
        success: true,
        data: {
          mentor: link.programMentor.mentor,
          program: link.programMentor.program,
          programMentorId: link.programMentorId,
          linkId: link.id,
        },
      });
    },
  );

  // Submit a mentorship application via invite link (requires auth)
  fastify.post<{ Params: { token: string } }>(
    '/mentorship/apply/:token',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { token } = request.params;
      const entrepreneurId = request.user!.id;
      const { message } = z.object({ message: z.string().max(1000).optional() }).parse(request.body);

      if (request.user!.role !== 'entrepreneur') {
        throw new AppError('BUSINESS_RULE_VIOLATION', 'Only entrepreneurs can apply for mentorship', 422);
      }

      const link = await fastify.prisma.mentorInviteLink.findUnique({
        where: { token },
        include: {
          programMentor: {
            include: {
              mentor: { select: { id: true, firstName: true, lastName: true } },
              program: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!link) throw new AppError('NOT_FOUND', 'Invite link not found', 404);
      if (!link.isActive) throw new AppError('GONE', 'This invite link is no longer active', 410);

      const existing = await fastify.prisma.mentorshipApplication.findUnique({
        where: {
          programMentorId_entrepreneurId: {
            programMentorId: link.programMentorId,
            entrepreneurId,
          },
        },
      });
      if (existing) {
        throw new AppError('CONFLICT', 'You have already applied to this mentor for this program', 409);
      }

      const app = await fastify.prisma.mentorshipApplication.create({
        data: {
          programMentorId: link.programMentorId,
          entrepreneurId,
          inviteLinkId: link.id,
          message,
        },
      });

      const entrepreneur = await fastify.prisma.user.findUnique({
        where: { id: entrepreneurId },
        select: { firstName: true, lastName: true },
      });
      const mentorId = link.programMentor.mentor.id;
      const programName = link.programMentor.program.name;
      const entrepreneurName = `${entrepreneur?.firstName ?? ''} ${entrepreneur?.lastName ?? ''}`.trim();

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId: mentorId,
        type: 'mentorship_application_received',
        title: 'New mentorship application',
        body: `${entrepreneurName} has applied for mentorship on ${programName}.`,
        metadata: { applicationId: app.id, entrepreneurId },
      });

      fastify.wsRegistry.push(mentorId, {
        type: 'mentorship_application_received',
        data: { applicationId: app.id, entrepreneurName, programName },
      });

      return reply.status(201).send({ success: true, data: app });
    },
  );

  // Mentor — list incoming applications
  fastify.get('/mentor/mentorship-applications', { preHandler: requireMentor }, async (request, reply) => {
    const mentorId = request.user!.id;
    const { status } = z.object({
      status: z.enum(['pending', 'accepted', 'rejected']).optional(),
    }).parse(request.query);

    const rows = await fastify.prisma.mentorshipApplication.findMany({
      where: {
        programMentor: { mentorId },
        ...(status ? { status } : {}),
      },
      include: {
        entrepreneur: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            profilePic: true, businessName: true, businessStage: true, county: true,
          },
        },
        programMentor: {
          select: { program: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: rows });
  });

  // Mentor — accept or reject an application
  fastify.patch<{ Params: { id: string } }>(
    '/mentor/mentorship-applications/:id',
    { preHandler: requireMentor },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid application ID', 400);
      const mentorId = request.user!.id;
      const { status } = z.object({
        status: z.enum(['accepted', 'rejected']),
      }).parse(request.body);

      const app = await fastify.prisma.mentorshipApplication.findUnique({
        where: { id },
        include: {
          programMentor: {
            include: {
              program: { select: { name: true } },
              mentor: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      if (!app) throw new AppError('NOT_FOUND', 'Application not found', 404);
      if (app.programMentor.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);
      if (app.status !== 'pending') throw new AppError('CONFLICT', 'Application already responded to', 409);

      const updated = await fastify.prisma.mentorshipApplication.update({
        where: { id },
        data: { status, respondedAt: new Date() },
      });

      const mentorName = `${app.programMentor.mentor.firstName} ${app.programMentor.mentor.lastName}`;
      const programName = app.programMentor.program.name;

      const notifType = status === 'accepted'
        ? 'mentorship_application_accepted'
        : 'mentorship_application_rejected';
      const notifTitle = status === 'accepted' ? 'Mentorship application accepted!' : 'Mentorship application update';
      const notifBody = status === 'accepted'
        ? `${mentorName} has accepted your mentorship application for ${programName}.`
        : `${mentorName} could not take you on as a mentee for ${programName} at this time.`;

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId: app.entrepreneurId,
        type: notifType,
        title: notifTitle,
        body: notifBody,
        metadata: { applicationId: id, mentorId },
      });

      fastify.wsRegistry.push(app.entrepreneurId, {
        type: notifType,
        data: { applicationId: id, status, mentorName, programName },
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // Entrepreneur — list own mentorship applications
  fastify.get('/entrepreneur/mentorship-applications', { preHandler: requireAuth }, async (request, reply) => {
    if (request.user!.role !== 'entrepreneur') {
      throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
    const entrepreneurId = request.user!.id;

    const rows = await fastify.prisma.mentorshipApplication.findMany({
      where: { entrepreneurId },
      include: {
        programMentor: {
          include: {
            mentor: {
              select: {
                id: true, firstName: true, lastName: true,
                email: true, profilePic: true, county: true,
              },
            },
            program: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: rows });
  });
}
