import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FilterBarProps {
  children:   ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
    </div>
  )
}

interface FilterChipProps {
  label:     string
  active:    boolean
  onClick:   () => void
  className?: string
}

export function FilterChip({ label, active, onClick, className }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-3 text-xs font-medium rounded-[var(--radius-full)] border transition-colors duration-[var(--duration-fast)]',
        active
          ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
        className,
      )}
    >
      {label}
    </button>
  )
}
