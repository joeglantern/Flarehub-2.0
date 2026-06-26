import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { appConfig } from '../config/index.js';

export default fp(async (fastify) => {
  if (!appConfig.isDev) return;

  await fastify.register(swagger, {
    openapi: {
      info: {
        title:       'Afosihub API',
        description: 'Youth entrepreneurship program management platform',
        version:     '1.0.0',
      },
      servers: [{ url: `http://localhost:${appConfig.port}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type:         'http',
            scheme:       'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig:    { docExpansion: 'list', deepLinking: true },
  });
});
