import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { appConfig } from '../config/index.js';

export default fp(async (fastify) => {
  fastify.register(rateLimit, {
    max:        appConfig.rateLimit.max,
    timeWindow: appConfig.rateLimit.windowMs,
    keyGenerator: (request) =>
      request.user?.id ?? request.ip,
  });
});
