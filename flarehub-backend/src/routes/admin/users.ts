import type { FastifyInstance } from 'fastify';
import { randomInt, createHash } from 'crypto';
import { requireAdmin } from '../../middleware/require-admin.js';
import { requireSuperAdmin } from '../../middleware/require-super-admin.js';
import {
  adminUserQuerySchema,
  updateRoleSchema,
  updateVerifySchema,
  updateMentorStatusSchema,
} from '../../schemas/admin.schema.js';
import { AppError } from '../../types/index.js';
import { getSignedDownloadUrl, getSignedDownloadUrls } from '../../services/storage.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';
import { exportUsers } from '../../services/csv.service.js';
import { appConfig } from '../../config/index.js';

const OTP_TTL_MINUTES = 15;

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export default async function adminUserRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/users', { preHandler: requireAdmin }, async (request, reply) => {
    const query = adminUserQuerySchema.parse(request.query);
    const { page, limit, search, role, county, isVerified, isMentor, businessStage } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(role          ? { role }          : {}),
      ...(county        ? { county }        : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
      ...(isMentor  !== undefined ? { isMentor }  : {}),
      ...(businessStage ? { businessStage } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName:  { contains: search, mode: 'insensitive' as const } },
              { email:     { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      fastify.prisma.user.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      fastify.prisma.user.count({ where }),
    ]);

    const profilePaths = users.map((u) => u.profilePic).filter((p): p is string => !!p);
    const urlMap = profilePaths.length > 0
      ? await getSignedDownloadUrls(fastify.supabase, appConfig.storage.buckets.profiles, profilePaths).catch(() => new Map<string, string>())
      : new Map<string, string>();

    const data = users.map((u) => ({
      ...u,
      profilePic: u.profilePic ? (urlMap.get(u.profilePic) ?? null) : null,
    }));

    return reply.send({
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.get('/admin/users/export', { preHandler: requireAdmin }, async (request, reply) => {
    const query = adminUserQuerySchema.parse(request.query);
    const { search, role, county, isVerified, isMentor, businessStage } = query;

    const where = {
      ...(role          ? { role }          : {}),
      ...(county        ? { county }        : {}),
      ...(isVerified !== undefined ? { isVerified } : {}),
      ...(isMentor  !== undefined ? { isMentor }  : {}),
      ...(businessStage ? { businessStage } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName:  { contains: search, mode: 'insensitive' as const } },
              { email:     { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const users = await fastify.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10_000 });
    const csv = await exportUsers(users);

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="users.csv"')
      .send(csv);
  });

  fastify.get<{ Params: { id: string } }>('/admin/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;

    const user = await fastify.prisma.user.findUnique({
      where:   { id },
      include: {
        applications:        { include: { program: { select: { name: true } } } },
        smartGoal:           true,
        milestonePlan:       true,
        marketResearch:      true,
        evidence:            true,
        documents:           true,
        userSubmissions:     { include: { template: { select: { title: true } } } },
        businessPlan:        true,
        menteeRelationships: {
          include: {
            mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          take: 1,
        },
      },
    });

    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    return reply.send({ success: true, data: user });
  });

  fastify.patch<{ Params: { id: string } }>('/admin/users/:id/role', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const { id } = request.params;
    const { role } = updateRoleSchema.parse(request.body);

    const existing = await fastify.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('NOT_FOUND', 'User not found', 404);

    const user = await fastify.prisma.user.update({ where: { id }, data: { role } });

    await logAdminAction(fastify.prisma, {
      adminId:     request.user!.id,
      action:      `changed_user_role_to_${role}`,
      targetType:  'user',
      targetId:    id,
      ipAddress:   request.ip,
      userAgent:   request.headers['user-agent'],
    });

    return reply.send({ success: true, data: user });
  });

  fastify.patch<{ Params: { id: string } }>('/admin/users/:id/verify', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    const { isVerified } = updateVerifySchema.parse(request.body);

    const user = await fastify.prisma.user.update({ where: { id }, data: { isVerified } });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     isVerified ? 'verified_user' : 'unverified_user',
      targetType: 'user',
      targetId:   id,
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.send({ success: true, data: user });
  });

  fastify.patch<{ Params: { id: string } }>('/admin/users/:id/mentor-status', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;
    const { isMentor } = updateMentorStatusSchema.parse(request.body);

    const user = await fastify.prisma.user.update({ where: { id }, data: { isMentor } });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     isMentor ? 'promoted_to_mentor' : 'removed_mentor_status',
      targetType: 'user',
      targetId:   id,
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.send({ success: true, data: user });
  });

  // Generate a one-time password reset code for a user that the admin relays
  // by hand (e.g. over WhatsApp) — for when the user can't be reached by email.
  fastify.post<{ Params: { id: string } }>('/admin/users/:id/reset-otp', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params;

    const user = await fastify.prisma.user.findUnique({ where: { id }, select: { id: true, firstName: true, lastName: true, phone: true } });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const code      = randomInt(100_000, 1_000_000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await fastify.prisma.passwordResetOtp.create({
      data: {
        userId:      user.id,
        codeHash:    hashOtp(code),
        expiresAt,
        createdById: request.user!.id,
      },
    });

    await logAdminAction(fastify.prisma, {
      adminId:    request.user!.id,
      action:     'generated_password_reset_otp',
      targetType: 'user',
      targetId:   id,
      ipAddress:  request.ip,
      userAgent:  request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: {
        code,
        expiresAt,
        userPhone: user.phone,
      },
    });
  });
}
