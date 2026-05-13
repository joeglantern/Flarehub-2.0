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
  Plus,
} from '@phosphor-icons/react'
import type { FieldType } from '@/types/applicationForm'
import { getFieldTypeLabel } from '@/utils/formSchemaHelpers'
import { cn } from '@/lib/utils'

// ─── Icon map ────────────────────────────────────────────────────────────────

const FIELD_ICONS: Record<FieldType, React.ReactNode> = {
  short_text:      <TextT          size={18} weight="duotone" />,
  long_text:       <TextAlignLeft  size={18} weight="duotone" />,
  number:          <Hash           size={18} weight="duotone" />,
  date:            <Calendar       size={18} weight="duotone" />,
  single_choice:   <RadioButton    size={18} weight="duotone" />,
  multiple_choice: <CheckSquare    size={18} weight="duotone" />,
  dropdown:        <CaretDown      size={18} weight="duotone" />,
  file_upload:     <UploadSimple   size={18} weight="duotone" />,
  image_upload:    <Image          size={18} weight="duotone" />,
  video_upload:    <VideoCamera    size={18} weight="duotone" />,
  rating:          <Star           size={18} weight="duotone" />,
  yes_no:          <ToggleLeft     size={18} weight="duotone" />,
  phone:           <Phone          size={18} weight="duotone" />,
  email:           <EnvelopeSimple size={18} weight="duotone" />,
}

// ─── Colour accents per category ─────────────────────────────────────────────

const FIELD_COLORS: Record<FieldType, string> = {
  short_text:      'text-[var(--color-green-500)]  bg-[var(--color-green-50)]',
  long_text:       'text-[var(--color-green-500)]  bg-[var(--color-green-50)]',
  email:           'text-[var(--color-green-500)]  bg-[var(--color-green-50)]',
  phone:           'text-[var(--color-green-500)]  bg-[var(--color-green-50)]',
  number:          'text-[var(--color-info)]        bg-blue-50',
  date:            'text-[var(--color-info)]        bg-blue-50',
  single_choice:   'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]',
  multiple_choice: 'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]',
  dropdown:        'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]',
  yes_no:          'text-[var(--color-terra-500)]  bg-[var(--color-terra-50)]',
  rating:          'text-[var(--color-warning)]    bg-amber-50',
  file_upload:     'text-purple-600               bg-purple-50',
  image_upload:    'text-pink-600                 bg-pink-50',
  video_upload:    'text-rose-600                 bg-rose-50',
}

// ─── Groups ───────────────────────────────────────────────────────────────────

const GROUPS: { label: string; types: FieldType[] }[] = [
  { label: 'Text',    types: ['short_text', 'long_text', 'email', 'phone', 'number'] },
  { label: 'Choice',  types: ['single_choice', 'multiple_choice', 'dropdown', 'yes_no'] },
  { label: 'Media',   types: ['image_upload', 'video_upload', 'file_upload'] },
  { label: 'Special', types: ['date', 'rating'] },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  onAdd: (type: FieldType) => void
}

export function FormBuilderSidebar({ onAdd }: Props) {
  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-y-auto">
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Field types
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          Click to add to selected section
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onAdd(type)}
                  className={cn(
                    'group w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]',
                    'border border-transparent',
                    'hover:border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]',
                    'active:scale-[0.98]',
                    'transition-all duration-[var(--duration-fast)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-green-500)]/30',
                    'cursor-pointer',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] shrink-0',
                      'transition-transform duration-[var(--duration-fast)] group-hover:scale-105',
                      FIELD_COLORS[type],
                    )}
                  >
                    {FIELD_ICONS[type]}
                  </span>
                  <span className="text-sm text-[var(--color-text-primary)] font-medium leading-none">
                    {getFieldTypeLabel(type)}
                  </span>
                  <Plus
                    size={13}
                    weight="bold"
                    className="ml-auto shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
