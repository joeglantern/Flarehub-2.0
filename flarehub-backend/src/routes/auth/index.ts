import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';
import { requireAuth } from '../../middleware/require-auth.js';
import { AppError } from '../../types/index.js';
import { appConfig } from '../../config/index.js';

const AUTH_RATE_LIMIT = { max: 10, timeWindow: 60_000 };
// Stricter limit — this endpoint is unauthenticated and triggers outbound email
const FORGOT_RATE_LIMIT = { max: 5, timeWindow: 15 * 60_000 };
// OTP redemption — unauthenticated, guessable 6-digit codes, keep this tight
const OTP_RATE_LIMIT = { max: 8, timeWindow: 15 * 60_000 };

const FRONTEND_URL = process.env.FRONTEND_URL ?? appConfig.allowedOrigins[0] ?? 'https://app.afosihub.com';

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/sync-user', { preHandler: requireAuth, config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const user = request.user!;

    const existing = await fastify.prisma.user.findUnique({ where: { id: user.id } });

    if (existing) {
      return reply.status(200).send({
        success: true,
        data: { ...existing, isNewUser: false },
      });
    }

    const created = await fastify.prisma.user.create({
      data: {
        id:        user.id,
        email:     user.email,
        firstName: '',
        lastName:  '',
      },
    });

    return reply.status(201).send({
      success: true,
      data: { ...created, isNewUser: true },
    });
  });

  // Public — always responds success so account existence is never revealed.
  // Sends via Supabase Auth's own mailer (configure custom SMTP in the Supabase
  // dashboard under Auth → SMTP Settings for reliable delivery at volume — the
  // default hosted mailer is rate-limited).
  fastify.post('/auth/forgot-password', { config: { rateLimit: FORGOT_RATE_LIMIT } }, async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);

    const genericResponse = { success: true as const, data: { message: 'If an account exists for that email, a reset link has been sent.' } };

    try {
      const { error } = await fastify.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${FRONTEND_URL}/update-password`,
      });
      if (error) {
        fastify.log.error({ email, err: error }, 'Failed to send password reset email via Supabase');
      }
    } catch (err) {
      fastify.log.error({ email, err }, 'Failed to send password reset email via Supabase');
    }

    return reply.send(genericResponse);
  });

  // Public — redeem an admin-issued one-time code (relayed to the user by
  // hand, e.g. over WhatsApp) to set a new password without needing email.
  fastify.post('/auth/reset-with-otp', { config: { rateLimit: OTP_RATE_LIMIT } }, async (request, reply) => {
    const { email, code, newPassword } = z.object({
      email:       z.string().email(),
      code:        z.string().length(6),
      newPassword: z.string().min(8),
    }).parse(request.body);

    const invalidError = new AppError('INVALID_OTP', 'That code is invalid or has expired', 400);

    const user = await fastify.prisma.user.findFirst({
      where:  { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!user) throw invalidError;

    const otp = await fastify.prisma.passwordResetOtp.findFirst({
      where: {
        userId:    user.id,
        codeHash:  hashOtp(code),
        usedAt:    null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) throw invalidError;

    const { error } = await fastify.supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) {
      fastify.log.error({ userId: user.id, err: error }, 'Failed to set password via OTP');
      throw new AppError('INTERNAL_ERROR', 'Could not reset password — please try again', 500);
    }

    await fastify.prisma.passwordResetOtp.update({
      where: { id: otp.id },
      data:  { usedAt: new Date() },
    });

    return reply.send({ success: true, data: { message: 'Password updated. You can now sign in.' } });
  });

  fastify.get('/auth/profile-check', { preHandler: requireAuth, config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const user = request.user!;

    const dbUser = await fastify.prisma.user.findUnique({
      where:  { id: user.id },
      select: { profileComplete: true, role: true, isMentor: true },
    });

    if (!dbUser) throw new AppError('NOT_FOUND', 'User not found', 404);

    return reply.send({
      success: true,
      data: {
        profileComplete: dbUser.profileComplete,
        role:            dbUser.role,
        isMentor:        dbUser.isMentor,
      },
    });
  });
}
