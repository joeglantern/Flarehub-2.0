import {
  TextT,
  TextAlignLeft,
  Hash,
  Calendar,
  RadioButton,
  CheckSquare,
  CaretDown,
  UploadSimple,
  Image,
  VideoCamera,
  Star,
  ToggleLeft,
  Phone,
  EnvelopeSimple,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowDown,
  GitBranch,
} from '@phosphor-icons/react'
import type { FormField, FieldType } from '@/types/applicationForm'
import { getFieldTypeLabel } from '@/utils/formSchemaHelpers'
import { cn } from '@/lib/utils'

// ─── icon + colour maps (same as sidebar) ────────────────────────────────────

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  short_text:      <TextT          size={14} weight="duotone" />,
  long_text:       <TextAlignLeft  size={14} weight="duotone" />,
  number:          <Hash           size={14} weight="duotone" />,
  date:            <Calendar       size={14} weight="duotone" />,
  single_choice:   <RadioButton    size={14} weight="duotone" />,
  multiple_choice: <CheckSquare    size={14} weight="duotone" />,
  dropdown:        <CaretDown      size={14} weight="duotone" />,
  file_upload:     <UploadSimple   size={14} weight="duotone" />,
  image_upload:    <Image          size={14} weight="duotone" />,
  video_upload:    <VideoCamera    size={14} weight="duotone" />,
  rating:          <Star           size={14} weight="duotone" />,
  yes_no:          <ToggleLeft     size={14} weight="duotone" />,
  phone:           <Phone          size={14} weight="duotone" />,
  email:           <EnvelopeSimple size={14} weight="duotone" />,
}

const FIELD_BADGE: Record<FieldType, string> = {
  short_text:      'text-[var(--color-green-500)]  bg-[var(--color-green-50)]  border-[var(--color-green-100)]',
  long_text:       'text-[var(--color-green-500)]  bg-[var(--color-green-50)]  border-[var(--color-green-100)]',
  email:           'text-[var(--color-green-500)]  bg-[var(--color-green-50)]  border-[var(--color-green-100)]',
  phone:           'text-[var(--color-green-500)]  bg-[var(--color-green-50)]  border-[var(--color-green-100)]',
  number:          'text-[var(--color-info)]        bg-blue-50                  border-blue-100',
  date:            'text-[var(--color-info)]        bg-blue-50                  border-blue-100',
  single_choice:   'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]  border-[var(--color-terra-100)]',
  multiple_choice: 'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]  border-[var(--color-terra-100)]',
  dropdown:        'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]  border-[var(--color-terra-100)]',
  yes_no:          'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]  border-[var(--color-terra-100)]',
  rating:          'text-[var(--color-warning)]    bg-amber-50                 border-amber-100',
  file_upload:     'text-purple-600               bg-purple-50                border-purple-100',
  image_upload:    'text-pink-600                 bg-pink-50                  border-pink-100',
  video_upload:    'text-rose-600                 bg-rose-50                  border-rose-100',
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  field:      FormField
  isSelected: boolean
  isFirst:    boolean
  isLast:     boolean
  onSelect:   () => void
  onDelete:   () => void
  onMoveUp:   () => void
  onMoveDown: () => void
}

export function FormBuilderFieldCard({
  field, isSelected, isFirst, isLast,
  onSelect, onDelete, onMoveUp, onMoveDown,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
        'border bg-white cursor-pointer',
        'transition-all duration-[var(--duration-fast)]',
        isSelected
          ? 'border-[var(--color-green-500)] shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.08)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]',
      )}
    >
      {/* type badge */}
      <span
        className={cn(
          'flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-[var(--radius-sm)] border text-xs font-medium',
          FIELD_BADGE[field.type],
        )}
      >
        {FIELD_ICONS[field.type]}
        <span className="hidden sm:inline">{getFieldTypeLabel(field.type)}</span>
      </span>

      {/* label */}
      <span className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate block">
          {field.label || <em className="text-[var(--color-text-muted)] not-italic">Untitled field</em>}
        </span>
        {field.description && (
          <span className="text-xs text-[var(--color-text-muted)] truncate block">{field.description}</span>
        )}
      </span>

      {/* indicators */}
      <div className="flex items-center gap-1.5 shrink-0">
        {field.required && (
          <span
            title="Required"
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0"
          />
        )}
        {field.conditionalLogic && field.conditionalLogic.conditions.length > 0 && (
          <span title="Has conditional logic">
            <GitBranch
              size={12}
              weight="regular"
              className="text-[var(--color-text-muted)]"
            />
          </span>
        )}
      </div>

      {/* action buttons — appear on hover/selected */}
      <div
        className={cn(
          'flex items-center gap-0.5 shrink-0',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]',
          isSelected && 'opacity-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ActionBtn onClick={onMoveUp}   disabled={isFirst}  title="Move up"   icon={<ArrowUp   size={13} />} />
        <ActionBtn onClick={onMoveDown} disabled={isLast}   title="Move down" icon={<ArrowDown  size={13} />} />
        <ActionBtn onClick={onSelect}   title="Edit field"  icon={<PencilSimple size={13} />} />
        <ActionBtn
          onClick={onDelete}
          title="Delete field"
          className="hover:text-[var(--color-error)] hover:bg-red-50"
          icon={<Trash size={13} />}
        />
      </div>
    </div>
  )
}

// ─── tiny action button ───────────────────────────────────────────────────────

function ActionBtn({
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
        'p-1 rounded-[var(--radius-sm)]',
        'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]',
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
