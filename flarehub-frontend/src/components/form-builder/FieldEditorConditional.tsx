import { Plus, Trash } from '@phosphor-icons/react'
import type {
  FormField,
  ConditionalLogic,
  FieldCondition,
  ConditionOperator,
} from '@/types/applicationForm'
import { cn } from '@/lib/utils'

// ─── Operator options ─────────────────────────────────────────────────────────

const ALL_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals',        label: 'equals' },
  { value: 'not_equals',    label: 'does not equal' },
  { value: 'contains',      label: 'contains' },
  { value: 'not_contains',  label: 'does not contain' },
  { value: 'is_empty',      label: 'is empty' },
  { value: 'is_not_empty',  label: 'is not empty' },
  { value: 'greater_than',  label: 'greater than' },
  { value: 'less_than',     label: 'less than' },
]

const VALUE_LESS: ConditionOperator[] = ['is_empty', 'is_not_empty']

interface Props {
  field:         FormField
  allFields:     FormField[]   // all fields in the form (except this one)
  onChange:      (logic: ConditionalLogic | undefined) => void
}

export function FieldEditorConditional({ field, allFields, onChange }: Props) {
  const logic = field.conditionalLogic

  function enable() {
    onChange({
      action:     'show',
      match:      'all',
      conditions: [],
    })
  }

  function disable() {
    onChange(undefined)
  }

  function patchLogic(patch: Partial<ConditionalLogic>) {
    if (!logic) return
    onChange({ ...logic, ...patch })
  }

  function addCondition() {
    if (!logic) return
    const first = allFields[0]
    if (!first) return
    const condition: FieldCondition = {
      fieldId:  first.id,
      operator: 'equals',
      value:    '',
    }
    patchLogic({ conditions: [...logic.conditions, condition] })
  }

  function updateCondition(idx: number, patch: Partial<FieldCondition>) {
    if (!logic) return
    const next = logic.conditions.map((c, i) => i === idx ? { ...c, ...patch } : c)
    patchLogic({ conditions: next })
  }

  function removeCondition(idx: number) {
    if (!logic) return
    patchLogic({ conditions: logic.conditions.filter((_, i) => i !== idx) })
  }

  // ─── No logic yet ───────────────────────────────────────────────────────────

  if (!logic) {
    return (
      <div className="text-center py-4 space-y-3">
        <p className="text-sm text-[var(--color-text-secondary)]">
          This field is always visible.
        </p>
        <button
          type="button"
          onClick={enable}
          disabled={allFields.length === 0}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)]',
            'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
            'hover:border-[var(--color-green-500)] hover:bg-[var(--color-green-50)] hover:text-[var(--color-green-600)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-all duration-[var(--duration-fast)]',
          )}
        >
          <Plus size={14} weight="bold" />
          Add conditional logic
        </button>
        {allFields.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Add more fields to the form first.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Action + Match row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[var(--color-text-secondary)]">This field will</span>
        <SelectPill
          value={logic.action}
          options={[{ value: 'show', label: 'show' }, { value: 'hide', label: 'hide' }]}
          onChange={(v) => patchLogic({ action: v as 'show' | 'hide' })}
        />
        <span className="text-sm text-[var(--color-text-secondary)]">when</span>
        <SelectPill
          value={logic.match}
          options={[{ value: 'all', label: 'all' }, { value: 'any', label: 'any' }]}
          onChange={(v) => patchLogic({ match: v as 'all' | 'any' })}
        />
        <span className="text-sm text-[var(--color-text-secondary)]">of these are met:</span>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {logic.conditions.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] italic">No conditions — add one below.</p>
        )}
        {logic.conditions.map((cond, idx) => {
          const targetField = allFields.find((f) => f.id === cond.fieldId)
          const needsValue  = !VALUE_LESS.includes(cond.operator)

          return (
            <div key={idx} className="flex items-center gap-2 flex-wrap">

              {/* Field selector */}
              <select
                value={cond.fieldId}
                onChange={(e) => updateCondition(idx, { fieldId: e.target.value })}
                className={selectCls}
              >
                {allFields.map((f) => (
                  <option key={f.id} value={f.id}>{f.label || `Field ${f.id.slice(0, 6)}`}</option>
                ))}
              </select>

              {/* Operator selector */}
              <select
                value={cond.operator}
                onChange={(e) => updateCondition(idx, { operator: e.target.value as ConditionOperator, value: undefined })}
                className={selectCls}
              >
                {ALL_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Value input (when needed) */}
              {needsValue && (
                targetField?.options?.length ? (
                  <select
                    value={String(cond.value ?? '')}
                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                    className={selectCls}
                  >
                    <option value="">Choose…</option>
                    {targetField.options.map((o) => (
                      <option key={o.id} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={String(cond.value ?? '')}
                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                    placeholder="value"
                    className={cn(selectCls, 'placeholder:text-[var(--color-text-muted)]')}
                  />
                )
              )}

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeCondition(idx)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors shrink-0"
                aria-label="Remove condition"
              >
                <Trash size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add condition */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addCondition}
          disabled={allFields.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-500)] hover:text-[var(--color-green-600)] disabled:opacity-40 transition-colors"
        >
          <Plus size={12} weight="bold" />
          Add condition
        </button>

        <button
          type="button"
          onClick={disable}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
        >
          Remove all logic
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SelectPill({
  value, options, onChange,
}: {
  value:   string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-7 px-2 text-xs font-semibold rounded-[var(--radius-sm)]',
        'border border-[var(--color-green-500)] bg-[var(--color-green-50)] text-[var(--color-green-600)]',
        'focus:outline-none cursor-pointer',
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

const selectCls = cn(
  'h-8 px-2.5 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border)]',
  'bg-white focus:outline-none focus:border-[var(--color-green-500)]',
  'transition-[border-color] duration-[var(--duration-fast)] cursor-pointer',
)
