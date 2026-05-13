import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../types/index.js';

export async function requireMentor(request: FastifyRequest, reply: FastifyReply) {
  await request.server.authenticate(request, reply);
  if (!request.user?.isMentor) {
    throw new AppError('FORBIDDEN', 'Mentor access required', 403);
  }
}
