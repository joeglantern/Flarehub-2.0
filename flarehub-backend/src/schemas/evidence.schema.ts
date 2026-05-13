import { z } from 'zod';

export const registerEvidenceSchema = z.object({
  programId:       z.number().int().positive().optional(),
  milestoneNumber: z.number().int().positive().optional(),
  fileName:        z.string().min(1),
  storagePath:     z.string().min(1),
  fileSize:        z.number().int().positive(),
  mimeType:        z.string().min(1),
  fileType:        z.string().min(1),
  description:     z.string().optional(),
  category:        z.string().optional(),
});

export const updateEvidenceStatusSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  notes:  z.string().optional(),
});

export const evidenceQuerySchema = z.object({
  page:            z.coerce.number().int().positive().default(1),
  limit:           z.coerce.number().int().positive().max(100).default(20),
  programId:       z.coerce.number().int().positive().optional(),
  milestoneNumber: z.coerce.number().int().positive().optional(),
  status:          z.enum(['pending', 'verified', 'rejected']).optional(),
  category:        z.string().optional(),
  userId:          z.string().optional(),
  from:            z.string().optional(),
  to:              z.string().optional(),
});

export type RegisterEvidenceInput      = z.infer<typeof registerEvidenceSchema>;
export type UpdateEvidenceStatusInput  = z.infer<typeof updateEvidenceStatusSchema>;
export type EvidenceQueryInput         = z.infer<typeof evidenceQuerySchema>;
