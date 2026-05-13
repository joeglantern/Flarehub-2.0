import type { FieldType, FormField, FormSection, FormSchema } from '@/types/applicationForm'

export function uid(): string {
  return crypto.randomUUID()
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50)
}

export function createEmptyField(type: FieldType): FormField {
  return {
    id:         uid(),
    type,
    label:      getFieldTypeLabel(type),
    required:   false,
    validation: {},
    ...(hasOptions(type) ? { options: [] } : {}),
  }
}

export function createEmptySection(): FormSection {
  return {
    id:     uid(),
    title:  'Untitled section',
    fields: [],
  }
}

export function createDefaultFormSchema(): FormSchema {
  return {
    version:  1,
    sections: [],
    settings: {
      allowDraft:     true,
      showReviewStep: true,
    },
  }
}

// ─── Field metadata ───────────────────────────────────────────────────────────

export function getFieldTypeLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    short_text:      'Short text',
    long_text:       'Long text',
    number:          'Number',
    date:            'Date',
    single_choice:   'Single choice',
    multiple_choice: 'Multiple choice',
    dropdown:        'Dropdown',
    file_upload:     'File upload',
    image_upload:    'Image upload',
    video_upload:    'Video upload',
    rating:          'Rating',
    yes_no:          'Yes / No',
    phone:           'Phone',
    email:           'Email',
  }
  return labels[type]
}

export function hasOptions(type: FieldType): boolean {
  return type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown'
}

export function hasPlaceholder(type: FieldType): boolean {
  return ['short_text', 'long_text', 'number', 'email', 'phone'].includes(type)
}

export function hasTextValidation(type: FieldType): boolean {
  return ['short_text', 'long_text', 'email', 'phone'].includes(type)
}

export function hasNumericValidation(type: FieldType): boolean {
  return type === 'number' || type === 'rating'
}

export function hasDateValidation(type: FieldType): boolean {
  return type === 'date'
}

export function hasFileValidation(type: FieldType): boolean {
  return type === 'file_upload' || type === 'image_upload' || type === 'video_upload'
}

export function hasSelectionValidation(type: FieldType): boolean {
  return type === 'multiple_choice'
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

export function getAllFields(schema: FormSchema): Array<FormField & { sectionId: string }> {
  return schema.sections.flatMap((s) =>
    s.fields.map((f) => ({ ...f, sectionId: s.id })),
  )
}

export function countFields(schema: FormSchema): number {
  return schema.sections.reduce((n, s) => n + s.fields.length, 0)
}
