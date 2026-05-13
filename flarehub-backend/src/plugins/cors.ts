import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { appConfig } from '../config/index.js';

export default fp(async (fastify) => {
  await fastify.register(cors, {
    // In development, reflect any origin so --host / network-mode Vite works.
    // In production, enforce the explicit ALLOWED_ORIGINS allowlist.
    origin:      appConfig.isDev ? true : appConfig.allowedOrigins,
    credentials: false,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
});
