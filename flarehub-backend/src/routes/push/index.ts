import type { FastifyInstance } from 'fastify';
import webpush from 'web-push';
import { requireAuth } from '../../middleware/require-auth.js';
import { appConfig } from '../../config/index.js';

export default async function pushRoutes(fastify: FastifyInstance) {
  // Return VAPID public key for client subscription
  fastify.get('/push/vapid-public-key', async (_request, reply) => {
    const key = appConfig.vapid?.publicKey ?? null;
    return reply.send({ success: true, data: { publicKey: key } });
  });

  // Save push subscription
  fastify.post('/push/subscribe', { preHandler: requireAuth }, async (request, reply) => {
    const { endpoint, keys } = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return reply.status(400).send({ success: false, error: { message: 'Invalid subscription' } });
    }

    await fastify.prisma.pushSubscription.upsert({
      where:  { endpoint },
      create: { userId: request.user!.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: request.user!.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    return reply.status(201).send({ success: true });
  });

  // Remove push subscription
  fastify.delete('/push/subscribe', { preHandler: requireAuth }, async (request, reply) => {
    const { endpoint } = request.body as { endpoint: string };
    await fastify.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: request.user!.id },
    });
    return reply.send({ success: true });
  });

  // Test push (dev only)
  fastify.post('/push/test', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;
    const subs = await fastify.prisma.pushSubscription.findMany({ where: { userId } });

    const { publicKey, privateKey, email } = appConfig.vapid ?? {};
    if (!publicKey || !privateKey || !email) {
      return reply.status(503).send({ success: false, error: { message: 'Push not configured' } });
    }
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);

    await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: 'Flarehub', body: 'Push notifications are working!' }),
        ),
      ),
    );

    return reply.send({ success: true, data: { sent: subs.length } });
  });
}
