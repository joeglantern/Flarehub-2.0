import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

interface ProgressProps {
  value:      number
  max?:       number
  label?:     string
  showValue?: boolean
  size?:      'sm' | 'md'
  color?:     string
  track?:     string
  height?:    number
  className?: string
}

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color,
  track,
  height,
  className,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  const barColor  = color ?? 'var(--color-forest-500)'
  const trackColor = track ?? 'var(--color-elev)'
  const h = height ? `${height}px` : size === 'sm' ? '6px' : '8px'

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label     && <span className="text-xs text-[var(--color-ink-mute)]">{label}</span>}
          {showValue && <span className="text-xs font-medium text-[var(--color-ink)]">{pct}%</span>}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: h, background: trackColor } as CSSProperties}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: barColor } as CSSProperties}
        />
      </div>
    </div>
  )
}
