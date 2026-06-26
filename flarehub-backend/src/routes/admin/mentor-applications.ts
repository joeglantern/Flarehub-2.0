import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { createNotification } from '../../services/notification.service.js';
import { sendEmail } from '../../services/email.service.js';
import { logAdminAction } from '../../services/admin-log.service.js';

export default async function adminMentorApplicationRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/mentor-applications', { preHandler: requireAdmin }, async (request, reply) => {
    const { status, page, limit } = z.object({
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      page:   z.coerce.number().int().positive().default(1),
      limit:  z.coerce.number().int().positive().max(100).default(20),
    }).parse(request.query);

    const skip  = (page - 1) * limit;
    const where = status ? { status } : {};

    const [applications, total] = await Promise.all([
      fastify.prisma.mentorApplication.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, profilePic: true, county: true },
          },
        },
      }),
      fastify.prisma.mentorApplication.count({ where }),
    ]);

    return reply.send({
      success: true,
      data:    applications,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.patch<{ Params: { id: string } }>(
    '/admin/mentor-applications/:id/approve',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id        = parseInt(request.params.id, 10);
      const { programId } = z.object({
        programId: z.coerce.number().int().positive().optional(),
      }).parse(request.body);

      const application = await fastify.prisma.mentorApplication.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
      if (application.status !== 'pending') {
        throw new AppError('BUSINESS_RULE_VIOLATION', 'Application already reviewed', 422);
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.mentorApplication.update({
          where: { id },
          data:  { status: 'approved', reviewedById: request.user!.id, reviewedAt: new Date() },
        });
        await tx.user.update({
          where: { id: application.userId },
          data:  { isMentor: true, role: 'mentor' },
        });
        if (programId) {
          await tx.programMentor.upsert({
            where:  { programId_mentorId: { programId, mentorId: application.userId } },
            create: { programId, mentorId: application.userId },
            update: {},
          });
        }
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   application.userId,
        type:     'mentor_application_approved',
        title:    'Your mentor application was approved!',
        body:     'Welcome to Afosihub as a mentor. You can now log in to your mentor dashboard.',
        metadata: {},
      });

      await sendEmail({
        to:      application.user.email,
        subject: 'Your Afosihub mentor application has been approved',
        html:    mentorApprovedEmail(application.user.firstName),
      });

      await logAdminAction(fastify.prisma, {
        adminId:     request.user!.id,
        action:      'approved_mentor_application',
        targetType:  'user',
        targetId:    application.userId,
        description: `Approved mentor application for ${application.user.email}`,
        ipAddress:   request.ip,
        userAgent:   request.headers['user-agent'],
      });

      return reply.send({ success: true });
    },
  );

  fastify.patch<{ Params: { id: string } }>(
    '/admin/mentor-applications/:id/reject',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const { notes } = z.object({
        notes: z.string().optional(),
      }).parse(request.body);

      const application = await fastify.prisma.mentorApplication.findUnique({
        where: { id },
        include: { user: true },
      });
      if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);
      if (application.status !== 'pending') {
        throw new AppError('BUSINESS_RULE_VIOLATION', 'Application already reviewed', 422);
      }

      await fastify.prisma.mentorApplication.update({
        where: { id },
        data:  { status: 'rejected', adminNotes: notes, reviewedById: request.user!.id, reviewedAt: new Date() },
      });

      await createNotification(fastify.prisma, fastify.wsRegistry, {
        userId:   application.userId,
        type:     'mentor_application_rejected',
        title:    'Mentor application update',
        body:     'Your mentor application was not approved at this time.',
        metadata: {},
      });

      await sendEmail({
        to:      application.user.email,
        subject: 'Update on your Afosihub mentor application',
        html:    mentorRejectedEmail(application.user.firstName, notes),
      });

      await logAdminAction(fastify.prisma, {
        adminId:     request.user!.id,
        action:      'rejected_mentor_application',
        targetType:  'user',
        targetId:    application.userId,
        description: `Rejected mentor application for ${application.user.email}`,
        ipAddress:   request.ip,
        userAgent:   request.headers['user-agent'],
      });

      return reply.send({ success: true });
    },
  );
}

