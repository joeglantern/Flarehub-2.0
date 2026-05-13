import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['entrepreneur', 'mentor', 'admin', 'super_admin']),
});

export const updateVerifySchema = z.object({
  isVerified: z.boolean(),
});

export const updateMentorStatusSchema = z.object({
  isMentor: z.boolean(),
});

export const mentorAssignmentSchema = z.object({
  mentorId: z.string().uuid(),
  menteeId: z.string().uuid(),
});

export const updateSettingsSchema = z.record(z.string(), z.string());

export const adminUserQuerySchema = z.object({
  page:          z.coerce.number().int().positive().default(1),
  limit:         z.coerce.number().int().positive().max(100).default(20),
  search:        z.string().optional(),
  role:          z.enum(['entrepreneur', 'mentor', 'admin', 'super_admin']).optional(),
  county:        z.string().optional(),
  isVerified:    z.coerce.boolean().optional(),
  isMentor:      z.coerce.boolean().optional(),
  businessStage: z.enum(['Idea', 'Prototype', 'MVP', 'Revenue']).optional(),
});

export const activityLogQuerySchema = z.object({
  page:       z.coerce.number().int().positive().default(1),
  limit:      z.coerce.number().int().positive().max(100).default(20),
  adminId:    z.string().optional(),
  targetType: z.enum(['user', 'application', 'program', 'evidence', 'submission', 'template', 'system']).optional(),
  from:       z.string().optional(),
  to:         z.string().optional(),
});

export const documentStatusSchema = z.object({
  status: z.enum(['Pending', 'Reviewed', 'NeedsRevision', 'Approved']),
  notes:  z.string().optional(),
});

export const userSubmissionStatusSchema = z.object({
  status: z.enum(['Draft', 'Submitted', 'UnderReview', 'Approved', 'NeedsRevision']),
  notes:  z.string().optional(),
});

export const signedUploadUrlSchema = z.object({
  bucket:   z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

export const registerDocumentSchema = z.object({
  originalName:     z.string().min(1),
  storagePath:      z.string().min(1),
  fileSize:         z.number().int().positive(),
  fileType:         z.string().min(1),
  documentCategory: z.enum(['milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback']).optional(),
  description:      z.string().optional(),
  priority:         z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const registerTemplateSchema = z.object({
  title:        z.string().min(1),
  description:  z.string().optional(),
  originalName: z.string().min(1),
  storagePath:  z.string().min(1),
  fileSize:     z.number().int().positive(),
  fileType:     z.string().min(1),
  templateType: z.enum(['milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback']),
});

export const updateTemplateSchema = registerTemplateSchema.partial();

export const createUserSubmissionSchema = z.object({
  templateId:     z.number().int().positive(),
  submissionName: z.string().min(1),
  originalName:   z.string().min(1),
  storagePath:    z.string().min(1),
  fileSize:       z.number().int().positive(),
  fileType:       z.string().min(1),
});

export const documentQuerySchema = z.object({
  page:             z.coerce.number().int().positive().default(1),
  limit:            z.coerce.number().int().positive().max(100).default(20),
  documentCategory: z.enum(['milestone', 'survey', 'smart_goals', 'market_research', 'customer_feedback']).optional(),
  status:           z.enum(['Pending', 'Reviewed', 'NeedsRevision', 'Approved']).optional(),
  search:           z.string().optional(),
  userId:           z.string().optional(),
});

export const userSubmissionQuerySchema = z.object({
  page:       z.coerce.number().int().positive().default(1),
  limit:      z.coerce.number().int().positive().max(100).default(20),
  templateId: z.coerce.number().int().positive().optional(),
  status:     z.enum(['Draft', 'Submitted', 'UnderReview', 'Approved', 'NeedsRevision']).optional(),
  userId:     z.string().optional(),
  search:     z.string().optional(),
});

export type UpdateRoleInput             = z.infer<typeof updateRoleSchema>;
export type UpdateVerifyInput           = z.infer<typeof updateVerifySchema>;
export type UpdateMentorStatusInput     = z.infer<typeof updateMentorStatusSchema>;
export type MentorAssignmentInput       = z.infer<typeof mentorAssignmentSchema>;
export type UpdateSettingsInput         = z.infer<typeof updateSettingsSchema>;
export type AdminUserQueryInput         = z.infer<typeof adminUserQuerySchema>;
export type ActivityLogQueryInput       = z.infer<typeof activityLogQuerySchema>;
export type DocumentStatusInput         = z.infer<typeof documentStatusSchema>;
export type UserSubmissionStatusInput   = z.infer<typeof userSubmissionStatusSchema>;
export type SignedUploadUrlInput        = z.infer<typeof signedUploadUrlSchema>;
export type RegisterDocumentInput       = z.infer<typeof registerDocumentSchema>;
export type RegisterTemplateInput       = z.infer<typeof registerTemplateSchema>;
export type UpdateTemplateInput         = z.infer<typeof updateTemplateSchema>;
export type CreateUserSubmissionInput   = z.infer<typeof createUserSubmissionSchema>;
export type DocumentQueryInput          = z.infer<typeof documentQuerySchema>;
export type UserSubmissionQueryInput    = z.infer<typeof userSubmissionQuerySchema>;
