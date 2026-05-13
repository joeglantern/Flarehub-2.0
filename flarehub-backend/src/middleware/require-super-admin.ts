import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user || request.user.role !== 'super_admin') {
    throw new AppError('FORBIDDEN', 'Super-admin access required', 403);
  }
}
