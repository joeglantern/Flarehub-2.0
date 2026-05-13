import { cn } from '@/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

type Variant = 'default' | 'approved' | 'pending' | 'rejected' | 'review' | 'mentor' | 'admin' | 'super_admin' | 'active' | 'inactive'
type Tone    = 'forest' | 'terra' | 'sun' | 'ink'

const variants: Record<Variant, string> = {
  default:     'bg-[var(--color-elev)] text-[var(--color-ink-mute)]',
  approved:    'bg-[var(--color-forest-50)] text-[var(--color-forest-600)]',
  pending:     'bg-[#fef9ec] text-[var(--color-warning)]',
  rejected:    'bg-[#fef2f2] text-[var(--color-error)]',
  review:      'bg-[#eff6ff] text-[var(--color-info)]',
  mentor:      'bg-[var(--color-terra-50)] text-[var(--color-terra-500)]',
  admin:       'bg-[var(--color-forest-50)] text-[var(--color-forest-700)]',
  super_admin: 'bg-[var(--color-forest-900)] text-white',
  active:      'bg-[var(--color-forest-50)] text-[var(--color-forest-600)]',
  inactive:    'bg-[var(--color-elev)] text-[var(--color-ink-mute)]',
}

const tones: Record<Tone, string> = {
  forest: 'bg-[var(--color-forest-50)] text-[var(--color-forest-700)]',
  terra:  'bg-[var(--color-terra-50)]  text-[var(--color-terra-600)]',
  sun:    'bg-[#fef9ec]                text-[var(--color-warning)]',
  ink:    'bg-[var(--color-ink)]       text-white',
}

export function Badge({
  variant,
  tone,
  dot,
  children,
  className,
}: {
  variant?: Variant
  tone?:    Tone
  dot?:     string
  children: ReactNode
  className?: string
}) {
  const colorClass = tone ? tones[tone] : variants[variant ?? 'default']
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        colorClass,
        className,
      )}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dot } as CSSProperties}
        />
      )}
      {children}
    </span>
  )
}

export function statusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Approved:      'approved',
    approved:      'approved',
    verified:      'approved',
    active:        'active',
    Active:        'active',
    Pending:       'pending',
    pending:       'pending',
    Rejected:      'rejected',
    rejected:      'rejected',
    UnderReview:   'review',
    NeedsRevision: 'pending',
    Submitted:     'review',
    Draft:         'default',
    Inactive:      'inactive',
    inactive:      'inactive',
    mentor:        'mentor',
    admin:         'admin',
    super_admin:   'super_admin',
    entrepreneur:  'default',
  }
  return map[status] ?? 'default'
}
