import { useState, useCallback } from 'react'
import {
  FloppyDisk,
  Eye,
  ArrowLeft,
  Check,
  Spinner,
  Gear,
} from '@phosphor-icons/react'
import type { FormSchema, FormField, FieldType } from '@/types/applicationForm'
import { createEmptyField, createDefaultFormSchema, countFields } from '@/utils/formSchemaHelpers'
import { FormBuilderSidebar }  from './FormBuilderSidebar'
import { FormBuilderCanvas }   from './FormBuilderCanvas'
import { FieldEditor }         from './FieldEditor'
import { FormBuilderPreview }  from './FormBuilderPreview'
import { cn } from '@/lib/utils'

interface Props {
  initialSchema: FormSchema | null
  programName:   string
  isSaving?:     boolean
  saveError?:    string | null
  onSave:        (schema: FormSchema) => void
  onBack:        () => void
}

export function FormBuilder({
  initialSchema, programName, isSaving, saveError, onSave, onBack,
}: Props) {
  const [schema, setSchema]             = useState<FormSchema>(initialSchema ?? createDefaultFormSchema())
  const [selectedFieldId, setSelectedId] = useState<string | null>(null)
  const [showPreview, setShowPreview]   = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [savedOnce, setSavedOnce]       = useState(false)

  // ─── Find selected field ────────────────────────────────────────────────

  const selectedField = selectedFieldId
    ? schema.sections.flatMap((s) => s.fields).find((f) => f.id === selectedFieldId) ?? null
    : null

  // ─── Add field from sidebar ─────────────────────────────────────────────

  const handleSidebarAdd = useCallback(
    (type: FieldType) => {
      const field = createEmptyField(type)
      // Add to last section, or create one if none exists
      setSchema((prev) => {
        if (prev.sections.length === 0) {
          const section = {
            id:     crypto.randomUUID(),
            title:  'Section 1',
            fields: [field],
          }
          return { ...prev, sections: [section] }
        }
        const sections = prev.sections.map((s, i) =>
          i === prev.sections.length - 1 ? { ...s, fields: [...s.fields, field] } : s,
        )
        return { ...prev, sections }
      })
      setSelectedId(field.id)
    },
    [],
  )

  // ─── Update selected field ──────────────────────────────────────────────

  function handleFieldChange(updated: FormField) {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        fields: s.fields.map((f) => (f.id === updated.id ? updated : f)),
      })),
    }))
  }

  // ─── Save ───────────────────────────────────────────────────────────────

  function handleSave() {
    onSave(schema)
    setSavedOnce(true)
  }

  const fieldCount = countFields(schema)

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-base)] overflow-hidden">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center gap-3 px-4 bg-white border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]">

        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Program name + form indicator */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {programName}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">— Application Form</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--color-text-muted)]">
              {schema.sections.length} section{schema.sections.length !== 1 ? 's' : ''},&nbsp;
              {fieldCount} field{fieldCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Settings */}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            title="Form settings"
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)]',
              'border transition-colors duration-[var(--duration-fast)]',
              showSettings
                ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-strong)] text-[var(--color-text-primary)]'
                : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
            )}
          >
            <Gear size={14} />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Preview */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-[var(--radius-md)] bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] transition-colors duration-[var(--duration-fast)]"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Save */}
          {saveError && (
            <span className="text-xs text-[var(--color-error)]">{saveError}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-1.5 h-8 px-4 text-xs font-semibold rounded-[var(--radius-md)]',
              'bg-[var(--color-green-500)] text-white',
              'hover:bg-[var(--color-green-600)] disabled:opacity-60 disabled:cursor-not-allowed',
              'transition-colors duration-[var(--duration-fast)]',
            )}
          >
            {isSaving ? (
              <Spinner size={13} className="animate-spin" />
            ) : savedOnce ? (
              <Check size={13} weight="bold" />
            ) : (
              <FloppyDisk size={13} weight="duotone" />
            )}
            Save
          </button>
        </div>
      </header>

      {/* ── Settings bar ──────────────────────────────────────────────────── */}
      {showSettings && (
        <FormSettingsBar schema={schema} onChange={setSchema} />
      )}

      {/* ── Main 3-panel layout ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: field type palette */}
        <FormBuilderSidebar onAdd={handleSidebarAdd} />

        {/* Center: canvas */}
        <FormBuilderCanvas
          schema={schema}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedId}
          onUpdateSchema={setSchema}
        />

        {/* Right: field editor (when a field is selected) */}
        {selectedField && (
          <FieldEditor
            field={selectedField}
            schema={schema}
            onChange={handleFieldChange}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* ── Preview overlay ───────────────────────────────────────────────── */}
      {showPreview && (
        <FormBuilderPreview
          schema={schema}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

// ─── Form settings bar ────────────────────────────────────────────────────────

function FormSettingsBar({
  schema, onChange,
}: {
  schema:   FormSchema
  onChange: (s: FormSchema) => void
}) {
  const s = schema.settings

  function patch(updates: Partial<typeof s>) {
    onChange({ ...schema, settings: { ...s, ...updates } })
  }

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-6 px-5 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-sm">

      <ToggleSetting
        label="Allow saving drafts"
        checked={s.allowDraft}
        onChange={(v) => patch({ allowDraft: v })}
      />

      <ToggleSetting
        label="Show review step"
        checked={s.showReviewStep}
        onChange={(v) => patch({ showReviewStep: v })}
      />

      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--color-text-secondary)]">Submit button label</label>
        <input
          type="text"
          value={s.submitButtonLabel ?? ''}
          onChange={(e) => patch({ submitButtonLabel: e.target.value || undefined })}
          placeholder="Submit application"
          className="h-7 px-2.5 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-green-500)] transition-colors w-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--color-text-secondary)]">Success message</label>
        <input
          type="text"
          value={s.successMessage ?? ''}
          onChange={(e) => patch({ successMessage: e.target.value || undefined })}
          placeholder="Application submitted!"
          className="h-7 px-2.5 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white focus:outline-none focus:border-[var(--color-green-500)] transition-colors w-48"
        />
      </div>
    </div>
  )
}

function ToggleSetting({
  label, checked, onChange,
}: {
  label:    string
  checked:  boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div className={cn('w-8 h-4 rounded-full transition-colors', checked ? 'bg-[var(--color-green-500)]' : 'bg-[var(--color-bg-inset)]')} />
        <div className={cn('absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform', checked && 'translate-x-4')} />
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </label>
  )
}
