import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { z } from 'zod';
import { AppError } from '../../types/index.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function programMentorRoutes(fastify: FastifyInstance) {
  // List mentors assigned to a program
  fastify.get<{ Params: { programId: string } }>(
    '/admin/programs/:programId/mentors',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const programId = parseInt(request.params.programId, 10);
      if (isNaN(programId)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const rows = await fastify.prisma.programMentor.findMany({
        where: { programId },
        include: {
          mentor: {
            select: { id: true, firstName: true, lastName: true, email: true, profilePic: true },
          },
          inviteLink: { select: { id: true, token: true, isActive: true, createdAt: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const data = rows.map(r => ({
        id: r.id,
        programId: r.programId,
        mentorId: r.mentorId,
        createdAt: r.createdAt,
        mentor: r.mentor,
        inviteLink: r.inviteLink,
        applicationCount: r._count.applications,
      }));

      return reply.send({ success: true, data });
    },
  );

  // Assign mentor to program
  fastify.post<{ Params: { programId: string } }>(
    '/admin/programs/:programId/mentors',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const programId = parseInt(request.params.programId, 10);
      if (isNaN(programId)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const { mentorId } = z.object({ mentorId: z.string().min(1) }).parse(request.body);

      const [program, mentor] = await Promise.all([
        fastify.prisma.program.findUnique({ where: { id: programId } }),
        fastify.prisma.user.findUnique({ where: { id: mentorId } }),
      ]);

      if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);
      if (!mentor) throw new AppError('NOT_FOUND', 'User not found', 404);
      if (!mentor.isMentor) throw new AppError('BUSINESS_RULE_VIOLATION', 'User is not a mentor', 422);

      const existing = await fastify.prisma.programMentor.findUnique({
        where: { programId_mentorId: { programId, mentorId } },
      });
      if (existing) throw new AppError('CONFLICT', 'Mentor already assigned to this program', 409);

      const row = await fastify.prisma.programMentor.create({
        data: { programId, mentorId },
        include: {
          mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await logAdminAction(fastify.prisma, {
        adminId: request.user!.id,
        action: 'assigned_mentor_to_program',
        targetType: 'program',
        targetId: String(programId),
        description: `Assigned mentor ${mentorId} to program ${programId}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(201).send({ success: true, data: row });
    },
  );

  // Remove mentor from program
  fastify.delete<{ Params: { programId: string; mentorId: string } }>(
    '/admin/programs/:programId/mentors/:mentorId',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const programId = parseInt(request.params.programId, 10);
      if (isNaN(programId)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);
      const { mentorId } = request.params;

      const row = await fastify.prisma.programMentor.findUnique({
        where: { programId_mentorId: { programId, mentorId } },
      });
      if (!row) throw new AppError('NOT_FOUND', 'Assignment not found', 404);

      await fastify.prisma.programMentor.delete({ where: { id: row.id } });

      await logAdminAction(fastify.prisma, {
        adminId: request.user!.id,
        action: 'removed_mentor_from_program',
        targetType: 'program',
        targetId: String(programId),
        description: `Removed mentor ${mentorId} from program ${programId}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(204).send();
    },
  );

  // List programs a mentor is assigned to (for admin mentor management)
  fastify.get<{ Params: { mentorId: string } }>(
    '/admin/mentors/:mentorId/programs',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { mentorId } = request.params;

      const rows = await fastify.prisma.programMentor.findMany({
        where: { mentorId },
        include: {
          program: { select: { id: true, name: true, status: true } },
          inviteLink: { select: { id: true, token: true, isActive: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const data = rows.map(r => ({
        id: r.id,
        programId: r.programId,
        mentorId: r.mentorId,
        createdAt: r.createdAt,
        program: r.program,
        inviteLink: r.inviteLink,
        applicationCount: r._count.applications,
      }));

      return reply.send({ success: true, data });
    },
  );
}
