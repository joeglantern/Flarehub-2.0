import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
  isRead: z.coerce.boolean().optional(),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
