import { z } from 'zod';
import { formResponseSchema } from './applicationForm.schema.js';

export const applySchema = z.object({
  programId: z.number().int().positive(),
  isDraft:   z.boolean().optional().default(false),
  responses: formResponseSchema.optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['Pending', 'UnderReview', 'Approved', 'Rejected']),
});

export const updateApplicationCommentSchema = z.object({
  adminComment: z.string().max(2000),
});

export const updateDraftResponsesSchema = z.object({
  responses: formResponseSchema,
});

export const bulkStatusSchema = z.object({
  ids:    z.array(z.number().int().positive()).min(1),
  status: z.enum(['Pending', 'UnderReview', 'Approved', 'Rejected']),
});

export const applicationQuerySchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().positive().max(100).default(20),
  status:    z.enum(['Pending', 'UnderReview', 'Approved', 'Rejected']).optional(),
  programId: z.coerce.number().int().positive().optional(),
  search:    z.string().optional(),
  from:      z.string().optional(),
  to:        z.string().optional(),
});

export type ApplyInput                    = z.infer<typeof applySchema>;
export type UpdateApplicationStatusInput  = z.infer<typeof updateApplicationStatusSchema>;
export type UpdateApplicationCommentInput = z.infer<typeof updateApplicationCommentSchema>;
export type UpdateDraftResponsesInput     = z.infer<typeof updateDraftResponsesSchema>;
export type BulkStatusInput               = z.infer<typeof bulkStatusSchema>;
export type ApplicationQueryInput         = z.infer<typeof applicationQuerySchema>;
