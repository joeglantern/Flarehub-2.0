import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/require-admin.js';
import { sendEmail } from '../../services/email.service.js';
import { appConfig } from '../../config/index.js';
import { inviteEmailHtml } from './bulk-import.js';

const FRONTEND_URL = process.env.FRONTEND_URL ?? appConfig.allowedOrigins[0] ?? 'https://app.afosihub.com';

interface SupabaseAuthUser {
  id: string;
  email: string;
  last_sign_in_at?: string | null;
}

async function fetchSupabaseUsers(supabaseUrl: string, serviceRoleKey: string): Promise<SupabaseAuthUser[]> {
  const all: SupabaseAuthUser[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?per_page=1000&page=${page}`,
      { headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } },
    );
    const body = await res.json() as { users?: SupabaseAuthUser[] };
    const chunk = body.users ?? [];
    all.push(...chunk);
    if (chunk.length < 1000) break;
    page++;
  }
  return all;
}

export default async function resendInvitesRoutes(fastify: FastifyInstance) {
  // GET /admin/activation-stats?programId=X
  fastify.get('/admin/activation-stats', { preHandler: requireAdmin }, async (request, reply) => {
    const { programId } = z.object({
      programId: z.coerce.number().int().positive().optional(),
    }).parse(request.query);

    const dbUsers = await fastify.prisma.user.findMany({
      where: programId
        ? { applications: { some: { programId, status: 'Approved' } } }
        : {},
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (dbUsers.length === 0) {
      return reply.send({ success: true, data: { total: 0, activated: 0, pending: 0, pendingUsers: [] } });
    }

    const supabaseUsers = await fetchSupabaseUsers(appConfig.supabase.url, appConfig.supabase.serviceRoleKey);
    const activatedIds  = new Set(supabaseUsers.filter(u => u.last_sign_in_at).map(u => u.id));

    const total        = dbUsers.length;
    const pendingUsers = dbUsers.filter(u => !activatedIds.has(u.id));

    return reply.send({
      success: true,
      data: {
        total,
        activated:    total - pendingUsers.length,
        pending:      pendingUsers.length,
        pendingUsers: pendingUsers.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName })),
      },
    });
  });

  // POST /admin/resend-invites
  fastify.post('/admin/resend-invites', { preHandler: requireAdmin }, async (request, reply) => {
    const { programId, userIds } = z.object({
      programId: z.coerce.number().int().positive().optional(),
      userIds:   z.array(z.string().uuid()).optional(),
    }).parse(request.body);

    const dbUsers = await fastify.prisma.user.findMany({
      where: {
        ...(programId ? { applications: { some: { programId, status: 'Approved' } } } : {}),
        ...(userIds?.length ? { id: { in: userIds } } : {}),
      },
      select: { id: true, email: true, firstName: true },
    });

    // If targeting specific users, skip the sign-in check — send regardless
    let targets = dbUsers;
    let alreadyActive = 0;

    if (!userIds?.length) {
      const supabaseUsers = await fetchSupabaseUsers(appConfig.supabase.url, appConfig.supabase.serviceRoleKey);
      const activatedIds  = new Set(supabaseUsers.filter(u => u.last_sign_in_at).map(u => u.id));
      targets      = dbUsers.filter(u => !activatedIds.has(u.id));
      alreadyActive = dbUsers.length - targets.length;
    }

    const failed: { email: string; reason: string }[] = [];
    let sent = 0;

    for (const user of targets) {
      try {
        const { data: linkData } = await fastify.supabase.auth.admin.generateLink({
          type:    'recovery',
          email:   user.email,
          options: { redirectTo: `${FRONTEND_URL}/update-password` },
        });

        const actionLink = (linkData as { properties?: { action_link?: string } } | null)
          ?.properties?.action_link;

        await sendEmail({
          to:      user.email,
          subject: 'Congratulations! Your Flarehub account is ready',
          html:    inviteEmailHtml(user.firstName, actionLink ?? FRONTEND_URL),
        });

        sent++;
      } catch (err) {
        failed.push({ email: user.email, reason: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return reply.send({ success: true, data: { sent, alreadyActive, failed } });
  });
}
