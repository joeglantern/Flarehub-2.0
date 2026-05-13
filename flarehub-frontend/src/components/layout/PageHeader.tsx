import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title:      string
  subtitle?:  string
  eyebrow?:   string
  actions?:   ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-6', className)}>
      <div>
        {eyebrow && (
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-0.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[34px] font-bold leading-[1.05] text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] text-[var(--color-ink-mute)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
