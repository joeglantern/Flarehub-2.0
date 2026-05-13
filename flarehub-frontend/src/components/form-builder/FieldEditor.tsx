import { X } from '@phosphor-icons/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import type { FormField, FormSchema } from '@/types/applicationForm'
import { hasOptions, hasPlaceholder, getAllFields } from '@/utils/formSchemaHelpers'
import { FieldEditorOptions }     from './FieldEditorOptions'
import { FieldEditorValidation }  from './FieldEditorValidation'
import { FieldEditorConditional } from './FieldEditorConditional'
import { cn } from '@/lib/utils'

interface Props {
  field:    FormField
  schema:   FormSchema
  onChange: (updated: FormField) => void
  onClose:  () => void
}

export function FieldEditor({ field, schema, onChange, onClose }: Props) {
  // All fields in the form except the one being edited (for conditional target selection)
  const otherFields = getAllFields(schema)
    .filter((f) => f.id !== field.id)
    .map(({ sectionId: _, ...f }) => f)

  function patch(updates: Partial<FormField>) {
    onChange({ ...field, ...updates })
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Edit field
          </p>
          <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[180px]">
            {field.label || 'Untitled field'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close editor"
          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-inset)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="settings" className="flex flex-col h-full">
          <TabsList className="px-4 shrink-0">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
          </TabsList>

          {/* ── Settings ─────────────────────────────────────────────── */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            <FieldInput
              label="Label"
              value={field.label}
              required
              onChange={(v) => patch({ label: v })}
            />

            <FieldInput
              label="Description / hint"
              value={field.description ?? ''}
              onChange={(v) => patch({ description: v || undefined })}
            />

            {hasPlaceholder(field.type) && (
              <FieldInput
                label="Placeholder"
                value={field.placeholder ?? ''}
                onChange={(v) => patch({ placeholder: v || undefined })}
              />
            )}

            {/* Required toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => patch({ required: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-9 h-5 rounded-full transition-colors duration-[var(--duration-default)]',
                    field.required
                      ? 'bg-[var(--color-green-500)]'
                      : 'bg-[var(--color-bg-inset)]',
                  )}
                />
                <div
                  className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm',
                    'transition-transform duration-[var(--duration-default)]',
                    field.required && 'translate-x-4',
                  )}
                />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Required</span>
                {field.required && (
                  <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] align-middle" />
                )}
              </div>
            </label>

            {/* Options (for choice fields) */}
            {hasOptions(field.type) && (
              <div className="pt-1 border-t border-[var(--color-border)]">
                <FieldEditorOptions
                  options={field.options ?? []}
                  onChange={(options) => patch({ options })}
                />
              </div>
            )}
          </TabsContent>

          {/* ── Validation ───────────────────────────────────────────── */}
          <TabsContent value="validation" className="flex-1 overflow-y-auto px-4 py-4">
            <FieldEditorValidation
              field={field}
              onChange={(validation) => patch({ validation })}
            />
          </TabsContent>

          {/* ── Conditional Logic ────────────────────────────────────── */}
          <TabsContent value="logic" className="flex-1 overflow-y-auto px-4 py-4">
            <FieldEditorConditional
              field={field}
              allFields={otherFields}
              onChange={(logic) => patch({ conditionalLogic: logic })}
            />
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  )
}

// ─── Small shared text input ──────────────────────────────────────────────────

function FieldInput({
  label, value, onChange, required,
}: {
  label:    string
  value:    string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
        {required && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0" aria-hidden />
        )}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-9 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-white focus:outline-none focus:border-[var(--color-green-500)]',
          'focus:bg-[#f7fdf9] focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.10)]',
          'placeholder:text-[var(--color-text-muted)]',
          'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)]',
        )}
      />
    </div>
  )
}
