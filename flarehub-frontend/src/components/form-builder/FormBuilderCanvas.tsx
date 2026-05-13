import { Plus } from '@phosphor-icons/react'
import type { FormSchema, FormSection, FormField } from '@/types/applicationForm'
import { createEmptySection } from '@/utils/formSchemaHelpers'
import { FormBuilderSectionCard } from './FormBuilderSectionCard'

interface Props {
  schema:          FormSchema
  selectedFieldId: string | null
  onSelectField:   (fieldId: string | null) => void
  onUpdateSchema:  (schema: FormSchema) => void
}

export function FormBuilderCanvas({
  schema, selectedFieldId, onSelectField, onUpdateSchema,
}: Props) {

  // ─── Section mutations ────────────────────────────────────────────────────

  function addSection() {
    onUpdateSchema({
      ...schema,
      sections: [...schema.sections, createEmptySection()],
    })
  }

  function updateSection(sectionId: string, patch: Partial<FormSection>) {
    onUpdateSchema({
      ...schema,
      sections: schema.sections.map((s) =>
        s.id === sectionId ? { ...s, ...patch } : s,
      ),
    })
  }

  function deleteSection(sectionId: string) {
    onUpdateSchema({
      ...schema,
      sections: schema.sections.filter((s) => s.id !== sectionId),
    })
    onSelectField(null)
  }

  function moveSection(sectionId: string, dir: 'up' | 'down') {
    const idx = schema.sections.findIndex((s) => s.id === sectionId)
    if (idx === -1) return
    if (dir === 'up'   && idx === 0)                    return
    if (dir === 'down' && idx === schema.sections.length - 1) return
    const next = [...schema.sections]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    onUpdateSchema({ ...schema, sections: next })
  }

  // ─── Field mutations ──────────────────────────────────────────────────────

  function addField(sectionId: string, field: FormField) {
    updateSection(sectionId, {
      fields: [
        ...(schema.sections.find((s) => s.id === sectionId)?.fields ?? []),
        field,
      ],
    })
    onSelectField(field.id)
  }

  function deleteField(sectionId: string, fieldId: string) {
    const section = schema.sections.find((s) => s.id === sectionId)
    if (!section) return
    updateSection(sectionId, {
      fields: section.fields.filter((f) => f.id !== fieldId),
    })
    if (selectedFieldId === fieldId) onSelectField(null)
  }

  function moveField(sectionId: string, fieldId: string, dir: 'up' | 'down') {
    const section = schema.sections.find((s) => s.id === sectionId)
    if (!section) return
    const idx = section.fields.findIndex((f) => f.id === fieldId)
    if (idx === -1) return
    if (dir === 'up'   && idx === 0)                     return
    if (dir === 'down' && idx === section.fields.length - 1) return
    const next = [...section.fields]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    updateSection(sectionId, { fields: next })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      onClick={(e) => {
        // deselect when clicking canvas background
        if (e.target === e.currentTarget) onSelectField(null)
      }}
    >
      {schema.sections.length === 0 ? (
        <EmptyCanvas onAdd={addSection} />
      ) : (
        schema.sections.map((section, idx) => (
          <FormBuilderSectionCard
            key={section.id}
            section={section}
            isFirst={idx === 0}
            isLast={idx === schema.sections.length - 1}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
            onUpdateSection={(patch) => updateSection(section.id, patch)}
            onDeleteSection={() => deleteSection(section.id)}
            onMoveUp={() => moveSection(section.id, 'up')}
            onMoveDown={() => moveSection(section.id, 'down')}
            onAddField={(field) => addField(section.id, field)}
            onDeleteField={(fid) => deleteField(section.id, fid)}
            onMoveField={(fid, dir) => moveField(section.id, fid, dir)}
          />
        ))
      )}

      {/* Add section button */}
      {schema.sections.length > 0 && (
        <button
          type="button"
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:border-[var(--color-green-500)] hover:text-[var(--color-green-500)] hover:bg-[var(--color-green-50)] transition-all duration-[var(--duration-fast)]"
        >
          <Plus size={16} weight="bold" />
          Add section
        </button>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCanvas({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-green-50)] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="24" height="20" rx="3" stroke="var(--color-green-500)" strokeWidth="1.5" fill="none"/>
          <line x1="9" y1="12" x2="23" y2="12" stroke="var(--color-green-500)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="16" x2="19" y2="16" stroke="var(--color-green-500)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="20" x2="15" y2="20" stroke="var(--color-green-500)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          Start building your form
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
          Add a section to get started, then drag field types from the left panel.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-green-500)] text-white hover:bg-[var(--color-green-600)] transition-colors duration-[var(--duration-fast)]"
      >
        <Plus size={15} weight="bold" />
        Add first section
      </button>
    </div>
  )
}
