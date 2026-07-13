import { useState } from 'react'
import { X, Eye, CheckCircle } from '@phosphor-icons/react'
import type { FormSchema, FormField, FieldResponseValue } from '@/types/applicationForm'
import { fieldIsVisible } from '@/utils/evaluateCondition'
import { cn } from '@/lib/utils'

interface Props {
  schema:  FormSchema
  onClose: () => void
}

export function FormBuilderPreview({ schema, onClose }: Props) {
  const [step, setStep]         = useState(0)
  const [responses, setResponses] = useState<Record<string, FieldResponseValue>>({})
  const [submitted, setSubmitted] = useState(false)

  const sections = schema.sections
  const total    = sections.length
  const current  = sections[step]

  function setFieldValue(fieldId: string, value: FieldResponseValue) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }))
  }

  function next() {
    if (step < total - 1) setStep((s) => s + 1)
    else setSubmitted(true)
  }

  if (submitted) {
    return (
      <PreviewShell onClose={onClose}>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-green-50)] flex items-center justify-center">
            <CheckCircle size={28} weight="fill" className="text-[var(--color-green-500)]" />
          </div>
          <h2 className="text-xl font-semibold">
            {schema.settings.successMessage ?? 'Application submitted!'}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            This is a preview — nothing was actually sent.
          </p>
          <button
            type="button"
            onClick={() => { setStep(0); setResponses({}); setSubmitted(false) }}
            className="px-5 py-2.5 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            Start over
          </button>
        </div>
      </PreviewShell>
    )
  }

  return (
    <PreviewShell onClose={onClose}>
      {/* Progress dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                'h-2 rounded-full transition-all duration-[var(--duration-default)]',
                i === step
                  ? 'w-6 bg-[var(--color-green-500)]'
                  : i < step
                  ? 'w-2 bg-[var(--color-green-500)]/40'
                  : 'w-2 bg-[var(--color-border)]',
              )}
            />
          ))}
        </div>
      )}

      {current && (
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{current.title}</h2>
            {current.description && (
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{current.description}</p>
            )}
          </div>

          {current.fields
            .filter((f) => fieldIsVisible(f, responses))
            .map((f) => (
              <PreviewField
                key={f.id}
                field={f}
                value={responses[f.id]}
                onChange={(v) => setFieldValue(f.id, v)}
              />
            ))}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              Back
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              {step + 1} / {total}
            </span>
            <button
              type="button"
              onClick={next}
              className="px-5 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-green-500)] text-white hover:bg-[var(--color-green-600)] transition-colors"
            >
              {step === total - 1
                ? (schema.settings.submitButtonLabel ?? 'Submit')
                : 'Next'}
            </button>
          </div>
        </div>
      )}
    </PreviewShell>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function PreviewShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg-base)]">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          <Eye size={16} weight="duotone" className="text-[var(--color-green-500)]" />
          Form preview — not submitting data
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8">{children}</div>
    </div>
  )
}

// ─── Simple field renderers for preview ──────────────────────────────────────

function PreviewField({
  field, value, onChange,
}: {
  field:    FormField
  value:    FieldResponseValue | undefined
  onChange: (v: FieldResponseValue) => void
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
        {field.required && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0" aria-hidden />
        )}
        {field.label}
      </label>
      {field.description && (
        <p className="text-xs text-[var(--color-text-muted)]">{field.description}</p>
      )}
      <PreviewFieldInput field={field} value={value} onChange={onChange} />
    </div>
  )
}

function PreviewFieldInput({
  field, value, onChange,
}: {
  field:    FormField
  value:    FieldResponseValue | undefined
  onChange: (v: FieldResponseValue) => void
}) {
  const inputCls = cn(
    'w-full px-3.5 text-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white',
    'focus:outline-none focus:border-[var(--color-green-500)] focus:bg-[#f7fdf9]',
    'focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.10)]',
    'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)]',
    'placeholder:text-[var(--color-text-muted)]',
  )

  switch (field.type) {
    case 'long_text':
      return (
        <textarea
          rows={3}
          className={cn(inputCls, 'py-2.5 resize-none')}
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'single_choice':
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'px-4 py-2 text-sm rounded-[var(--radius-full)] border transition-all duration-[var(--duration-fast)]',
                value === opt.value
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
                  : 'bg-white border-[var(--color-border)] hover:border-[var(--color-green-500)] hover:text-[var(--color-green-600)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )

    case 'multiple_choice': {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => (
            <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, opt.value]
                    : selected.filter((v) => v !== opt.value)
                  onChange(next)
                }}
                className="w-4 h-4 rounded border-[var(--color-border)] accent-[var(--color-green-500)]"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )
    }

    case 'dropdown':
      return (
        <select
          className={cn(inputCls, 'h-10')}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Choose an option…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )

    case 'checkbox': {
      const checked = value === true
      return (
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <div
            className={cn(
              'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
              'transition-all duration-[var(--duration-fast)]',
              checked
                ? 'bg-[var(--color-green-500)] border-[var(--color-green-500)]'
                : 'border-[var(--color-border)] group-hover:border-[var(--color-green-500)]',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
            />
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-[var(--color-text-primary)]">{field.label}</span>
        </label>
      )
    }

    case 'yes_no':
      return (
        <div className="flex gap-3">
          {['yes', 'no'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v === 'yes')}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-[var(--radius-md)] border transition-all duration-[var(--duration-fast)]',
                (v === 'yes' ? value === true : value === false)
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
                  : 'bg-white border-[var(--color-border)] hover:border-[var(--color-green-500)]',
              )}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )

    case 'rating': {
      const max = field.validation.maxValue ?? 5
      const rating = typeof value === 'number' ? value : 0
      return (
        <div className="flex gap-1.5">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'w-9 h-9 rounded-[var(--radius-md)] text-sm font-semibold border transition-all duration-[var(--duration-fast)]',
                n <= rating
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-green-500)]',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )
    }

    case 'image_upload':
    case 'video_upload':
    case 'file_upload': {
      const accept =
        field.type === 'image_upload' ? 'image/*'
        : field.type === 'video_upload' ? 'video/*'
        : (field.validation.allowedMimeTypes ?? []).join(',') || '*/*'
      return (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 w-full py-8',
            'rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)]',
            'hover:border-[var(--color-green-500)] hover:bg-[var(--color-green-50)]',
            'cursor-pointer transition-all duration-[var(--duration-fast)]',
          )}
        >
          <input type="file" accept={accept} className="sr-only" disabled />
          <span className="text-2xl">
            {field.type === 'image_upload' ? '🖼️' : field.type === 'video_upload' ? '🎥' : '📎'}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {field.type === 'image_upload' ? 'Upload an image'
             : field.type === 'video_upload' ? 'Upload a video'
             : 'Upload a file'}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">Preview only — no file will be saved</span>
        </label>
      )
    }

    default:
      return (
        <input
          type={
            field.type === 'email' ? 'email'
            : field.type === 'phone' ? 'tel'
            : field.type === 'number' ? 'number'
            : field.type === 'date' ? 'date'
            : 'text'
          }
          className={cn(inputCls, 'h-10')}
          placeholder={field.placeholder}
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) =>
            onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
          }
        />
      )
  }
}
