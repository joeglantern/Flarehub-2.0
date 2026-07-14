import type { WebSocket } from '@fastify/websocket';
import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config/index.js';
import type { ConnectionRegistry } from './registry.js';
import type { ClientEvent } from './events.js';

const JWT_SECRET = Buffer.from(appConfig.supabase.jwtSecret, 'base64');

function verifyToken(token: string): { sub: string; email: string } | null {
  // Try base64-decoded secret (covers both HS256 and ES256 — Supabase migrated to ES256)
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
  } catch {
    // Fallback: try raw string secret
    try {
      return jwt.verify(token, appConfig.supabase.jwtSecret) as { sub: string; email: string };
    } catch {
      return null;
    }
  }
}

export async function handleWebSocketConnection(
  ws:       WebSocket,
  request:  FastifyRequest,
  registry: ConnectionRegistry,
  prisma:   PrismaClient,
): Promise<void> {
  const query = request.query as Record<string, string>;
  const token = query.token;

  if (!token) {
    ws.send(JSON.stringify({ type: 'error', data: { code: 'UNAUTHORIZED', message: 'Missing token' } }));
    ws.close();
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    ws.send(JSON.stringify({ type: 'error', data: { code: 'UNAUTHORIZED', message: 'Invalid token' } }));
    ws.close();
    return;
  }

  const user = await prisma.user.findUnique({
    where:  { id: decoded.sub },
    select: { id: true, email: true, role: true, isMentor: true },
  });

  if (!user) {
    ws.send(JSON.stringify({ type: 'error', data: { code: 'UNAUTHORIZED', message: 'User not found' } }));
    ws.close();
    return;
  }

  const userId = user.id;
  registry.register(userId, ws);
  registry.broadcast({ type: 'user_online', data: { userId } });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  ws.send(JSON.stringify({ type: 'connected', data: { unreadNotifications: unreadCount } }));

  ws.on('message', async (raw) => {
    let event: ClientEvent;
    try {
      event = JSON.parse(raw.toString()) as ClientEvent;
    } catch {
      ws.send(JSON.stringify({ type: 'error', data: { code: 'INVALID_MESSAGE', message: 'Invalid JSON' } }));
      return;
    }

    try {
      if (event.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (event.type === 'message_send') {
        const { receiverId, content } = event.data;
        const message = await prisma.message.create({
          data: { senderId: userId, receiverId, content },
          include: { sender: { select: { firstName: true, lastName: true } } },
        });

        const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
        const payload = { ...message, senderName };

        if (registry.isOnline(receiverId)) {
          registry.push(receiverId, { type: 'new_message', data: payload });
        } else {
          await prisma.notification.create({
            data: {
              userId:   receiverId,
              type:     'new_message',
              title:    'New message',
              body:     `${senderName}: ${content.slice(0, 100)}`,
              metadata: { fromUserId: userId, messageId: message.id },
            },
          });
        }

        ws.send(JSON.stringify({ type: 'new_message', data: payload }));
        return;
      }

      if (event.type === 'typing') {
        const { receiverId } = event.data;
        registry.push(receiverId, {
          type: 'typing',
          data: { fromUserId: userId, conversationId: receiverId },
        });
        return;
      }

      if (event.type === 'mark_read') {
        const { type: markType, id } = event.data;
        if (markType === 'notification') {
          await prisma.notification.updateMany({
            where: { id, userId },
            data:  { isRead: true },
          });
        } else if (markType === 'message') {
          await prisma.message.updateMany({
            where: { id, receiverId: userId },
            data:  { isRead: true },
          });
        }
        return;
      }

      if (event.type === 'mark_all_read') {
        const { type: markType, contactId } = event.data;
        if (markType === 'notification') {
          await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data:  { isRead: true },
          });
        } else if (markType === 'message' && contactId) {
          await prisma.message.updateMany({
            where: { receiverId: userId, senderId: contactId, isRead: false },
            data:  { isRead: true },
          });
        }
        return;
      }
    } catch (err) {
      request.log.error(err, 'WebSocket message handler error');
      ws.send(JSON.stringify({ type: 'error', data: { code: 'INTERNAL_ERROR', message: 'Processing failed' } }));
    }
  });

  ws.on('close', () => {
    registry.unregister(userId, ws);
    if (!registry.isOnline(userId)) {
      registry.broadcast({ type: 'user_offline', data: { userId } });
    }
  });

  ws.on('error', () => {
    registry.unregister(userId, ws);
    if (!registry.isOnline(userId)) {
      registry.broadcast({ type: 'user_offline', data: { userId } });
    }
  });
}
