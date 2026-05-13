import { z } from 'zod';

export const scheduleMeetingSchema = z.object({
  menteeId:    z.string().uuid(),
  meetingTime: z.string().datetime(),
  meetingType: z.enum(['Virtual', 'InPerson']),
  link:        z.string().url().optional(),
  location:    z.string().optional(),
  notes:       z.string().optional(),
});

export const updateMeetingSchema = z.object({
  status:      z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
  meetingTime: z.string().datetime().optional(),
  link:        z.string().url().optional().nullable(),
  location:    z.string().optional().nullable(),
  notes:       z.string().optional().nullable(),
});

export const createNoteSchema = z.object({
  menteeId: z.string().uuid(),
  content:  z.string().min(1),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1),
});

export const meetingQuerySchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().positive().max(100).default(20),
  status:   z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
  from:     z.string().optional(),
  to:       z.string().optional(),
  menteeId: z.string().uuid().optional(),
});

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;
export type UpdateMeetingInput   = z.infer<typeof updateMeetingSchema>;
export type CreateNoteInput      = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput      = z.infer<typeof updateNoteSchema>;
export type MeetingQueryInput    = z.infer<typeof meetingQuerySchema>;
