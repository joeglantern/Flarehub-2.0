import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../../middleware/require-admin.js';
import { AppError } from '../../types/index.js';
import { z } from 'zod';
import { cacheGet, cacheSet, CacheKeys } from '../../services/cache.service.js';

const FIVE_MIN  = 300;
const TEN_MIN   = 600;

export default async function adminAnalyticsRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/analytics/overview', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object>(CacheKeys.analyticsOverview);
    if (cached) return reply.send({ success: true, data: cached });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalApplications, approvedApplications, rejectedApplications,
      pendingEvidence, activePrograms, totalPrograms, newUsersThisMonth,
    ] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.application.count(),
      fastify.prisma.application.count({ where: { status: 'Approved' } }),
      fastify.prisma.application.count({ where: { status: 'Rejected' } }),
      fastify.prisma.evidence.count({ where: { status: 'pending' } }),
      fastify.prisma.program.count({ where: { status: 'Active' } }),
      fastify.prisma.program.count(),
      fastify.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const successRate = totalApplications > 0
      ? Math.round((approvedApplications / totalApplications) * 1000) / 10
      : 0;

    const data = {
      totalUsers, totalApplications, approvedApplications, rejectedApplications,
      pendingEvidence, activePrograms, totalPrograms, newUsersThisMonth, successRate,
    };

    await cacheSet(CacheKeys.analyticsOverview, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/applications-by-month', { preHandler: requireAdmin }, async (request, reply) => {
    const { months } = z.object({ months: z.coerce.number().int().positive().default(6) }).parse(request.query);
    const cacheKey = CacheKeys.analyticsByMonth(months);

    const cached = await cacheGet<object[]>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    const results = await fastify.prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT TO_CHAR("appliedAt", 'YYYY-MM') AS month, COUNT(*) AS count
      FROM applications
      WHERE "appliedAt" >= NOW() - (${months} * INTERVAL '1 month')
      GROUP BY month ORDER BY month ASC
    `;

    const data = results.map((r) => ({ month: r.month, count: Number(r.count) }));
    await cacheSet(cacheKey, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/gender-distribution', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object>(CacheKeys.analyticsGender);
    if (cached) return reply.send({ success: true, data: cached });

    const genders = await fastify.prisma.user.groupBy({
      by: ['gender'], _count: { gender: true },
    });

    const data: Record<string, number> = {};
    for (const g of genders) data[g.gender] = g._count.gender;

    await cacheSet(CacheKeys.analyticsGender, data, TEN_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/county-distribution', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object[]>(CacheKeys.analyticsCounty);
    if (cached) return reply.send({ success: true, data: cached });

    const counties = await fastify.prisma.user.groupBy({
      by: ['county'], _count: { county: true }, orderBy: { _count: { county: 'desc' } },
    });

    const data = counties.filter((c) => c.county !== null).map((c) => ({ county: c.county, count: c._count.county }));
    await cacheSet(CacheKeys.analyticsCounty, data, TEN_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/submission-completion', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object>(CacheKeys.analyticsSubmissionCompletion);
    if (cached) return reply.send({ success: true, data: cached });

    const totalUsers = await fastify.prisma.user.count({ where: { role: 'entrepreneur' } });
    const [smartGoalsCount, milestonePlansCount, marketResearchCount] = await Promise.all([
      fastify.prisma.smartGoal.count(),
      fastify.prisma.milestonePlan.count(),
      fastify.prisma.marketResearch.count(),
    ]);

    const data = {
      smartGoals:     { submitted: smartGoalsCount,    notSubmitted: totalUsers - smartGoalsCount },
      milestonePlans: { submitted: milestonePlansCount, notSubmitted: totalUsers - milestonePlansCount },
      marketResearch: { submitted: marketResearchCount, notSubmitted: totalUsers - marketResearchCount },
    };

    await cacheSet(CacheKeys.analyticsSubmissionCompletion, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/mentor-activity', { preHandler: requireAdmin }, async (request, reply) => {
    const cacheKey = 'analytics:mentor-activity';
    const cached = await cacheGet<object[]>(cacheKey);
    if (cached) return reply.send({ success: true, data: cached });

    const mentors = await fastify.prisma.user.findMany({
      where:  { isMentor: true },
      select: {
        id: true, firstName: true, lastName: true,
        _count: {
          select: {
            mentorRelationships:    true,
            mentorMeetingsAsMentor: true,
          },
        },
      },
    });

    const completedCounts = await fastify.prisma.mentorMeeting.groupBy({
      by:    ['mentorId'],
      where: { mentorId: { in: mentors.map((m) => m.id) }, status: 'Completed' },
      _count: { mentorId: true },
    });
    const completedMap = new Map(completedCounts.map((r) => [r.mentorId, r._count.mentorId]));

    const data = mentors.map((m) => ({
      name:      `${m.firstName} ${m.lastName}`,
      mentees:   m._count.mentorRelationships,
      meetings:  m._count.mentorMeetingsAsMentor,
      completed: completedMap.get(m.id) ?? 0,
    }));

    await cacheSet(cacheKey, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/business-stage', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object>(CacheKeys.analyticsBusinessStage);
    if (cached) return reply.send({ success: true, data: cached });

    const stages = await fastify.prisma.user.groupBy({
      by: ['businessStage'],
      _count: { businessStage: true },
    });

    const data: Record<string, number> = {};
    for (const s of stages) {
      if (s.businessStage !== null) data[s.businessStage] = s._count.businessStage;
    }

    await cacheSet(CacheKeys.analyticsBusinessStage, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  fastify.get('/admin/analytics/application-status', { preHandler: requireAdmin }, async (request, reply) => {
    const cached = await cacheGet<object>(CacheKeys.analyticsApplicationStatus);
    if (cached) return reply.send({ success: true, data: cached });

    const statuses = await fastify.prisma.application.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const data: Record<string, number> = {};
    for (const s of statuses) data[s.status] = s._count.status;

    await cacheSet(CacheKeys.analyticsApplicationStatus, data, FIVE_MIN);
    return reply.send({ success: true, data });
  });

  // Cohort / Program Progress
  fastify.get<{ Params: { programId: string } }>(
    '/admin/analytics/program-progress/:programId',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const programId = parseInt(request.params.programId, 10);
      if (isNaN(programId)) throw new AppError('VALIDATION_ERROR', 'Invalid program ID', 400);

      const cacheKey = CacheKeys.analyticsProgramProgress(programId);
      const cached = await cacheGet<object>(cacheKey);
      if (cached) return reply.send({ success: true, data: cached });

      const program = await fastify.prisma.program.findUnique({ where: { id: programId } });
      if (!program) throw new AppError('NOT_FOUND', 'Program not found', 404);

      const approvedApplications = await fastify.prisma.application.findMany({
        where:  { programId, status: 'Approved' },
        select: { userId: true },
      });

      const approvedUserIds = approvedApplications.map((a) => a.userId);
      const count = approvedUserIds.length;

      const [smartGoals, milestonePlans, marketResearch, evidenceStats] = await Promise.all([
        fastify.prisma.smartGoal.count({ where: { userId: { in: approvedUserIds } } }),
        fastify.prisma.milestonePlan.count({ where: { userId: { in: approvedUserIds } } }),
        fastify.prisma.marketResearch.count({ where: { userId: { in: approvedUserIds } } }),
        fastify.prisma.evidence.groupBy({
          by:    ['status'],
          where: { programId },
          _count: { status: true },
        }),
      ]);

      const evidenceMap: Record<string, number> = {};
      for (const e of evidenceStats) evidenceMap[e.status] = e._count.status;

      const pct = (n: number) => count > 0 ? Math.round((n / count) * 1000) / 10 : 0;

      const data = {
        programId,
        programName:          program.name,
        approvedParticipants: count,
        submissions: {
          smartGoals:     { submitted: smartGoals,    notSubmitted: count - smartGoals,    rate: pct(smartGoals) },
          milestonePlans: { submitted: milestonePlans, notSubmitted: count - milestonePlans, rate: pct(milestonePlans) },
          marketResearch: { submitted: marketResearch, notSubmitted: count - marketResearch, rate: pct(marketResearch) },
        },
        evidence: {
          total:    Object.values(evidenceMap).reduce((a, b) => a + b, 0),
          verified: evidenceMap['verified'] ?? 0,
          pending:  evidenceMap['pending']  ?? 0,
          rejected: evidenceMap['rejected'] ?? 0,
        },
      };

      await cacheSet(cacheKey, data, FIVE_MIN);
      return reply.send({ success: true, data });
    },
  );
}
