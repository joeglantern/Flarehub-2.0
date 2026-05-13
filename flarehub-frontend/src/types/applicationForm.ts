// ─── Field Types ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'file_upload'
  | 'image_upload'
  | 'video_upload'
  | 'rating'
  | 'yes_no'
  | 'phone'
  | 'email'

// ─── Choice Option ────────────────────────────────────────────────────────────

export interface FieldOption {
  id:    string
  label: string
  value: string
}

// ─── Validation Rules ─────────────────────────────────────────────────────────

export interface FieldValidation {
  minLength?:        number
  maxLength?:        number
  minValue?:         number
  maxValue?:         number
  pattern?:          string
  patternMessage?:   string
  maxFileSizeMB?:    number
  allowedMimeTypes?: string[]
  minDate?:          string
  maxDate?:          string
  minSelected?:      number
  maxSelected?:      number
}

// ─── Conditional Logic ────────────────────────────────────────────────────────

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'

export interface FieldCondition {
  fieldId:  string
  operator: ConditionOperator
  value?:   string | number | boolean
}

export interface ConditionalLogic {
  action:     'show' | 'hide'
  match:      'all' | 'any'
  conditions: FieldCondition[]
}

// ─── Form Field ───────────────────────────────────────────────────────────────

export type AutofillSource = 'email' | 'phone' | 'businessName' | 'fullName'

export interface FormField {
  id:               string
  type:             FieldType
  label:            string
  description?:     string
  placeholder?:     string
  required:         boolean
  options?:         FieldOption[]
  validation:       FieldValidation
  conditionalLogic?: ConditionalLogic
  autofillFrom?:    AutofillSource
}

// ─── Form Section ─────────────────────────────────────────────────────────────

export interface FormSection {
  id:           string
  title:        string
  description?: string
  fields:       FormField[]
}

// ─── Form Schema (stored in Program.applicationForm) ─────────────────────────

export interface FormSchemaSettings {
  allowDraft:         boolean
  showReviewStep:     boolean
  submitButtonLabel?: string
  successMessage?:    string
}

export interface FormSchema {
  version:  1
  sections: FormSection[]
  settings: FormSchemaSettings
}

// ─── Form Response (stored in Application.responses) ─────────────────────────

export interface FileResponseValue {
  fileName:   string
  filePath:   string
  mimeType:   string
  sizeBytes:  number
}

export type FieldResponseValue =
  | string
  | number
  | string[]
  | boolean
  | FileResponseValue

export interface FormResponse {
  version: 1
  fields:  Record<string, FieldResponseValue>
}
