import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  illustration?: ReactNode   // SVG component or <img> — shown large above heading
  icon?:         ReactNode   // fallback Phosphor icon (used when no illustration)
  heading:       string
  body:          string
  action?:       { label: string; onClick: () => void }
  className?:    string
}

export function EmptyState({ illustration, icon, heading, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>

      {illustration ? (
        <div className="mb-6 w-48 h-48 flex items-center justify-center select-none">
          {illustration}
        </div>
      ) : icon ? (
        <div className="w-12 h-12 flex items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] mb-5">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5">{heading}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">{body}</p>

      {action && (
        <Button size="sm" variant="secondary" className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
