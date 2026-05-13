import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { mentorAssignmentSchema } from '../../schemas/admin.schema.js';
import { z } from 'zod';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { sendEmail, mentorAssignedEmail } from '../../services/email.service.js';
import { sendSms, smsTemplates } from '../../services/sms.service.js';

export default async function adminMentorRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/mentors', { preHandler: requireAdmin }, async (request, reply) => {
    const query = z.object({
      page:  z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }).parse(request.query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [mentors, total] = await Promise.all([
      fastify.prisma.user.findMany({
        where:   { isMentor: true },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { mentorRelationships: true } } },
      }),
      fastify.prisma.user.count({ where: { isMentor: true } }),
    ]);

    const data = mentors.map((m) => ({
      ...m,
      menteeCount: m._count.mentorRelationships,
      _count:      undefined,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.get<{ Params: { mentorId: string } }>('/admin/mentors/:mentorId/mentees', { preHandler: requireAdmin }, async (request, reply) => {
    const { mentorId } = request.params;

    const assignments = await fastify.prisma.mentorMentee.findMany({
      where:   { mentorId },
      include: { mentee: true },
      orderBy: { assignedAt: 'desc' },
    });

    return reply.send({ success: true, data: assignments.map((a) => a.mentee) });
  });

  fastify.post('/admin/mentor-assignments', { preHandler: requireAdmin }, async (request, reply) => {
    const { mentorId, menteeId } = mentorAssignmentSchema.parse(request.body);

    const mentor = await fastify.prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor) throw new AppError('NOT_FOUND', 'Mentor not found', 404);
    if (!mentor.isMentor) throw new AppError('BUSINESS_RULE_VIOLATION', 'User is not a mentor', 422);

    const existing = await fastify.prisma.mentorMentee.findFirst({ where: { mentorId, menteeId } });
    if (existing) throw new AppError('CONFLICT', 'Assignment already exists', 409);

    const assignment = await fastify.prisma.mentorMentee.create({
      data: { mentorId, menteeId },
    });

    await createNotification(fastify.prisma, fastify.wsRegistry, {
      userId:   menteeId,
      type:     'mentor_assigned',
      title:    'You have been assigned a mentor',
      body:     `${mentor.firstName} ${mentor.lastName} has been assigned as your mentor.`,
      metadata: { mentorId },
    });

    fastify.wsRegistry.push(menteeId, {
      type: 'mentor_assigned',
      data: { mentorId, mentorName: `${mentor.firstName} ${mentor.lastName}` },
    });

    const mentee = await fastify.prisma.user.findUnique({
      where: { id: menteeId }, select: { email: true, firstName: true, phone: true },
    });
    if (mentee) {
      const mentorName = `${mentor.firstName} ${mentor.lastName}`;
      await sendEmail({ to: mentee.email, subject: 'You have been assigned a mentor — Flarehub', html: mentorAssignedEmail(mentee.firstName, mentorName) });
      await sendSms(mentee.phone, smsTemplates.mentorAssigned(mentorName));
    }

    await logAdminAction(fastify.prisma, {
      adminId:     request.user!.id,
      action:      'assigned_mentor',
      targetType:  'user',
      targetId:    menteeId,
      description: `Assigned mentor ${mentorId} to mentee ${menteeId}`,
      ipAddress:   request.ip,
      userAgent:   request.headers['user-agent'],
    });

    return reply.status(201).send({ success: true, data: assignment });
  });

  fastify.delete('/admin/mentor-assignments', { preHandler: requireAdmin }, async (request, reply) => {
    const { mentorId, menteeId } = mentorAssignmentSchema.parse(request.body);

    const existing = await fastify.prisma.mentorMentee.findFirst({ where: { mentorId, menteeId } });
    if (!existing) throw new AppError('NOT_FOUND', 'Assignment not found', 404);

    await fastify.prisma.mentorMentee.delete({ where: { id: existing.id } });

    await createNotification(fastify.prisma, fastify.wsRegistry, {
      userId:   menteeId,
      type:     'mentor_unassigned',
      title:    'Mentor assignment removed',
      body:     'Your mentor assignment has been removed.',
      metadata: { mentorId },
    });

    fastify.wsRegistry.push(menteeId, {
      type: 'mentor_unassigned',
      data: { mentorId },
    });

    await logAdminAction(fastify.prisma, {
      adminId:     request.user!.id,
      action:      'unassigned_mentor',
      targetType:  'user',
      targetId:    menteeId,
      description: `Removed mentor ${mentorId} from mentee ${menteeId}`,
      ipAddress:   request.ip,
      userAgent:   request.headers['user-agent'],
    });

    return reply.status(204).send();
  });
}
