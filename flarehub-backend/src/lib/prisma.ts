import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config/index.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (appConfig.isDev) globalForPrisma.prisma = prisma;
