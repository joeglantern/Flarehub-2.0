import type { FastifyInstance } from 'fastify';
import { requireMentor } from '../../middleware/require-mentor.js';
import { z } from 'zod';
import { AppError } from '../../types/index.js';

export default async function inviteLinkRoutes(fastify: FastifyInstance) {
  // List programs this mentor is assigned to, with their invite links
  fastify.get('/mentor/programs', { preHandler: requireMentor }, async (request, reply) => {
    const mentorId = request.user!.id;

    const rows = await fastify.prisma.programMentor.findMany({
      where: { mentorId },
      include: {
        program: { select: { id: true, name: true, status: true } },
        inviteLink: { select: { id: true, token: true, isActive: true, createdAt: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = rows.map(r => ({
      id: r.id,
      programId: r.programId,
      program: r.program,
      inviteLink: r.inviteLink
        ? { ...r.inviteLink, applicationCount: r._count.applications }
        : null,
    }));

    return reply.send({ success: true, data });
  });

  // Generate (or re-generate) an invite link for a program assignment
  fastify.post('/mentor/invite-links', { preHandler: requireMentor }, async (request, reply) => {
    const mentorId = request.user!.id;
    const { programMentorId } = z.object({ programMentorId: z.number().int() }).parse(request.body);

    const pm = await fastify.prisma.programMentor.findUnique({
      where: { id: programMentorId },
    });
    if (!pm) throw new AppError('NOT_FOUND', 'Program assignment not found', 404);
    if (pm.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const existing = await fastify.prisma.mentorInviteLink.findUnique({
      where: { programMentorId },
    });
    if (existing) throw new AppError('CONFLICT', 'Invite link already exists — toggle it or delete it first', 409);

    const link = await fastify.prisma.mentorInviteLink.create({
      data: { programMentorId },
    });

    return reply.status(201).send({ success: true, data: link });
  });

  // Toggle a link active/inactive
  fastify.patch<{ Params: { id: string } }>(
    '/mentor/invite-links/:id/toggle',
    { preHandler: requireMentor },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid link ID', 400);
      const mentorId = request.user!.id;

      const link = await fastify.prisma.mentorInviteLink.findUnique({
        where: { id },
        include: { programMentor: true },
      });
      if (!link) throw new AppError('NOT_FOUND', 'Invite link not found', 404);
      if (link.programMentor.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);

      const updated = await fastify.prisma.mentorInviteLink.update({
        where: { id },
        data: { isActive: !link.isActive },
      });

      return reply.send({ success: true, data: updated });
    },
  );

  // Delete a link (mentor can regenerate a fresh token by creating a new one)
  fastify.delete<{ Params: { id: string } }>(
    '/mentor/invite-links/:id',
    { preHandler: requireMentor },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) throw new AppError('VALIDATION_ERROR', 'Invalid link ID', 400);
      const mentorId = request.user!.id;

      const link = await fastify.prisma.mentorInviteLink.findUnique({
        where: { id },
        include: { programMentor: true },
      });
      if (!link) throw new AppError('NOT_FOUND', 'Invite link not found', 404);
      if (link.programMentor.mentorId !== mentorId) throw new AppError('FORBIDDEN', 'Access denied', 403);

      await fastify.prisma.mentorInviteLink.delete({ where: { id } });

      return reply.status(204).send();
    },
  );
}
