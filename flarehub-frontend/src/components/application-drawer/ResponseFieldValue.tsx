import { Star, File, ArrowSquareOut } from '@phosphor-icons/react'
import type { FormField, FieldResponseValue, FileResponseValue } from '@/types/applicationForm'
import { cn } from '@/lib/utils'

interface Props {
  field: FormField
  value: FieldResponseValue | undefined
}

export function ResponseFieldValue({ field, value }: Props) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-sm text-[var(--color-text-muted)] italic">No answer</span>
  }

  switch (field.type) {

    // ── Checkbox ─────────────────────────────────────────────────────────
    case 'checkbox':
      return (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full',
          value === true
            ? 'bg-[var(--color-green-50)] text-[var(--color-green-600)] border border-[var(--color-green-100)]'
            : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
        )}>
          {value === true ? '✓ Checked' : '✗ Unchecked'}
        </span>
      )

    // ── Yes / No ─────────────────────────────────────────────────────────
    case 'yes_no':
      return (
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full',
          value === true
            ? 'bg-[var(--color-green-50)] text-[var(--color-green-600)] border border-[var(--color-green-100)]'
            : 'bg-red-50 text-red-600 border border-red-100',
        )}>
          {value === true ? 'Yes' : 'No'}
        </span>
      )

    // ── Rating ────────────────────────────────────────────────────────────
    case 'rating': {
      const max    = field.validation.maxValue ?? 5
      const rating = typeof value === 'number' ? value : 0
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <Star
              key={n}
              size={15}
              weight={n <= rating ? 'fill' : 'regular'}
              className={n <= rating ? 'text-amber-400' : 'text-[var(--color-border)]'}
            />
          ))}
          <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">
            {rating} / {max}
          </span>
        </div>
      )
    }

    // ── Single choice ─────────────────────────────────────────────────────
    case 'single_choice': {
      const opt = field.options?.find((o) => o.value === value)
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
          {opt?.label ?? String(value)}
        </span>
      )
    }

    // ── Multiple choice ───────────────────────────────────────────────────
    case 'multiple_choice': {
      const vals = Array.isArray(value) ? value : []
      if (vals.length === 0) {
        return <span className="text-sm text-[var(--color-text-muted)] italic">None selected</span>
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {vals.map((v) => {
            const opt = field.options?.find((o) => o.value === v)
            return (
              <span
                key={v}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--color-green-50)] text-[var(--color-green-600)] border border-[var(--color-green-100)]"
              >
                {opt?.label ?? v}
              </span>
            )
          })}
        </div>
      )
    }

    // ── Dropdown ──────────────────────────────────────────────────────────
    case 'dropdown': {
      const opt = field.options?.find((o) => o.value === value)
      return <span className="text-sm text-[var(--color-text-primary)]">{opt?.label ?? String(value)}</span>
    }

    // ── Date ──────────────────────────────────────────────────────────────
    case 'date':
      return (
        <span className="text-sm text-[var(--color-text-primary)]">
          {new Date(String(value)).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      )

    // ── File / Image / Video ──────────────────────────────────────────────
    case 'file_upload':
    case 'image_upload':
    case 'video_upload': {
      const file = value as FileResponseValue
      if (!file?.fileName) return <span className="text-sm text-[var(--color-text-muted)] italic">No file</span>
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <File size={14} className="text-[var(--color-text-muted)] shrink-0" />
            <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[200px]">
              {file.fileName}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] shrink-0">
              {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          {file.filePath && (
            <a
              href={file.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-green-500)] hover:bg-[var(--color-green-50)] transition-colors"
              title="Download file"
            >
              <ArrowSquareOut size={14} />
            </a>
          )}
        </div>
      )
    }

    // ── Long text ─────────────────────────────────────────────────────────
    case 'long_text':
      return (
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
          {String(value)}
        </p>
      )

    // ── Default (short text, email, phone, number) ────────────────────────
    default:
      return <span className="text-sm text-[var(--color-text-primary)]">{String(value)}</span>
  }
}
