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
  // Enroll already-imported users into a program by email list
  fastify.post('/admin/bulk-enroll', { preHandler: requireAdmin }, async (request, reply) => {
    const { programId, emails } = z.object({
      programId: z.number().int().positive(),
      emails:    z.array(z.string().email()).min(1).max(300),
    }).parse(request.body);

    let enrolled = 0;
    let notFound = 0;

    for (const email of emails) {
      const user = await fastify.prisma.user.findFirst({
        where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
        select: { id: true },
      });
      if (!user) { notFound++; continue; }

      await fastify.prisma.application.upsert({
        where:  { userId_programId: { userId: user.id, programId } },
        update: {},
        create: { userId: user.id, programId, status: 'Approved', submittedAt: new Date() },
      });
      enrolled++;
    }

    return reply.send({ success: true, data: { enrolled, notFound } });
  });

  fastify.post('/admin/bulk-import/users', { preHandler: requireAdmin }, async (request, reply) => {
    const { programId, users } = bulkImportSchema.parse(request.body);

    let created = 0;
    let skipped = 0;
    const failed: { email: string; reason: string }[] = [];

    for (const row of users) {
      try {
        const emailNorm = row.email.toLowerCase().trim();

        // Case-insensitive lookup — handles emails stored with wrong case from earlier imports
        const existing = await fastify.prisma.user.findFirst({
          where: { email: { equals: emailNorm, mode: 'insensitive' } },
        });
        if (existing) {
          // Still enroll in program even if account already exists
          if (programId) {
            await fastify.prisma.application.upsert({
              where:  { userId_programId: { userId: existing.id, programId } },
              update: {},
              create: { userId: existing.id, programId, status: 'Approved', submittedAt: new Date() },
            });
          }
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
          // If a DB record with this UUID already exists (different email casing), count as skipped
          const existingById = await fastify.prisma.user.findUnique({ where: { id: userId } });
          if (existingById) { skipped++; continue; }
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
          subject: 'Congratulations! Your Flarehub account is ready',
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

export function inviteEmailHtml(firstName: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f3;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background:#1d6f42;border-radius:14px 14px 0 0;padding:24px 36px;">
              <span style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;font-family:Georgia,'Times New Roman',serif;">Flarehub</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 32px;border-left:1px solid #e2ddd7;border-right:1px solid #e2ddd7;">

              <div style="display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;font-family:ui-monospace,'Courier New',monospace;background:#edf7f1;color:#1d6f42;margin-bottom:20px;">
                You have been selected
              </div>

              <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#1a1916;letter-spacing:-0.02em;line-height:1.15;font-family:Georgia,'Times New Roman',serif;">
                Congratulations, ${firstName}!
              </h1>

              <p style="margin:0 0 14px;font-size:15px;color:#6b6560;line-height:1.65;">
                You have been selected to join <strong style="color:#1a1916;">Flarehub</strong> as part of the
                <strong style="color:#1a1916;">Sheria ya Vijana!</strong> mentorship programme, a 12-month
                EU-funded initiative that connects young entrepreneurs in Nairobi and Kwale with experienced mentors.
              </p>

              <p style="margin:0 0 28px;font-size:15px;color:#6b6560;line-height:1.65;">
                Activate your account to get matched with a mentor, set your business goals, and access all programme resources.
              </p>

              <a href="${inviteUrl}" style="display:inline-block;padding:13px 28px;background:#1d6f42;color:#ffffff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                Activate my account &rarr;
              </a>

              <div style="border-top:1px solid #e2ddd7;margin:28px 0;"></div>

              <p style="margin:0;font-size:12px;color:#a39e98;line-height:1.6;">
                This link expires in <strong>7 days</strong>. If you were not expecting this email you can safely ignore it.
                For help, write to <a href="mailto:hello@afosihub.com" style="color:#a39e98;text-decoration:underline;">hello@afosihub.com</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0ede8;border:1px solid #e2ddd7;border-top:none;border-radius:0 0 14px 14px;padding:18px 36px;">
              <p style="margin:0;font-size:10px;color:#a39e98;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;">
                Flarehub &nbsp;&middot;&nbsp; Kenya &nbsp;&middot;&nbsp; <a href="https://app.flarehub.org" style="color:#a39e98;text-decoration:none;">app.flarehub.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
