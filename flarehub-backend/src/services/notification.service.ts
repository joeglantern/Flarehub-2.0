import type { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import type { ConnectionRegistry } from '../ws/registry.js';

export interface CreateNotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(
  prisma:   PrismaClient,
  registry: ConnectionRegistry,
  payload:  CreateNotificationPayload,
): Promise<void> {
  const metadata = (payload.metadata ?? {}) as unknown as Prisma.InputJsonValue;
  const notification = await prisma.notification.create({
    data: {
      userId:   payload.userId,
      type:     payload.type,
      title:    payload.title,
      body:     payload.body,
      metadata,
    },
  });

  registry.push(payload.userId, {
    type: 'notification',
    data: notification,
  });
}
