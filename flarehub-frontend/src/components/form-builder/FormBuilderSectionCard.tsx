import { useState } from 'react'
import {
  Trash,
  Plus,
  PencilSimple,
  Check,
  ArrowUp,
  ArrowDown,
} from '@phosphor-icons/react'
import type { FormSection, FormField, FieldType } from '@/types/applicationForm'
import { createEmptyField } from '@/utils/formSchemaHelpers'
import { FormBuilderFieldCard } from './FormBuilderFieldCard'
import { cn } from '@/lib/utils'

interface Props {
  section:          FormSection
  isFirst:          boolean
  isLast:           boolean
  selectedFieldId:  string | null
  onSelectField:    (fieldId: string) => void
  onUpdateSection:  (patch: Partial<FormSection>) => void
  onDeleteSection:  () => void
  onMoveUp:         () => void
  onMoveDown:       () => void
  onAddField:       (field: FormField) => void
  onDeleteField:    (fieldId: string) => void
  onMoveField:      (fieldId: string, dir: 'up' | 'down') => void
}

export function FormBuilderSectionCard({
  section, isFirst, isLast, selectedFieldId,
  onSelectField, onUpdateSection, onDeleteSection,
  onMoveUp, onMoveDown, onAddField, onDeleteField, onMoveField,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title)

  function commitTitle() {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== section.title) {
      onUpdateSection({ title: trimmed })
    } else {
      setTitleDraft(section.title)
    }
  }

  function handleAddField(type: FieldType) {
    onAddField(createEmptyField(type))
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] overflow-hidden">

      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(section.title) }
              }}
              className={cn(
                'w-full text-sm font-semibold bg-white rounded-[var(--radius-sm)] px-2 py-1',
                'border border-[var(--color-green-500)]',
                'focus:outline-none focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.10)]',
              )}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {section.title}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {section.fields.length} {section.fields.length === 1 ? 'field' : 'fields'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {editingTitle ? (
            <HeaderBtn
              onClick={commitTitle}
              title="Save title"
              icon={<Check size={13} />}
              className="text-[var(--color-green-500)]"
            />
          ) : (
            <HeaderBtn
              onClick={() => setEditingTitle(true)}
              title="Edit section title"
              icon={<PencilSimple size={13} />}
            />
          )}
          <HeaderBtn onClick={onMoveUp}   disabled={isFirst}  title="Move section up"   icon={<ArrowUp   size={13} />} />
          <HeaderBtn onClick={onMoveDown} disabled={isLast}   title="Move section down" icon={<ArrowDown  size={13} />} />
          <HeaderBtn
            onClick={onDeleteSection}
            title="Delete section"
            icon={<Trash size={13} />}
            className="hover:text-[var(--color-error)] hover:bg-red-50"
          />
        </div>
      </div>

      {/* Section description */}
      {section.description !== undefined && (
        <div className="px-4 pt-2">
          <input
            value={section.description}
            onChange={(e) => onUpdateSection({ description: e.target.value })}
            placeholder="Section description (optional)"
            className={cn(
              'w-full text-xs text-[var(--color-text-secondary)] bg-transparent',
              'placeholder:text-[var(--color-text-muted)] focus:outline-none',
              'border-b border-transparent focus:border-[var(--color-border)]',
              'pb-1 transition-colors duration-[var(--duration-fast)]',
            )}
          />
        </div>
      )}

      {/* Fields */}
      <div className="px-4 py-3 space-y-2">
        {section.fields.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <Plus size={16} weight="bold" />
            </div>
            <p className="text-xs">Add a field from the left panel</p>
          </div>
        ) : (
          section.fields.map((field, idx) => (
            <FormBuilderFieldCard
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              isFirst={idx === 0}
              isLast={idx === section.fields.length - 1}
              onSelect={() => onSelectField(field.id)}
              onDelete={() => onDeleteField(field.id)}
              onMoveUp={() => onMoveField(field.id, 'up')}
              onMoveDown={() => onMoveField(field.id, 'down')}
            />
          ))
        )}
      </div>

      {/* Add field row */}
      <div className="px-4 pb-3">
        <QuickAddField onAdd={handleAddField} />
      </div>
    </div>
  )
}

// ─── Quick-add row ────────────────────────────────────────────────────────────

const QUICK_TYPES: { type: FieldType; label: string }[] = [
  { type: 'short_text',    label: 'Short text' },
  { type: 'long_text',     label: 'Long text' },
  { type: 'single_choice', label: 'Single choice' },
  { type: 'number',        label: 'Number' },
]

function QuickAddField({ onAdd }: { onAdd: (type: FieldType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)]',
          'border border-dashed border-[var(--color-border)]',
          'text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          'hover:border-[var(--color-green-500)] hover:bg-[var(--color-green-50)]',
          'transition-all duration-[var(--duration-fast)]',
          open && 'border-[var(--color-green-500)] bg-[var(--color-green-50)] text-[var(--color-green-500)]',
        )}
      >
        <Plus size={13} weight="bold" />
        Add field
      </button>

      {open && (
        <div className="mt-1 flex flex-wrap gap-1">
          {QUICK_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => { onAdd(type); setOpen(false) }}
              className="px-2.5 py-1 text-xs rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-green-50)] hover:text-[var(--color-green-600)] border border-[var(--color-border)] transition-colors duration-[var(--duration-fast)]"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── tiny header button ───────────────────────────────────────────────────────

function HeaderBtn({
  onClick, disabled, title, icon, className,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  icon: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-[var(--radius-sm)]',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        'transition-colors duration-[var(--duration-fast)]',
        'focus:outline-none',
        className,
      )}
    >
      {icon}
    </button>
  )
}