function mentorApprovedEmail(firstName: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:40px auto;">
    <tr><td style="background:#1d6f42;border-radius:12px 12px 0 0;padding:24px 36px;">
      <span style="font-size:20px;font-weight:800;color:#fff;font-family:Georgia,serif;">Afosihub</span>
    </td></tr>
    <tr><td style="background:#fff;padding:36px;border:1px solid #e2ddd7;border-top:none;">
      <div style="display:inline-block;padding:4px 12px;border-radius:6px;background:#edf7f1;color:#1d6f42;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px;">Approved</div>
      <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1a1916;font-family:Georgia,serif;">Welcome to Afosihub, ${firstName}!</h1>
      <p style="margin:0 0 14px;font-size:15px;color:#6b6560;line-height:1.65;">Your mentor application has been approved. You are now an official Afosihub mentor.</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b6560;line-height:1.65;">Log in to access your mentor dashboard, connect with entrepreneurs, and start making an impact.</p>
      <a href="https://app.afosihub.com/mentor" style="display:inline-block;padding:13px 26px;background:#1d6f42;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">Go to mentor dashboard &rarr;</a>
      <hr style="border:none;border-top:1px solid #e2ddd7;margin:28px 0;">
      <p style="margin:0;font-size:13px;color:#a39e98;">&#8212; The Afosihub Team</p>
    </td></tr>
    <tr><td style="background:#f0ede8;border:1px solid #e2ddd7;border-top:none;border-radius:0 0 12px 12px;padding:14px 36px;">
      <p style="margin:0;font-size:10px;color:#a39e98;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;">Afosihub &middot; Kenya &middot; app.afosihub.com</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function mentorRejectedEmail(firstName: string, notes?: string): string {
  const notesBlock = notes
    ? `<div style="margin:20px 0;padding:14px 18px;background:#fdf2ed;border-radius:10px;border:1px solid #f9ddd1;">
        <p style="margin:0 0 4px;font-size:10px;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;color:#c4522a;">Notes from our team</p>
        <p style="margin:0;font-size:14px;color:#1a1916;line-height:1.6;">${notes}</p>
      </div>`
    : '';
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:40px auto;">
    <tr><td style="background:#1d6f42;border-radius:12px 12px 0 0;padding:24px 36px;">
      <span style="font-size:20px;font-weight:800;color:#fff;font-family:Georgia,serif;">Afosihub</span>
    </td></tr>
    <tr><td style="background:#fff;padding:36px;border:1px solid #e2ddd7;border-top:none;">
      <div style="display:inline-block;padding:4px 12px;border-radius:6px;background:#fdf2ed;color:#c4522a;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px;">Application Update</div>
      <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1a1916;font-family:Georgia,serif;">Hi ${firstName},</h1>
      <p style="margin:0 0 14px;font-size:15px;color:#6b6560;line-height:1.65;">Thank you for your interest in becoming a Afosihub mentor. After careful review, we are unable to move forward with your application at this time.</p>
      ${notesBlock}
      <p style="margin:0 0 14px;font-size:15px;color:#6b6560;line-height:1.65;">We encourage you to keep building your expertise and apply again in the future.</p>
      <hr style="border:none;border-top:1px solid #e2ddd7;margin:28px 0;">
      <p style="margin:0;font-size:13px;color:#a39e98;">&#8212; The Afosihub Team</p>
    </td></tr>
    <tr><td style="background:#f0ede8;border:1px solid #e2ddd7;border-top:none;border-radius:0 0 12px 12px;padding:14px 36px;">
      <p style="margin:0;font-size:10px;color:#a39e98;font-family:monospace;letter-spacing:.08em;text-transform:uppercase;">Afosihub &middot; Kenya &middot; app.afosihub.com</p>
    </td></tr>
  </table>
</body>
</html>`;
}
