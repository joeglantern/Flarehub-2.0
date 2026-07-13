// ─── Field Types ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'checkbox'
  | 'file_upload'
  | 'image_upload'
  | 'video_upload'
  | 'rating'
  | 'yes_no'
  | 'phone'
  | 'email';

// ─── Choice Option ────────────────────────────────────────────────────────────

export interface FieldOption {
  id:    string;   // stable UUID — never changes even if label is edited
  label: string;
  value: string;   // slugified label, stored in responses
}

// ─── Validation Rules ─────────────────────────────────────────────────────────

export interface FieldValidation {
  minLength?:        number;    // short_text, long_text
  maxLength?:        number;    // short_text, long_text
  minValue?:         number;    // number, rating
  maxValue?:         number;    // number, rating
  pattern?:          string;    // regex string
  patternMessage?:   string;    // human-readable error when pattern fails
  maxFileSizeMB?:    number;    // file_upload
  allowedMimeTypes?: string[];  // file_upload e.g. ['image/jpeg', 'application/pdf']
  minDate?:          string;    // date — ISO 8601
  maxDate?:          string;    // date — ISO 8601
  minSelected?:      number;    // multiple_choice
  maxSelected?:      number;    // multiple_choice
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
  | 'less_than';

export interface FieldCondition {
  fieldId:  string;
  operator: ConditionOperator;
  value?:   string | number | boolean;
}

export interface ConditionalLogic {
  action:     'show' | 'hide';
  match:      'all' | 'any';
  conditions: FieldCondition[];
}

// ─── Form Field ───────────────────────────────────────────────────────────────

export type AutofillSource = 'email' | 'phone' | 'businessName' | 'fullName';

export interface FormField {
  id:               string;             // crypto.randomUUID()
  type:             FieldType;
  label:            string;
  description?:     string;             // hint shown below the label
  placeholder?:     string;
  required:         boolean;
  options?:         FieldOption[];      // single_choice, multiple_choice, dropdown
  validation:       FieldValidation;
  conditionalLogic?: ConditionalLogic;
  autofillFrom?:    AutofillSource;
}

// ─── Form Section ─────────────────────────────────────────────────────────────

export interface FormSection {
  id:           string;   // crypto.randomUUID()
  title:        string;
  description?: string;
  fields:       FormField[];
}

// ─── Form Schema (stored in Program.applicationForm) ─────────────────────────

export interface FormSchemaSettings {
  allowDraft:         boolean;
  showReviewStep:     boolean;
  submitButtonLabel?: string;
  successMessage?:    string;
}

export interface FormSchema {
  version:  1;
  sections: FormSection[];
  settings: FormSchemaSettings;
}

// ─── Form Response (stored in Application.responses) ─────────────────────────

export interface FileResponseValue {
  fileName:   string;
  filePath:   string;    // Supabase storage path — used to generate signed download URL
  mimeType:   string;
  sizeBytes:  number;
}

export type FieldResponseValue =
  | string            // short_text, long_text, email, phone, date, dropdown
  | number            // number, rating
  | string[]          // multiple_choice (array of FieldOption.value)
  | boolean           // yes_no
  | FileResponseValue; // file_upload

export interface FormResponse {
  version: 1;
  fields:  Record<string, FieldResponseValue>; // key = FormField.id
}

// ─── Validation Error ─────────────────────────────────────────────────────────

export interface FormValidationError {
  fieldId:   string;
  sectionId: string;
  label:     string;
  message:   string;
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

export function createEmptyFormSchema(): FormSchema {
  return {
    version:  1,
    sections: [],
    settings: {
      allowDraft:     true,
      showReviewStep: true,
    },
  };
}
