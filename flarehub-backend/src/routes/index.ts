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
import adminAnalyticsRoutes   from './admin/analytics.js';
import adminSettingsRoutes    from './admin/settings.js';
import adminActivityLogRoutes from './admin/activity-log.js';

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
    await api.register(adminAnalyticsRoutes);
    await api.register(adminSettingsRoutes);
    await api.register(adminActivityLogRoutes);
  }, { prefix: appConfig.apiPrefix });

  fastify.get('/ws', { websocket: true }, (socket, request) => {
    handleWebSocketConnection(socket, request, fastify.wsRegistry, fastify.prisma);
  });
}
