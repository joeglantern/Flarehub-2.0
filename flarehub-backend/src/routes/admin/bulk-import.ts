import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/require-admin.js';
import { sendEmail } from '../../services/email.service.js';
import { appConfig } from '../../config/index.js';

const FRONTEND_URL = process.env.FRONTEND_URL ?? appConfig.allowedOrigins[0] ?? 'https://app.afosihub.com';

const importRowSchema = z.object({
  firstName:      z.string().min(1),
  lastName:       z.string().default(''),
  email:          z.string().email(),
  phone:          z.string().optional().nullable(),
  county:         z.string().optional().nullable(),
  gender:         z.enum(['Male', 'Female', 'Other', 'Unknown']).default('Unknown'),
  businessName:   z.string().optional().nullable(),
  businessStage:  z.enum(['Idea', 'Prototype', 'MVP', 'Revenue']).optional().nullable(),
  businessPlanUrl: z.string().optional().nullable(),
});

const bulkImportSchema = z.object({
  programId: z.number().int().positive().optional(),
  users:     z.array(importRowSchema).min(1).max(300),
});

export default async function bulkImportRoutes(fastify: FastifyInstance) {
  fastify.post('/admin/bulk-import/users', { preHandler: requireAdmin }, async (request, reply) => {
    const { programId, users } = bulkImportSchema.parse(request.body);

    let created = 0;
    let skipped = 0;
    const failed: { email: string; reason: string }[] = [];

    for (const row of users) {
      try {
        const emailNorm = row.email.toLowerCase().trim();
        const existing = await fastify.prisma.user.findUnique({ where: { email: emailNorm } });
        if (existing) {
          skipped++;
          continue;
        }

        const { data: authData, error: authError } = await fastify.supabase.auth.admin.createUser({
          email:         emailNorm,
          email_confirm: true,
          user_metadata: { firstName: row.firstName, lastName: row.lastName },
        });

        let userId: string;

        if (authError || !authData.user) {
          // User may already exist in Supabase auth — look them up via REST API
          const res = await fetch(
            `${appConfig.supabase.url}/auth/v1/admin/users?email=${encodeURIComponent(emailNorm)}`,
            { headers: { 'Authorization': `Bearer ${appConfig.supabase.serviceRoleKey}`, 'apikey': appConfig.supabase.serviceRoleKey } }
          );
          const body = await res.json() as { users?: { id: string }[] };
          const existingAuthUser = body.users?.[0];
          if (!existingAuthUser) {
            failed.push({ email: row.email, reason: authError?.message ?? 'Supabase user not found' });
            continue;
          }
          userId = existingAuthUser.id;
        } else {
          userId = authData.user.id;
        }

        await fastify.prisma.user.create({
          data: {
            id:             userId,
            email:          emailNorm,
            firstName:      row.firstName,
            lastName:       row.lastName,
            phone:          row.phone ?? null,
            county:         row.county ?? null,
            gender:         row.gender ?? 'Unknown',
            businessName:   row.businessName ?? null,
            businessStage:  row.businessStage ?? null,
            businessPlanUrl: row.businessPlanUrl ?? null,
            isVerified:     true,
            profileComplete: false,
          },
        });

        if (programId) {
          await fastify.prisma.application.upsert({
            where:  { userId_programId: { userId, programId } },
            update: {},
            create: {
              userId,
              programId,
              status:      'Approved',
              submittedAt: new Date(),
            },
          });
        }

        const { data: linkData } = await fastify.supabase.auth.admin.generateLink({
          type:  'recovery',
          email: emailNorm,
          options: { redirectTo: `${FRONTEND_URL}/update-password` },
        });

        const actionLink = (linkData as { properties?: { action_link?: string } } | null)
          ?.properties?.action_link;

        await sendEmail({
          to:      emailNorm,
          subject: 'You\'re invited to Flarehub — set your password',
          html:    inviteEmailHtml(row.firstName, actionLink ?? FRONTEND_URL),
        });

        created++;
      } catch (err: unknown) {
        failed.push({
          email:  row.email,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return reply.send({ success: true, data: { created, skipped, failed } });
  });
}

function inviteEmailHtml(firstName: string, inviteUrl: string): string {
  return `
    <h2 style="font-size:22px;font-weight:700;color:#1a1917;margin:0 0 12px;">Welcome to Flarehub, ${firstName}!</h2>
    <p style="font-size:15px;color:#4a4744;line-height:1.6;margin:0 0 8px;">
      You've been enrolled in the <strong>Sheria ya Vijana!</strong> mentorship programme by AFOSI.
    </p>
    <p style="font-size:15px;color:#4a4744;line-height:1.6;margin:0 0 28px;">
      Click below to set your password and access your Flarehub account, where you'll connect with your
      mentor, track your progress, and access programme resources.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#1d6f42;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.01em;">
      Set my password →
    </a>
    <p style="font-size:13px;color:#a39e98;margin:24px 0 0;line-height:1.5;">
      This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.
    </p>
  `;
}
