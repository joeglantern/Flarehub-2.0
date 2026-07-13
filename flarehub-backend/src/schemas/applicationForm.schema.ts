import { z } from 'zod';

// ─── Choice Options ───────────────────────────────────────────────────────────

export const fieldOptionSchema = z.object({
  id:    z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
});

// ─── Validation Rules ─────────────────────────────────────────────────────────

export const fieldValidationSchema = z.object({
  minLength:        z.number().int().nonnegative().optional(),
  maxLength:        z.number().int().positive().optional(),
  minValue:         z.number().optional(),
  maxValue:         z.number().optional(),
  pattern:          z.string().optional(),
  patternMessage:   z.string().optional(),
  maxFileSizeMB:    z.number().positive().optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  minDate:          z.string().optional(),
  maxDate:          z.string().optional(),
  minSelected:      z.number().int().nonnegative().optional(),
  maxSelected:      z.number().int().positive().optional(),
}).default({});

// ─── Conditional Logic ────────────────────────────────────────────────────────

const conditionOperatorSchema = z.enum([
  'equals', 'not_equals', 'contains', 'not_contains',
  'is_empty', 'is_not_empty', 'greater_than', 'less_than',
]);

export const fieldConditionSchema = z.object({
  fieldId:  z.string().min(1),
  operator: conditionOperatorSchema,
  value:    z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const conditionalLogicSchema = z.object({
  action:     z.enum(['show', 'hide']),
  match:      z.enum(['all', 'any']),
  conditions: z.array(fieldConditionSchema).min(1),
});

// ─── Field Types ──────────────────────────────────────────────────────────────

const CHOICE_TYPES = ['single_choice', 'multiple_choice', 'dropdown'] as const;

export const fieldTypeSchema = z.enum([
  'short_text', 'long_text', 'number', 'date',
  'single_choice', 'multiple_choice', 'dropdown', 'checkbox',
  'file_upload', 'image_upload', 'video_upload',
  'rating', 'yes_no', 'phone', 'email',
]);

// ─── Form Field ───────────────────────────────────────────────────────────────

export const formFieldSchema = z.object({
  id:               z.string().min(1),
  type:             fieldTypeSchema,
  label:            z.string().min(1, 'Field label is required'),
  description:      z.string().optional(),
  placeholder:      z.string().optional(),
  required:         z.boolean(),
  options:          z.array(fieldOptionSchema).optional(),
  validation:       fieldValidationSchema,
  conditionalLogic: conditionalLogicSchema.optional(),
  autofillFrom:     z.enum(['email', 'phone', 'businessName', 'fullName']).optional(),
}).superRefine((field, ctx) => {
  if ((CHOICE_TYPES as readonly string[]).includes(field.type)) {
    if (!field.options || field.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: `Field of type "${field.type}" must have at least one option`,
      });
    }
  }
});

// ─── Form Section ─────────────────────────────────────────────────────────────

export const formSectionSchema = z.object({
  id:          z.string().min(1),
  title:       z.string().min(1, 'Section title is required'),
  description: z.string().optional(),
  fields:      z.array(formFieldSchema),
});

// ─── Form Schema ──────────────────────────────────────────────────────────────

export const formSchemaSettingsSchema = z.object({
  allowDraft:         z.boolean(),
  showReviewStep:     z.boolean(),
  submitButtonLabel:  z.string().optional(),
  successMessage:     z.string().optional(),
});

export const formSchemaSchema = z.object({
  version:  z.literal(1),
  sections: z.array(formSectionSchema),
  settings: formSchemaSettingsSchema,
});

// ─── Form Response ────────────────────────────────────────────────────────────

export const fileResponseValueSchema = z.object({
  fileName:  z.string().min(1),
  filePath:  z.string().min(1),
  mimeType:  z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

export const fieldResponseValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
  z.boolean(),
  fileResponseValueSchema,
]);

export const formResponseSchema = z.object({
  version: z.literal(1),
  fields:  z.record(z.string(), fieldResponseValueSchema),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type FormSchemaInput    = z.infer<typeof formSchemaSchema>;
export type FormResponseInput  = z.infer<typeof formResponseSchema>;
