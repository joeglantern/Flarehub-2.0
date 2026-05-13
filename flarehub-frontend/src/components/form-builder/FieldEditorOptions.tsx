import { useState } from 'react'
import { Plus, Trash, DotsSixVertical } from '@phosphor-icons/react'
import type { FieldOption } from '@/types/applicationForm'
import { uid, slugify } from '@/utils/formSchemaHelpers'
import { cn } from '@/lib/utils'

interface Props {
  options:   FieldOption[]
  onChange:  (options: FieldOption[]) => void
}

export function FieldEditorOptions({ options, onChange }: Props) {
  const [newLabel, setNewLabel] = useState('')

  function addOption() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const opt: FieldOption = { id: uid(), label: trimmed, value: slugify(trimmed) }
    onChange([...options, opt])
    setNewLabel('')
  }

  function updateLabel(id: string, label: string) {
    onChange(options.map((o) => o.id === id ? { ...o, label, value: slugify(label) } : o))
  }

  function removeOption(id: string) {
    onChange(options.filter((o) => o.id !== id))
  }

  function moveOption(id: string, dir: 'up' | 'down') {
    const idx = options.findIndex((o) => o.id === id)
    if (dir === 'up'   && idx === 0)                 return
    if (dir === 'down' && idx === options.length - 1) return
    const next = [...options]
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
        Options
      </p>

      {/* Existing options */}
      {options.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] italic">No options yet — add one below.</p>
      ) : (
        <div className="space-y-1">
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              className="flex items-center gap-2 group"
            >
              <DotsSixVertical
                size={14}
                className="shrink-0 text-[var(--color-text-muted)] cursor-grab"
              />
              <input
                value={opt.label}
                onChange={(e) => updateLabel(opt.id, e.target.value)}
                className={cn(
                  'flex-1 h-8 px-2.5 text-sm rounded-[var(--radius-sm)] border border-[var(--color-border)]',
                  'bg-white focus:outline-none focus:border-[var(--color-green-500)]',
                  'focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_2px_rgba(29,111,66,0.08)]',
                  'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
                )}
              />
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveOption(opt.id, 'up')}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === options.length - 1}
                  onClick={() => moveOption(opt.id, 'down')}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                  aria-label="Remove option"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new option */}
      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addOption()}
          placeholder="New option…"
          className={cn(
            'flex-1 h-8 px-2.5 text-sm rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)]',
            'bg-transparent focus:outline-none focus:border-[var(--color-green-500)] focus:bg-white',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-[border-color,background-color] duration-[var(--duration-fast)]',
          )}
        />
        <button
          type="button"
          onClick={addOption}
          disabled={!newLabel.trim()}
          className={cn(
            'h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)]',
            'bg-[var(--color-green-500)] text-white',
            'hover:bg-[var(--color-green-600)] disabled:opacity-40 disabled:cursor-not-allowed',
            'flex items-center gap-1 transition-colors duration-[var(--duration-fast)]',
          )}
        >
          <Plus size={12} weight="bold" />
          Add
        </button>
      </div>
    </div>
  )
}
