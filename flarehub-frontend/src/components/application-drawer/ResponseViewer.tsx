import type { FormSchema, FormResponse } from '@/types/applicationForm'
import { fieldIsVisible } from '@/utils/evaluateCondition'
import { ResponseFieldValue } from './ResponseFieldValue'
import { Spinner } from '@/components/ui/Spinner'

interface Props {
  schema:    FormSchema
  responses: FormResponse
}

export function ResponseViewer({ schema, responses }: Props) {
  const fields = responses.fields ?? {}

  return (
    <div className="space-y-5">
      {schema.sections.map((section) => {
        const visibleFields = section.fields.filter((f) => fieldIsVisible(f, fields))
        if (visibleFields.length === 0) return null

        return (
          <div key={section.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border)] overflow-hidden">
            {/* Section header */}
            <div className="px-4 py-2.5 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                {section.title}
              </p>
              {section.description && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{section.description}</p>
              )}
            </div>

            {/* Fields */}
            <div className="divide-y divide-[var(--color-border)]">
              {visibleFields.map((field) => (
                <div key={field.id} className="px-4 py-3.5 space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    {field.required && (
                      <span className="mt-1 w-1 h-1 rounded-full bg-[var(--color-terra-500)] shrink-0" />
                    )}
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {field.label}
                    </p>
                  </div>
                  <ResponseFieldValue
                    field={field}
                    value={fields[field.id]}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

export function ResponseViewerSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="sm" className="text-[var(--color-green-500)]" />
    </div>
  )
}

// ─── Empty state (no form responses) ─────────────────────────────────────────

export function ResponseViewerEmpty() {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-[var(--color-text-secondary)] font-medium">No form responses</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        This application was submitted without a custom form.
      </p>
    </div>
  )
}
