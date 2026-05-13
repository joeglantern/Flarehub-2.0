import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName:           z.string().min(1).optional(),
  lastName:            z.string().min(1).optional(),
  phone:               z.string().optional(),
  county:              z.string().optional(),
  gender:              z.enum(['Male', 'Female', 'Other', 'Unknown']).optional(),
  businessName:        z.string().optional(),
  businessStage:       z.enum(['Idea', 'Prototype', 'MVP', 'Revenue']).optional(),
  businessDescription: z.string().optional(),
  profilePic:          z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
