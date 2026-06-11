import { z } from 'zod';

export const createProgramSchema = z.object({
  name:                    z.string().min(1),
  description:             z.string().optional(),
  applicationDeadline:     z.string().datetime().optional(),
  status:                  z.enum(['Active', 'Inactive']).optional(),
  maxParticipants:         z.number().int().positive().optional(),
  grantAmount:             z.number().positive().optional(),
  eligibilityRequirements: z.string().optional(),
  tags:                    z.array(z.string()).optional(),
});

export const updateProgramSchema = createProgramSchema.partial();

export const programQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  tag:    z.string().optional(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type ProgramQueryInput  = z.infer<typeof programQuerySchema>;
