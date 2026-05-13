import type {
  FieldCondition,
  ConditionalLogic,
  FormField,
  FieldResponseValue,
  FileResponseValue,
} from '../types/applicationForm.js';

function isFileResponse(v: FieldResponseValue): v is FileResponseValue {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'filePath' in v;
}

function toComparable(v: FieldResponseValue): string | number | boolean | null {
  if (typeof v === 'string')  return v;
  if (typeof v === 'number')  return v;
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v))       return v.join(',');
  if (isFileResponse(v))      return v.fileName;
  return null;
}

function isEmpty(v: FieldResponseValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string')         return v.trim() === '';
  if (typeof v === 'number')         return false;
  if (typeof v === 'boolean')        return false;
  if (Array.isArray(v))              return v.length === 0;
  if (isFileResponse(v))             return false;
  return true;
}

export function evaluateCondition(
  condition: FieldCondition,
  responses: Record<string, FieldResponseValue>,
): boolean {
  const raw = responses[condition.fieldId];

  switch (condition.operator) {
    case 'is_empty':     return isEmpty(raw);
    case 'is_not_empty': return !isEmpty(raw);
  }

  if (raw === undefined) return false;

  const comparable = toComparable(raw);
  const condVal    = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(comparable) === String(condVal);

    case 'not_equals':
      return String(comparable) !== String(condVal);

    case 'contains':
      return typeof comparable === 'string'
        && comparable.toLowerCase().includes(String(condVal).toLowerCase());

    case 'not_contains':
      return typeof comparable === 'string'
        && !comparable.toLowerCase().includes(String(condVal).toLowerCase());

    case 'greater_than':
      return typeof comparable === 'number' && typeof condVal === 'number'
        ? comparable > condVal
        : Number(comparable) > Number(condVal);

    case 'less_than':
      return typeof comparable === 'number' && typeof condVal === 'number'
        ? comparable < condVal
        : Number(comparable) < Number(condVal);

    default:
      return false;
  }
}

export function evaluateConditionalLogic(
  logic: ConditionalLogic,
  responses: Record<string, FieldResponseValue>,
): boolean {
  const results = logic.conditions.map((c) => evaluateCondition(c, responses));
  const conditionsMet = logic.match === 'all'
    ? results.every(Boolean)
    : results.some(Boolean);

  return logic.action === 'show' ? conditionsMet : !conditionsMet;
}

export function fieldIsVisible(
  field: FormField,
  responses: Record<string, FieldResponseValue>,
): boolean {
  if (!field.conditionalLogic) return true;
  if (field.conditionalLogic.conditions.length === 0) return true;
  return evaluateConditionalLogic(field.conditionalLogic, responses);
}
