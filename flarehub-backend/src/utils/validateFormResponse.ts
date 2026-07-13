import type {
  FormSchema,
  FormResponse,
  FormField,
  FieldResponseValue,
  FileResponseValue,
  FormValidationError,
} from '../types/applicationForm.js';
import { fieldIsVisible } from './evaluateCondition.js';

function isFileResponse(v: FieldResponseValue | undefined): v is FileResponseValue {
  return v !== undefined && v !== null && typeof v === 'object' && !Array.isArray(v) && 'filePath' in v;
}

function isEmptyValue(v: FieldResponseValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string')         return v.trim() === '';
  if (typeof v === 'number')         return false;
  if (typeof v === 'boolean')        return false;
  if (Array.isArray(v))              return v.length === 0;
  if (isFileResponse(v))             return false;
  return true;
}

function validateField(
  field: FormField,
  value: FieldResponseValue | undefined,
  sectionId: string,
): FormValidationError | null {
  const v = field.validation;

  // Required check
  if (field.required && isEmptyValue(value)) {
    return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} is required` };
  }

  // Skip further checks if empty (already passed required check)
  if (isEmptyValue(value)) return null;

  // value is guaranteed non-empty beyond this point
  const safeValue = value as FieldResponseValue;

  switch (field.type) {
    case 'short_text':
    case 'long_text':
    case 'phone':
    case 'email': {
      const str = String(safeValue);
      if (v.minLength && str.length < v.minLength)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be at least ${v.minLength} characters` };
      if (v.maxLength && str.length > v.maxLength)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be at most ${v.maxLength} characters` };
      if (v.pattern) {
        try {
          if (!new RegExp(v.pattern).test(str))
            return { fieldId: field.id, sectionId, label: field.label, message: v.patternMessage ?? `${field.label} format is invalid` };
        } catch {
          // invalid regex — skip pattern check
        }
      }
      break;
    }

    case 'number':
    case 'rating': {
      const num = typeof safeValue === 'number' ? safeValue : Number(safeValue);
      if (isNaN(num))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be a number` };
      if (v.minValue !== undefined && num < v.minValue)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be at least ${v.minValue}` };
      if (v.maxValue !== undefined && num > v.maxValue)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be at most ${v.maxValue}` };
      break;
    }

    case 'date': {
      const dateStr = String(safeValue);
      const date = new Date(dateStr);
      if (isNaN(date.getTime()))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be a valid date` };
      if (v.minDate && date < new Date(v.minDate))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be on or after ${v.minDate}` };
      if (v.maxDate && date > new Date(v.maxDate))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be on or before ${v.maxDate}` };
      break;
    }

    case 'checkbox': {
      // Required checkbox must be checked; false (unchecked) is not treated as empty
      // by isEmptyValue so we handle it explicitly here
      if (field.required && safeValue !== true) {
        return { fieldId: field.id, sectionId, label: field.label, message: `You must check this box to continue` };
      }
      break;
    }

    case 'single_choice':
    case 'dropdown': {
      const str = String(safeValue);
      const validValues = (field.options ?? []).map((o) => o.value);
      if (!validValues.includes(str))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} has an invalid option selected` };
      break;
    }

    case 'multiple_choice': {
      if (!Array.isArray(safeValue))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be an array of selections` };
      const validValues = (field.options ?? []).map((o) => o.value);
      for (const selected of safeValue) {
        if (!validValues.includes(selected))
          return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} contains an invalid selection` };
      }
      if (v.minSelected !== undefined && safeValue.length < v.minSelected)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} requires at least ${v.minSelected} selections` };
      if (v.maxSelected !== undefined && safeValue.length > v.maxSelected)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} allows at most ${v.maxSelected} selections` };
      break;
    }

    case 'file_upload': {
      if (!isFileResponse(safeValue))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} must be a valid file upload` };
      if (v.maxFileSizeMB && safeValue.sizeBytes > v.maxFileSizeMB * 1024 * 1024)
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} file must be under ${v.maxFileSizeMB} MB` };
      if (v.allowedMimeTypes && v.allowedMimeTypes.length > 0 && !v.allowedMimeTypes.includes(safeValue.mimeType))
        return { fieldId: field.id, sectionId, label: field.label, message: `${field.label} file type is not allowed` };
      break;
    }
  }

  return null;
}

export function validateFormResponse(
  schema: FormSchema,
  response: FormResponse,
): FormValidationError[] {
  const errors: FormValidationError[] = [];
  const allResponses = response.fields;

  for (const section of schema.sections) {
    for (const field of section.fields) {
      // Skip fields that are hidden by conditional logic
      if (!fieldIsVisible(field, allResponses)) continue;

      const error = validateField(field, allResponses[field.id], section.id);
      if (error) errors.push(error);
    }
  }

  return errors;
}
