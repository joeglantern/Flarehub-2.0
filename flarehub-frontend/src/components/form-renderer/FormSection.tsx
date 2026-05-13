import type { FormSection as SectionType, FieldResponseValue } from '@/types/applicationForm'
import { fieldIsVisible } from '@/utils/evaluateCondition'
import { FormField } from './FormField'

interface Props {
  section:   SectionType
  responses: Record<string, FieldResponseValue>
  errors:    Record<string, string>
  onChange:  (fieldId: string, value: FieldResponseValue) => void
}

export function FormSection({ section, responses, errors, onChange }: Props) {
  const visibleFields = section.fields.filter((f) => fieldIsVisible(f, responses))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
        {section.description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {section.description}
          </p>
        )}
      </div>

      {visibleFields.map((field) => (
        <FormField
          key={field.id}
          field={field}
          value={responses[field.id]}
          error={errors[field.id]}
          onChange={(value) => onChange(field.id, value)}
        />
      ))}

      {visibleFields.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] italic">No fields to show in this section.</p>
      )}
    </div>
  )
}
