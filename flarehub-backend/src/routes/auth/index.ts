import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { AppError } from '../../types/index.js';
import { sendEmail, passwordResetEmail } from '../../services/email.service.js';
import { appConfig } from '../../config/index.js';

const AUTH_RATE_LIMIT = { max: 10, timeWindow: 60_000 };
// Stricter limit — this endpoint is unauthenticated and triggers outbound email
const FORGOT_RATE_LIMIT = { max: 5, timeWindow: 15 * 60_000 };

const FRONTEND_URL = process.env.FRONTEND_URL ?? appConfig.allowedOrigins[0] ?? 'https://app.afosihub.com';

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

  // Public — always responds success so account existence is never revealed
  fastify.post('/auth/forgot-password', { config: { rateLimit: FORGOT_RATE_LIMIT } }, async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);

    const genericResponse = { success: true as const, data: { message: 'If an account exists for that email, a reset link has been sent.' } };

    const user = await fastify.prisma.user.findFirst({
      where:  { email: { equals: email, mode: 'insensitive' } },
      select: { email: true, firstName: true },
    });

    if (!user) return reply.send(genericResponse);

    try {
      const { data: linkData, error: linkError } = await fastify.supabase.auth.admin.generateLink({
        type:    'recovery',
        email:   user.email,
        options: { redirectTo: `${FRONTEND_URL}/update-password` },
      });

      const actionLink = (linkData as { properties?: { action_link?: string } } | null)
        ?.properties?.action_link;

      if (linkError || !actionLink) {
        fastify.log.error({ email: user.email, err: linkError }, 'Failed to generate recovery link');
        return reply.send(genericResponse);
      }

      await sendEmail({
        to:      user.email,
        subject: 'Reset your Afosihub password',
        html:    passwordResetEmail(user.firstName, actionLink),
      });
    } catch (err) {
      fastify.log.error({ email: user.email, err }, 'Failed to send password reset email');
    }

    return reply.send(genericResponse);
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
