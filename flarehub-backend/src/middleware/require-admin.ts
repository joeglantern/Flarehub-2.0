import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user || !['admin', 'super_admin'].includes(request.user.role)) {
    throw new AppError('FORBIDDEN', 'Admin access required', 403);
  }
}
