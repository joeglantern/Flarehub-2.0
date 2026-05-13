import { cn } from '@/lib/utils'

interface BarItem {
  label: string
  value: number
  color?: string
}

interface HorizBarListProps {
  data:       BarItem[]
  unit?:      string
  max?:       number
  className?: string
}

export function HorizBarList({ data, unit = '', max, className }: HorizBarListProps) {
  const maxVal = max ?? Math.max(...data.map(d => d.value), 1)
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, i) => {
        const pct   = Math.max(2, Math.round((item.value / maxVal) * 100))
        const color = item.color ?? 'var(--color-forest-500)'
        return (
          <div key={i} className="flex items-center gap-3 group">
            <span className="text-[12px] text-[var(--color-ink-mute)] w-[90px] truncate shrink-0 font-medium">
              {item.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--color-elev)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="text-[12px] font-mono font-semibold text-[var(--color-ink)] w-8 text-right shrink-0">
              {item.value}{unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface DonutRingProps {
  items: { label: string; value: number; color: string }[]
}

export function DonutRingGroup({ items }: DonutRingProps) {
  const total = items.reduce((n, d) => n + d.value, 0) || 1
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const pct = Math.round((item.value / total) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-[12px] text-[var(--color-ink-mute)] flex-1 font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-[var(--color-elev)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: item.color }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-ink-mute)] w-8 text-right">
                {pct}%
              </span>
            </div>
          </div>
        )
      })}
      <div className="pt-2 border-t border-[var(--color-line)]">
        <span className="text-[11px] font-mono text-[var(--color-ink-faint)]">Total: {total}</span>
      </div>
    </div>
  )
}
