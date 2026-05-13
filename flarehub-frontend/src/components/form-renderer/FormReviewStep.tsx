import { PencilSimple, Star, CheckCircle, File } from '@phosphor-icons/react'
import type { FormSchema, FieldResponseValue, FileResponseValue } from '@/types/applicationForm'
import { fieldIsVisible } from '@/utils/evaluateCondition'
import { cn } from '@/lib/utils'

interface Props {
  schema:    FormSchema
  responses: Record<string, FieldResponseValue>
  onEdit:    (step: number) => void
}

export function FormReviewStep({ schema, responses, onEdit }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Review your application</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Check your answers before submitting. Click the edit button on any section to go back.
        </p>
      </div>

      {schema.sections.map((section, idx) => {
        const visibleFields = section.fields.filter((f) => fieldIsVisible(f, responses))
        if (visibleFields.length === 0) return null

        return (
          <div key={section.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</span>
              <button
                type="button"
                onClick={() => onEdit(idx)}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
              >
                <PencilSimple size={12} />
                Edit
              </button>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {visibleFields.map((field) => (
                <div key={field.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{field.label}</p>
                    <ReviewValue field={field} value={responses[field.id]} />
                  </div>
                  {responses[field.id] !== undefined && responses[field.id] !== '' && (
                    <CheckCircle size={14} weight="fill" className="text-[var(--color-green-500)] shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Per-type value renderer ──────────────────────────────────────────────────

function ReviewValue({ field, value }: { field: { type: string; options?: { value: string; label: string }[] }; value: FieldResponseValue | undefined }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-sm text-[var(--color-text-muted)] italic">Not answered</span>
  }

  switch (field.type) {
    case 'yes_no':
      return (
        <span className={cn(
          'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full',
          value === true
            ? 'bg-[var(--color-green-50)] text-[var(--color-green-600)]'
            : 'bg-red-50 text-red-600',
        )}>
          {value === true ? 'Yes' : 'No'}
        </span>
      )

    case 'rating': {
      const rating = typeof value === 'number' ? value : 0
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
            <Star
              key={n}
              size={14}
              weight={n <= rating ? 'fill' : 'regular'}
              className={n <= rating ? 'text-amber-400' : 'text-[var(--color-border)]'}
            />
          ))}
          <span className="text-xs text-[var(--color-text-muted)] ml-1">{rating}/5</span>
        </div>
      )
    }

    case 'single_choice': {
      const opt = field.options?.find((o) => o.value === value)
      return <span className="text-sm text-[var(--color-text-primary)]">{opt?.label ?? String(value)}</span>
    }

    case 'multiple_choice': {
      const vals = Array.isArray(value) ? value : []
      if (vals.length === 0) return <span className="text-sm text-[var(--color-text-muted)] italic">None selected</span>
      return (
        <div className="flex flex-wrap gap-1.5">
          {vals.map((v) => {
            const opt = field.options?.find((o) => o.value === v)
            return (
              <span key={v} className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-green-50)] text-[var(--color-green-600)] border border-[var(--color-green-100)]">
                {opt?.label ?? v}
              </span>
            )
          })}
        </div>
      )
    }

    case 'file_upload':
    case 'image_upload':
    case 'video_upload': {
      const file = value as FileResponseValue
      return (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
          <File size={14} className="text-[var(--color-text-muted)]" />
          {file?.fileName ?? 'File selected'}
        </div>
      )
    }

    case 'date':
      return (
        <span className="text-sm text-[var(--color-text-primary)]">
          {new Date(String(value)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      )

    default:
      return <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{String(value)}</p>
  }
}
