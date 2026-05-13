import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { sendMessageSchema, messageThreadQuerySchema, editMessageSchema } from '../../schemas/message.schema.js';
import { AppError } from '../../types/index.js';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from '../../services/cache.service.js';

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.get('/messages/search', { preHandler: requireAuth }, async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.trim().length < 2) return reply.send({ success: true, data: [] });

    const userId = request.user!.id;
    const messages = await fastify.prisma.message.findMany({
      where: {
        content: { contains: q.trim(), mode: 'insensitive' },
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take:    30,
    });

    const data = messages.map((m) => {
      const isMe     = m.senderId === userId;
      const contact  = isMe ? m.receiver : m.sender;
      return {
        id:          m.id,
        content:     m.content,
        createdAt:   m.createdAt,
        senderId:    m.senderId,
        receiverId:  m.receiverId,
        contactId:   contact.id,
        contactName: `${contact.firstName} ${contact.lastName}`,
        isMe,
      };
    });

    return reply.send({ success: true, data });
  });

  fastify.get('/messages/conversations', { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.user!.id;

    const cached = await cacheGet<object>(CacheKeys.conversations(userId));
    if (cached) return reply.send(cached);

    // 1. Last message per conversation partner — DISTINCT ON avoids N queries
    const lastMsgs = await fastify.prisma.$queryRaw<Array<{
      partner_id: string;
      last_message_content: string | null;
      last_message_at: Date | null;
    }>>`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        content      AS last_message_content,
        "createdAt"  AS last_message_at
      FROM (
        SELECT "receiverId" AS partner_id, content, "createdAt"
        FROM   messages
        WHERE  "senderId" = ${userId}
        UNION ALL
        SELECT "senderId" AS partner_id, content, "createdAt"
        FROM   messages
        WHERE  "receiverId" = ${userId}
      ) sub
      ORDER BY partner_id, "createdAt" DESC
    `;

    if (lastMsgs.length === 0) return reply.send({ success: true, data: [] });

    const partnerIds = lastMsgs.map((r) => r.partner_id);

    // 2. Unread counts — single GROUP BY across all partners
    const unreadRows = await fastify.prisma.$queryRaw<Array<{
      contact_id: string;
      unread_count: bigint;
    }>>`
      SELECT "senderId" AS contact_id, COUNT(*) AS unread_count
      FROM   messages
      WHERE  "receiverId" = ${userId}
        AND  "isRead"     = false
        AND  "senderId"   = ANY(${partnerIds}::text[])
      GROUP  BY "senderId"
    `;

    // 3. User profiles — one findMany
    const users = await fastify.prisma.user.findMany({
      where:  { id: { in: partnerIds } },
      select: { id: true, firstName: true, lastName: true, profilePic: true },
    });

    const userMap   = new Map(users.map((u) => [u.id, u]));
    const unreadMap = new Map(unreadRows.map((r) => [r.contact_id, Number(r.unread_count)]));

    const conversations = lastMsgs.map((row) => {
      const contact = userMap.get(row.partner_id);
      return {
        contactId:         row.partner_id,
        contactName:       contact ? `${contact.firstName} ${contact.lastName}` : '',
        contactProfilePic: contact?.profilePic ?? null,
        lastMessage:       row.last_message_content ?? '',
        lastMessageAt:     row.last_message_at ?? null,
        unreadCount:       unreadMap.get(row.partner_id) ?? 0,
        isOnline:          fastify.wsRegistry.isOnline(row.partner_id),
      };
    });

    conversations.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    const response = { success: true, data: conversations };
    await cacheSet(CacheKeys.conversations(userId), response, 30);
    return reply.send(response);
  });

  fastify.get<{ Params: { contactId: string } }>('/messages/:contactId', { preHandler: requireAuth }, async (request, reply) => {
    const { contactId } = request.params;
    const userId = request.user!.id;
    const query = messageThreadQuerySchema.parse(request.query);
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      fastify.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: contactId },
            { senderId: contactId, receiverId: userId },
          ],
        },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      fastify.prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: contactId },
            { senderId: contactId, receiverId: userId },
          ],
        },
      }),
    ]);

    return reply.send({
      success: true,
      data:    messages,
      meta:    { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  });

  fastify.post('/messages', { preHandler: requireAuth }, async (request, reply) => {
    const { receiverId, content } = sendMessageSchema.parse(request.body);
    const senderId = request.user!.id;

    const receiver = await fastify.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new AppError('NOT_FOUND', 'Recipient not found', 404);

    const sender = await fastify.prisma.user.findUnique({
      where:  { id: senderId },
      select: { firstName: true, lastName: true },
    });

    const message = await fastify.prisma.message.create({
      data: { senderId, receiverId, content },
    });

    const senderName = `${sender?.firstName ?? ''} ${sender?.lastName ?? ''}`;

    if (fastify.wsRegistry.isOnline(receiverId)) {
      fastify.wsRegistry.push(receiverId, {
        type: 'new_message',
        data: { ...message, senderName },
      });
    } else {
      await fastify.prisma.notification.create({
        data: {
          userId:   receiverId,
          type:     'new_message',
          title:    'New message',
          body:     `${senderName}: ${content.slice(0, 100)}`,
          metadata: { fromUserId: senderId, messageId: message.id },
        },
      });
    }

    // Bust conversation list cache for both parties
    await cacheDel(CacheKeys.conversations(senderId), CacheKeys.conversations(receiverId));

    return reply.status(201).send({ success: true, data: message });
  });

  fastify.patch<{ Params: { contactId: string } }>('/messages/:contactId/read', { preHandler: requireAuth }, async (request, reply) => {
    const { contactId } = request.params;
    const userId = request.user!.id;

    const result = await fastify.prisma.message.updateMany({
      where: { senderId: contactId, receiverId: userId, isRead: false },
      data:  { isRead: true },
    });

    if (result.count > 0) {
      fastify.wsRegistry.push(contactId, {
        type: 'messages_read',
        data: { conversationId: userId, readBy: userId },
      });
      await cacheDel(CacheKeys.conversations(userId), CacheKeys.conversations(contactId));
    }

    return reply.send({ success: true, data: { marked: result.count } });
  });

  fastify.patch<{ Params: { id: string } }>('/messages/:id/edit', { preHandler: requireAuth }, async (request, reply) => {
    const id     = parseInt(request.params.id, 10);
    const userId = request.user!.id;
    const { content } = editMessageSchema.parse(request.body);

    const message = await fastify.prisma.message.findUnique({ where: { id } });
    if (!message)              throw new AppError('NOT_FOUND', 'Message not found', 404);
    if (message.senderId !== userId) throw new AppError('FORBIDDEN', 'Cannot edit this message', 403);

    const updated = await fastify.prisma.message.update({
      where: { id },
      data:  { content },
    });

    const event = { type: 'message_edited' as const, data: { id: updated.id, content: updated.content, senderId: updated.senderId, receiverId: updated.receiverId } };
    fastify.wsRegistry.push(updated.receiverId, event);
    fastify.wsRegistry.push(updated.senderId,   event);

    return reply.send({ success: true, data: updated });
  });

  fastify.delete<{ Params: { id: string } }>('/messages/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id     = parseInt(request.params.id, 10);
    const userId = request.user!.id;

    const message = await fastify.prisma.message.findUnique({ where: { id } });
    if (!message)              throw new AppError('NOT_FOUND', 'Message not found', 404);
    if (message.senderId !== userId) throw new AppError('FORBIDDEN', 'Cannot delete this message', 403);

    await fastify.prisma.message.delete({ where: { id } });

    const event = { type: 'message_deleted' as const, data: { id, senderId: message.senderId, receiverId: message.receiverId } };
    fastify.wsRegistry.push(message.receiverId, event);
    fastify.wsRegistry.push(message.senderId,   event);

    return reply.send({ success: true });
  });
}
