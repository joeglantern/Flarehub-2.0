import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { generateEntrepreneurReport, generateProgramReport } from '../../services/pdf.service.js';

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { userId: string } }>(
    '/reports/entrepreneur/:userId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId } = request.params;
      const currentUser = request.user!;
      const isAdmin = ['admin', 'super_admin'].includes(currentUser.role);

      if (!isAdmin && currentUser.id !== userId) {
        throw new AppError('FORBIDDEN', 'Access denied', 403);
      }

      const [user, applications, smartGoal, milestonePlan, marketResearch, evidence, businessPlan] =
        await Promise.all([
          fastify.prisma.user.findUnique({ where: { id: userId } }),
          fastify.prisma.application.findMany({
            where:   { userId },
            include: { program: { select: { name: true } } },
            orderBy: { appliedAt: 'desc' },
          }),
          fastify.prisma.smartGoal.findUnique({ where: { userId } }),
          fastify.prisma.milestonePlan.findUnique({ where: { userId } }),
          fastify.prisma.marketResearch.findUnique({ where: { userId } }),
          fastify.prisma.evidence.findMany({ where: { userId }, orderBy: { uploadDate: 'desc' } }),
          fastify.prisma.businessPlan.findUnique({ where: { userId } }),
        ]);

      if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

      const stream = generateEntrepreneurReport({
        user: {
          firstName: user.firstName, lastName: user.lastName,
          email: user.email, phone: user.phone,
          county: user.county, businessName: user.businessName,
          businessStage: user.businessStage ?? null,
          businessDescription: user.businessDescription,
          createdAt: user.createdAt,
        },
        applications: applications.map((a) => ({
          id: a.id, status: a.status,
          program: { name: a.program.name },
          appliedAt: a.appliedAt,
        })),
        smartGoal:     smartGoal ? {
          goalStatement: smartGoal.goalStatement, specific: smartGoal.specific,
          measurable: smartGoal.measurable, achievable: smartGoal.achievable,
          relevant: smartGoal.relevant, timebound: smartGoal.timebound,
          adminComment: smartGoal.adminComment,
        } : null,
        milestonePlan: milestonePlan ? {
          businessName: milestonePlan.businessName,
          grantAmount:  milestonePlan.grantAmount,
          milestones:   milestonePlan.milestones,
        } : null,
        marketResearch: marketResearch ? {
          businessName:   marketResearch.businessName,
          surveyObjective: marketResearch.surveyObjective,
          topChallenges:  marketResearch.topChallenges,
        } : null,
        evidence: evidence.map((e) => ({
          fileName: e.fileName, status: e.status, category: e.category,
        })),
        businessPlan: businessPlan ? { planData: businessPlan.planData } : null,
      });

      const filename = `afosihub-report-${user.firstName}-${user.lastName}.pdf`
        .toLowerCase().replace(/\s+/g, '-');

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(stream);
    },
  );

  fastify.get<{ Params: { programId: string } }>(
    '/reports/program/:programId',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const programId = parseInt(request.params.programId, 10);
      if (isNaN(programId)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const program = await fastify.prisma.program.findUnique({ where: { id: programId } });
      if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);

      const statusCounts = await fastify.prisma.application.groupBy({
        by: ['status'],
        where: { programId },
        _count: { status: true },
      });
      const countMap = Object.fromEntries(statusCounts.map((r) => [r.status, r._count.status]));
      const approved   = countMap['Approved']    ?? 0;
      const rejected   = countMap['Rejected']    ?? 0;
      const underReview = countMap['UnderReview'] ?? 0;
      const pending    = countMap['Pending']     ?? 0;
      const total      = approved + rejected + underReview + pending;

      const stream = generateProgramReport({
        program: {
          id: program.id, name: program.name,
          description: program.description, status: program.status,
          createdAt: program.createdAt,
        },
        totalApplications: total,
        approved, rejected, pending, underReview,
      });

      const filename = `afosihub-program-${program.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(stream);
    },
  );
}
