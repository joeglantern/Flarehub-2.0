import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  fieldId:     string
  label:       string
  description?: string
  required?:   boolean
  error?:      string
  children:    ReactNode
}

export function FieldWrapper({ fieldId, label, description, required, error, children }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="flex items-start gap-2">
        {required && (
          <span
            aria-hidden
            className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0"
          />
        )}
        <div className="space-y-0.5">
          <span className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
            {label}
          </span>
          {description && (
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
      </label>

      {children}

      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-error)] flex items-center gap-1">
          <span aria-hidden>●</span> {error}
        </p>
      )}
    </div>
  )
}

// ─── Shared input class ───────────────────────────────────────────────────────

export const inputCls = cn(
  'w-full px-3.5 text-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:border-[var(--color-green-500)] focus:bg-[#f7fdf9]',
  'focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.10)]',
  'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
)
