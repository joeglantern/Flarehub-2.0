import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireMentor } from '../../middleware/require-mentor.js';
import {
  scheduleMeetingSchema,
  updateMeetingSchema,
  createNoteSchema,
  updateNoteSchema,
  meetingQuerySchema,
} from '../../schemas/mentor.schema.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { sendEmail, meetingScheduledEmail } from '../../services/email.service.js';

export default async function mentorRoutes(fastify: FastifyInstance) {
  fastify.get('/mentor/mentees', { preHandler: requireMentor }, async (request, reply) => {
    const mentorId = request.user!.id;

    const assignments = await fastify.prisma.mentorMentee.findMany({
      where:   { mentorId },
      include: {
        mentee: {
          include: {
            smartGoal:     { select: { id: true } },
            milestonePlan: { select: { id: true } },
            marketResearch:{ select: { id: true } },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const data = assignments.map((a) => ({
      id:            a.mentee.id,
      firstName:     a.mentee.firstName,
      lastName:      a.mentee.lastName,
      email:         a.mentee.email,
      county:        a.mentee.county,
      businessName:  a.mentee.businessName,
      businessStage: a.mentee.businessStage,
      assignedAt:    a.assignedAt,
      submissionProgress: {
        smartGoal:      a.mentee.smartGoal     ? 'submitted' : 'not_started',
        milestonePlan:  a.mentee.milestonePlan  ? 'submitted' : 'not_started',
        marketResearch: a.mentee.marketResearch ? 'submitted' : 'not_started',
      },
    }));

    return reply.send({ success: true, data });
  });

  fastify.get<{ Params: { menteeId: string } }>('/mentor/mentees/:menteeId', { preHandler: requireAuth }, async (request, reply) => {
    const { menteeId } = request.params;
    const currentUser = request.user!;
    const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);

    if (!isAdmin) {
      if (!currentUser.isMentor) throw new AppError('FORBIDDEN', 'Access denied', 403);
      const assignment = await fastify.prisma.mentorMentee.findFirst({
        where: { mentorId: currentUser.id, menteeId },
      });
      if (!assignment) throw new AppError('FORBIDDEN', 'This mentee is not assigned to you', 403);
    }

    const [profile, smartGoal, milestonePlan, marketResearch, evidence, documents, notes] = await Promise.all([
      fastify.prisma.user.findUnique({ where: { id: menteeId } }),
      fastify.prisma.smartGoal.findUnique({ where: { userId: menteeId } }),
      fastify.prisma.milestonePlan.findUnique({ where: { userId: menteeId } }),
      fastify.prisma.marketResearch.findUnique({ where: { userId: menteeId } }),
      fastify.prisma.evidence.findMany({ where: { userId: menteeId }, orderBy: { uploadDate: 'desc' } }),
      fastify.prisma.document.findMany({ where: { userId: menteeId }, orderBy: { uploadedAt: 'desc' } }),
      fastify.prisma.mentorNote.findMany({ where: { menteeId, mentorId: isAdmin ? undefined : currentUser.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    if (!profile) throw new AppError('NOT_FOUND', 'User not found', 404);

    return reply.send({
      success: true,
      data: {
        profile,
        smartGoal,
        milestonePlan,
        marketResearch,
        evidence: evidence.map((e) => ({ ...e, fileSize: Number(e.fileSize) })),
        documents,
        notes,
      },
    });
  });

  fastify.post('/mentor/meetings', { preHandler: requireMentor }, async (request, reply) => {
    const body = scheduleMeetingSchema.parse(request.body);
    const mentorId = request.user!.id;

    const assignment = await fastify.prisma.mentorMentee.findFirst({
      where: { mentorId, menteeId: body.menteeId },
    });
    if (!assignment) throw new AppError('BUSINESS_RULE_VIOLATION', 'Mentee is not assigned to you', 422);

    const [mentor, mentee] = await Promise.all([
      fastify.prisma.user.findUnique({
        where:  { id: mentorId },
        select: { firstName: true, lastName: true },
      }),
      fastify.prisma.user.findUnique({
        where:  { id: body.menteeId },
        select: { firstName: true, email: true },
      }),
    ]);

    const meeting = await fastify.prisma.mentorMeeting.create({
      data: {
        mentorId,
        menteeId:    body.menteeId,
        meetingTime: new Date(body.meetingTime),
        meetingType: body.meetingType,
        link:        body.link,
        location:    body.location,
        notes:       body.notes,
      },
    });

    const mentorName = `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim();

    await Promise.all([
      createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   body.menteeId,
        type:     'meeting_scheduled',
        title:    'Meeting scheduled',
        body:     `Your mentor has scheduled a meeting on ${new Date(body.meetingTime).toLocaleString()}.`,
        metadata: { meetingId: meeting.id },
      }),
      mentee && sendEmail({
        to:      mentee.email,
        subject: 'Meeting scheduled with your mentor',
        html:    meetingScheduledEmail(mentee.firstName, mentorName, new Date(body.meetingTime), body.link),
      }),
    ]);

    fastify.wsRegistry.push(body.menteeId, {
      type: 'meeting_scheduled',
      data: { ...meeting, mentorName },
    });

    return reply.status(201).send({ success: true, data: meeting });
  });

  fastify.get('/mentor/meetings', { preHandler: requireMentor }, async (request, reply) => {
    const query = meetingQuerySchema.parse(request.query);
    const { page, limit, status, from, to, menteeId } = query;
    const skip = (page - 1) * limit;
    const mentorId = request.user!.id;

    const where = {
      mentorId,
      ...(status   ? { status }   : {}),
      ...(menteeId ? { menteeId } : {}),
      ...(from || to
        ? { meetingTime: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to   ? { lte: new Date(to) }   : {}),
          } }
        : {}),
    };

    const [meetings, total] = await Promise.all([
      fastify.prisma.mentorMeeting.findMany({
        where, skip, take: limit, orderBy: { meetingTime: 'asc' },
        include: { mentee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      fastify.prisma.mentorMeeting.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    meetings,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.patch<{ Params: { id: string } }>('/mentor/meetings/:id', { preHandler: requireMentor }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid meeting ID', 400);

    const body = updateMeetingSchema.parse(request.body);
    const mentorId = request.user!.id;

    const existing = await fastify.prisma.mentorMeeting.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Meeting not found', 404);
    if (existing.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const meeting = await fastify.prisma.mentorMeeting.update({
      where: { id },
      data: {
        ...body,
        meetingTime: body.meetingTime ? new Date(body.meetingTime) : undefined,
      },
    });

    if (body.status === 'Cancelled') {
      const mentor = await fastify.prisma.user.findUnique({
        where: { id: mentorId }, select: { firstName: true, lastName: true },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   existing.menteeId,
        type:     'meeting_cancelled',
        title:    'Meeting cancelled',
        body:     `Your mentor has cancelled the meeting scheduled for ${existing.meetingTime.toLocaleString()}.`,
        metadata: { meetingId: id },
      });

      fastify.wsRegistry.push(existing.menteeId, {
        type: 'meeting_cancelled',
        data: { meetingId: id, mentorName: `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}` },
      });
    }

    return reply.send({ success: true, data: meeting });
  });

  fastify.post('/mentor/notes', { preHandler: requireMentor }, async (request, reply) => {
    const { menteeId, content } = createNoteSchema.parse(request.body);
    const mentorId = request.user!.id;

    const assignment = await fastify.prisma.mentorMentee.findFirst({
      where: { mentorId, menteeId },
    });
    if (!assignment) throw new AppError('BUSINESS_RULE_VIOLATION', 'Mentee is not assigned to you', 422);

    const note = await fastify.prisma.mentorNote.create({
      data: { mentorId, menteeId, content },
    });

    return reply.status(201).send({ success: true, data: note });
  });

  fastify.get<{ Params: { menteeId: string } }>('/mentor/notes/:menteeId', { preHandler: requireAuth }, async (request, reply) => {
    const { menteeId } = request.params;
    const currentUser = request.user!;
    const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);

    const notes = await fastify.prisma.mentorNote.findMany({
      where: {
        menteeId,
        ...(isAdmin ? {} : { mentorId: currentUser.id }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: notes });
  });

  fastify.patch<{ Params: { id: string } }>('/mentor/notes/:id', { preHandler: requireMentor }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid note ID', 400);

    const { content } = updateNoteSchema.parse(request.body);
    const mentorId = request.user!.id;

    const existing = await fastify.prisma.mentorNote.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Note not found', 404);
    if (existing.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const note = await fastify.prisma.mentorNote.update({ where: { id }, data: { content } });
    return reply.send({ success: true, data: note });
  });

  fastify.delete<{ Params: { id: string } }>('/mentor/notes/:id', { preHandler: requireMentor }, async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid note ID', 400);

    const existing = await fastify.prisma.mentorNote.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'Note not found', 404);
    if (existing.mentorId !== request.user!.id) throw new AppError('FORBIDDEN', 'Access denied', 403);

    await fastify.prisma.mentorNote.delete({ where: { id } });
    return reply.status(204).send();
  });
}
