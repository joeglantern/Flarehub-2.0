import Fastify from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { appConfig } from './config/index.js';
import { AppError } from './types/index.js';

import compressPlugin  from '@fastify/compress';
import prismaPlugin    from './plugins/prisma.js';
import supabasePlugin  from './plugins/supabase.js';
import authPlugin      from './plugins/auth.js';
import websocketPlugin from './plugins/websocket.js';
import corsPlugin      from './plugins/cors.js';
import helmetPlugin    from './plugins/helmet.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import swaggerPlugin   from './plugins/swagger.js';

import routes from './routes/index.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: appConfig.isDev
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  });

  await fastify.register(compressPlugin, { global: true });
  await fastify.register(swaggerPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(supabasePlugin);
  await fastify.register(authPlugin);
  await fastify.register(websocketPlugin);

  await fastify.register(routes);

  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    // Cast to a plain Error so we can safely access .name for ESM class identity checks
    const err = error as Error & Record<string, unknown>;

    if (error instanceof ZodError || err.name === 'ZodError') {
      const zodErr = error as ZodError;
      return reply.status(400).send({
        success: false,
        error: {
          code:    'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: zodErr.flatten?.().fieldErrors ?? zodErr.message,
        },
      });
    }

    if (error instanceof AppError || err.name === 'AppError') {
      const appErr = error as AppError;
      return reply.status(appErr.statusCode).send({
        success: false,
        error: {
          code:    appErr.code,
          message: appErr.message,
          ...(appErr.details !== undefined ? { details: appErr.details } : {}),
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: { code: 'CONFLICT', message: 'This resource already exists' },
        });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found' },
        });
      }
    }

    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' },
      });
    }

    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
    });
  });

  return fastify;
}
