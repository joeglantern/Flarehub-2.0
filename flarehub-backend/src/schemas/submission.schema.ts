import { z } from 'zod';

export const createSmartGoalSchema = z.object({
  goalStatement: z.string().min(1),
  specific:      z.string().min(1),
  measurable:    z.string().min(1),
  achievable:    z.string().min(1),
  relevant:      z.string().min(1),
  timebound:     z.string().min(1),
});

export const updateSmartGoalSchema = createSmartGoalSchema.partial();

export const adminCommentSchema = z.object({
  adminComment: z.string().min(1),
});

const milestoneItemSchema = z.object({
  number:   z.number().int().min(1).max(5),
  title:    z.string().min(1),
  timeline: z.string().min(1),
  budget:   z.string().min(1),
  goal:     z.string().min(1),
  tasks:    z.string().min(1),
  evidence: z.string().min(1),
  metrics:  z.array(z.string()),
});

export const createMilestonePlanSchema = z.object({
  businessName:         z.string().min(1),
  grantAmount:          z.string().optional(),
  implementationPeriod: z.string().optional(),
  stage:                z.string().optional(),
  milestones:           z.array(milestoneItemSchema).min(1),
});

export const updateMilestonePlanSchema = createMilestonePlanSchema.partial();

export const createMarketResearchSchema = z.object({
  businessName:         z.string().min(1),
  surveyDate:           z.string().optional(),
  sampleSize:           z.string().optional(),
  surveyDuration:       z.string().optional(),
  surveyObjective:      z.string().optional(),
  ageDistribution:      z.string().optional(),
  genderBreakdown:      z.string().optional(),
  location:             z.string().optional(),
  otherCharacteristics: z.string().optional(),
  topChallenges:        z.array(z.string()).optional(),
  awareness:            z.string().optional(),
  interest:             z.string().optional(),
  avgWillingness:       z.string().optional(),
  priceRange:           z.string().optional(),
  currentSolutions:     z.string().optional(),
  openComments:         z.string().optional(),
  opportunity1:         z.string().optional(),
  opportunity2:         z.string().optional(),
  riskBarrier:          z.string().optional(),
  nextSteps:            z.array(z.string()).optional(),
});

export const updateMarketResearchSchema = createMarketResearchSchema.partial();

export const submissionQuerySchema = z.object({
  page:       z.coerce.number().int().positive().default(1),
  limit:      z.coerce.number().int().positive().max(100).default(20),
  search:     z.string().optional(),
  hasComment: z.coerce.boolean().optional(),
});

export type CreateSmartGoalInput    = z.infer<typeof createSmartGoalSchema>;
export type UpdateSmartGoalInput    = z.infer<typeof updateSmartGoalSchema>;
export type AdminCommentInput       = z.infer<typeof adminCommentSchema>;
export type CreateMilestonePlanInput = z.infer<typeof createMilestonePlanSchema>;
export type UpdateMilestonePlanInput = z.infer<typeof updateMilestonePlanSchema>;
export type CreateMarketResearchInput = z.infer<typeof createMarketResearchSchema>;
export type UpdateMarketResearchInput = z.infer<typeof updateMarketResearchSchema>;
export type SubmissionQueryInput    = z.infer<typeof submissionQuerySchema>;
