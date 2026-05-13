import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { updateUserSchema } from '../../schemas/user.schema.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl } from '../../services/storage.service.js';
import { appConfig } from '../../config/index.js';

function isProfileComplete(user: {
  firstName: string;
  lastName: string;
  phone: string | null;
  county: string | null;
  gender: string;
  businessName: string | null;
  businessStage: string | null;
}): boolean {
  return !!(
    user.firstName &&
    user.lastName &&
    user.phone &&
    user.county &&
    user.gender !== 'Unknown' &&
    user.businessName &&
    user.businessStage
  );
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user!.id },
    });

    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    let profilePicUrl: string | null = null;
    if (user.profilePic) {
      profilePicUrl = await getSignedDownloadUrl(
        fastify.supabase,
        appConfig.storage.buckets.profiles,
        user.profilePic,
      );
    }

    return reply.send({ success: true, data: { ...user, profilePic: profilePicUrl } });
  });

  fastify.patch('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const body = updateUserSchema.parse(request.body);

    const updated = await fastify.prisma.user.update({
      where: { id: request.user!.id },
      data:  body,
    });

    const shouldMarkComplete = isProfileComplete(updated);
    const final = shouldMarkComplete && !updated.profileComplete
      ? await fastify.prisma.user.update({
          where: { id: updated.id },
          data:  { profileComplete: true },
        })
      : updated;

    let profilePicUrl: string | null = null;
    if (final.profilePic) {
      profilePicUrl = await getSignedDownloadUrl(
        fastify.supabase,
        appConfig.storage.buckets.profiles,
        final.profilePic,
      );
    }

    return reply.send({ success: true, data: { ...final, profilePic: profilePicUrl } });
  });

  // Search users by name / email — any authenticated user can use this
  fastify.get('/users/search', { preHandler: requireAuth }, async (request, reply) => {
    const { q } = (request.query as { q?: string });
    if (!q || q.trim().length < 2) return reply.send({ success: true, data: [] });

    const users = await fastify.prisma.user.findMany({
      where: {
        id:  { not: request.user!.id },
        OR: [
          { firstName: { contains: q.trim(), mode: 'insensitive' } },
          { lastName:  { contains: q.trim(), mode: 'insensitive' } },
          { email:     { contains: q.trim(), mode: 'insensitive' } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isMentor: true },
      take: 15,
      orderBy: { firstName: 'asc' },
    });

    return reply.send({ success: true, data: users });
  });

  fastify.get<{ Params: { id: string } }>('/users/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params;
    const currentUser = request.user!;
    const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);

    if (!isAdmin) {
      if (currentUser.isMentor) {
        const assignment = await fastify.prisma.mentorMentee.findFirst({
          where: { mentorId: currentUser.id, menteeId: id },
        });
        if (!assignment) throw new AppError('FORBIDDEN', 'Access denied', 403);
      } else {
        throw new AppError('FORBIDDEN', 'Access denied', 403);
      }
    }

    const user = await fastify.prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    let profilePicUrl: string | null = null;
    if (user.profilePic) {
      profilePicUrl = await getSignedDownloadUrl(
        fastify.supabase,
        appConfig.storage.buckets.profiles,
        user.profilePic,
      );
    }

    return reply.send({ success: true, data: { ...user, profilePic: profilePicUrl } });
  });

  fastify.get('/users/me/activity', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const [applications, submissions, evidence, documents] = await Promise.all([
      fastify.prisma.application.findMany({
        where:   { userId },
        orderBy: { updatedAt: 'desc' },
        take:    20,
        include: { program: { select: { name: true } } },
      }),
      Promise.all([
        fastify.prisma.smartGoal.findUnique({ where: { userId }, select: { id: true, createdAt: true, updatedAt: true } }),
        fastify.prisma.milestonePlan.findUnique({ where: { userId }, select: { id: true, createdAt: true, updatedAt: true } }),
        fastify.prisma.marketResearch.findUnique({ where: { userId }, select: { id: true, createdAt: true, updatedAt: true } }),
      ]),
      fastify.prisma.evidence.findMany({
        where:   { userId },
        orderBy: { uploadDate: 'desc' },
        take:    10,
        select:  { id: true, fileName: true, status: true, uploadDate: true, updatedAt: true },
      }),
      fastify.prisma.document.findMany({
        where:   { userId },
        orderBy: { uploadedAt: 'desc' },
        take:    10,
        select:  { id: true, originalName: true, status: true, uploadedAt: true },
      }),
    ]);

    const [smartGoal, milestonePlan, marketResearch] = submissions;

    const activity = [
      ...applications.map((a) => ({
        type: 'application' as const,
        description: `Applied to ${a.program.name} — status: ${a.status}`,
        date: a.updatedAt,
      })),
      ...(smartGoal ? [{
        type: 'submission' as const,
        description: 'SMART Goals submitted',
        date: smartGoal.updatedAt,
      }] : []),
      ...(milestonePlan ? [{
        type: 'submission' as const,
        description: 'Milestone Plan submitted',
        date: milestonePlan.updatedAt,
      }] : []),
      ...(marketResearch ? [{
        type: 'submission' as const,
        description: 'Market Research submitted',
        date: marketResearch.updatedAt,
      }] : []),
      ...evidence.map((e) => ({
        type: 'evidence' as const,
        description: `Evidence uploaded: ${e.fileName} (${e.status})`,
        date: e.updatedAt,
      })),
      ...documents.map((d) => ({
        type: 'document' as const,
        description: `Document uploaded: ${d.originalName} (${d.status})`,
        date: d.uploadedAt,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);

    return reply.send({ success: true, data: activity });
  });
}
