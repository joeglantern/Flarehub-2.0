import type { FormField, FieldValidation } from '@/types/applicationForm'
import {
  hasTextValidation,
  hasNumericValidation,
  hasDateValidation,
  hasFileValidation,
  hasSelectionValidation,
} from '@/utils/formSchemaHelpers'
import { cn } from '@/lib/utils'

interface Props {
  field:    FormField
  onChange: (v: FieldValidation) => void
}

export function FieldEditorValidation({ field, onChange }: Props) {
  const v = field.validation

  function patch(updates: Partial<FieldValidation>) {
    onChange({ ...v, ...updates })
  }

  const showText      = hasTextValidation(field.type)
  const showNumeric   = hasNumericValidation(field.type)
  const showDate      = hasDateValidation(field.type)
  const showFile      = hasFileValidation(field.type)
  const showSelection = hasSelectionValidation(field.type)

  if (!showText && !showNumeric && !showDate && !showFile && !showSelection) {
    return (
      <p className="text-xs text-[var(--color-text-muted)] italic">
        No validation options for this field type.
      </p>
    )
  }

  return (
    <div className="space-y-4">

      {showText && (
        <Section label="Length constraints">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Min length"
              value={v.minLength}
              onChange={(n) => patch({ minLength: n })}
            />
            <NumberInput
              label="Max length"
              value={v.maxLength}
              onChange={(n) => patch({ maxLength: n })}
            />
          </div>
          {field.type !== 'email' && field.type !== 'phone' && (
            <>
              <SmallInput
                label="Pattern (regex)"
                value={v.pattern ?? ''}
                placeholder="e.g. ^[A-Z].*"
                onChange={(s) => patch({ pattern: s || undefined })}
              />
              <SmallInput
                label="Pattern error message"
                value={v.patternMessage ?? ''}
                placeholder="e.g. Must start with a capital letter"
                onChange={(s) => patch({ patternMessage: s || undefined })}
              />
            </>
          )}
        </Section>
      )}

      {showNumeric && (
        <Section label="Value range">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Min value"
              value={v.minValue}
              onChange={(n) => patch({ minValue: n })}
            />
            <NumberInput
              label="Max value"
              value={v.maxValue}
              onChange={(n) => patch({ maxValue: n })}
            />
          </div>
        </Section>
      )}

      {showDate && (
        <Section label="Date range">
          <div className="grid grid-cols-2 gap-2">
            <SmallInput
              label="Min date"
              value={v.minDate ?? ''}
              type="date"
              onChange={(s) => patch({ minDate: s || undefined })}
            />
            <SmallInput
              label="Max date"
              value={v.maxDate ?? ''}
              type="date"
              onChange={(s) => patch({ maxDate: s || undefined })}
            />
          </div>
        </Section>
      )}

      {showFile && (
        <Section label="File constraints">
          <NumberInput
            label="Max file size (MB)"
            value={v.maxFileSizeMB}
            onChange={(n) => patch({ maxFileSizeMB: n })}
          />
          <SmallInput
            label="Allowed MIME types"
            value={(v.allowedMimeTypes ?? []).join(', ')}
            placeholder="e.g. image/jpeg, application/pdf"
            onChange={(s) =>
              patch({
                allowedMimeTypes: s
                  ? s.split(',').map((t) => t.trim()).filter(Boolean)
                  : undefined,
              })
            }
          />
        </Section>
      )}

      {showSelection && (
        <Section label="Selection limits">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Min selected"
              value={v.minSelected}
              onChange={(n) => patch({ minSelected: n })}
            />
            <NumberInput
              label="Max selected"
              value={v.maxSelected}
              onChange={(n) => patch({ maxSelected: n })}
            />
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      {children}
    </div>
  )
}

function NumberInput({
  label, value, onChange,
}: {
  label: string
  value: number | undefined
  onChange: (n: number | undefined) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={inputCls}
        min={0}
      />
    </div>
  )
}

function SmallInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (s: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  )
}

const inputCls = cn(
  'w-full h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)]',
  'bg-white focus:outline-none focus:border-[var(--color-green-500)]',
  'focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_2px_rgba(29,111,66,0.08)]',
  'placeholder:text-[var(--color-text-muted)]',
  'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
)
