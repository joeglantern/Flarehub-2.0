import type { PrismaClient, AdminTargetType } from '@prisma/client';

export interface LogAdminActionPayload {
  adminId:      string;
  action:       string;
  targetType?:  AdminTargetType;
  targetId?:    string;
  description?: string;
  ipAddress?:   string;
  userAgent?:   string;
}

export async function logAdminAction(
  prisma:  PrismaClient,
  payload: LogAdminActionPayload,
): Promise<void> {
  await prisma.adminLog.create({ data: payload });
}
