import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content:    z.string().min(1).max(5000),
});

export const messageThreadQuerySchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type SendMessageInput        = z.infer<typeof sendMessageSchema>;
export type MessageThreadQueryInput = z.infer<typeof messageThreadQuerySchema>;
export type EditMessageInput        = z.infer<typeof editMessageSchema>;
