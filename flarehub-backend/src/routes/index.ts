import type { FastifyInstance } from 'fastify';
import { appConfig } from '../config/index.js';
import { handleWebSocketConnection } from '../ws/handler.js';

import healthRoutes           from './health/index.js';
import authRoutes             from './auth/index.js';
import userRoutes             from './users/index.js';
import programRoutes          from './programs/index.js';
import applicationRoutes      from './applications/index.js';
import scoringRoutes          from './applications/scoring.js';
import smartGoalRoutes        from './submissions/smart-goals.js';
import milestonePlanRoutes    from './submissions/milestone-plans.js';
import marketResearchRoutes   from './submissions/market-research.js';
import storageRoutes          from './storage/index.js';
import documentRoutes         from './documents/index.js';
import evidenceRoutes         from './evidence/index.js';
import templateRoutes         from './templates/index.js';
import userSubmissionRoutes   from './user-submissions/index.js';
import businessPlanRoutes     from './business-plans/index.js';
import mentorRoutes           from './mentor/index.js';
import messageRoutes          from './messages/index.js';
import notificationRoutes     from './notifications/index.js';
import announcementRoutes     from './announcements/index.js';
import reportRoutes           from './reports/index.js';
import pushRoutes             from './push/index.js';
import adminUserRoutes        from './admin/users.js';
import adminMentorRoutes      from './admin/mentor-management.js';
import programMentorRoutes    from './mentorship/program-mentors.js';
import inviteLinkRoutes       from './mentorship/invite-links.js';
import mentorshipAppRoutes    from './mentorship/applications.js';
import adminAnalyticsRoutes   from './admin/analytics.js';
import adminSettingsRoutes    from './admin/settings.js';
import adminActivityLogRoutes from './admin/activity-log.js';
import bulkImportRoutes              from './admin/bulk-import.js';
import resendInvitesRoutes           from './admin/resend-invites.js';
import mentorApplicationRoutes       from './mentor-applications/index.js';
import adminMentorApplicationRoutes  from './admin/mentor-applications.js';
import formSubmissionsRoutes         from './admin/form-submissions.js';

export default async function routes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);

  await fastify.register(async (api) => {
    await api.register(authRoutes);
    await api.register(userRoutes);
    await api.register(programRoutes);
    await api.register(applicationRoutes);
    await api.register(smartGoalRoutes);
    await api.register(milestonePlanRoutes);
    await api.register(marketResearchRoutes);
    await api.register(storageRoutes);
    await api.register(documentRoutes);
    await api.register(evidenceRoutes);
    await api.register(templateRoutes);
    await api.register(userSubmissionRoutes);
    await api.register(businessPlanRoutes);
    await api.register(mentorRoutes);
    await api.register(messageRoutes);
    await api.register(notificationRoutes);
    await api.register(announcementRoutes);
    await api.register(reportRoutes);
    await api.register(pushRoutes);
    await api.register(scoringRoutes);
    await api.register(adminUserRoutes);
    await api.register(adminMentorRoutes);
    await api.register(programMentorRoutes);
    await api.register(inviteLinkRoutes);
    await api.register(mentorshipAppRoutes);
    await api.register(adminAnalyticsRoutes);
    await api.register(adminSettingsRoutes);
    await api.register(adminActivityLogRoutes);
    await api.register(bulkImportRoutes);
    await api.register(resendInvitesRoutes);
    await api.register(mentorApplicationRoutes);
    await api.register(adminMentorApplicationRoutes);
    await api.register(formSubmissionsRoutes);
  }, { prefix: appConfig.apiPrefix });

  fastify.get('/ws', { websocket: true }, (socket, request) => {
    handleWebSocketConnection(socket, request, fastify.wsRegistry, fastify.prisma, fastify.supabase);
  });
}
