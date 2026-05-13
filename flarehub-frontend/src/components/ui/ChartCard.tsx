import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ChartCardProps {
  title:     string
  subtitle?: string
  trailing?: ReactNode
  children:  ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, trailing, children, className }: ChartCardProps) {
  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          {subtitle && (
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-0.5">
              {subtitle}
            </p>
          )}
          <p className="text-[16px] font-semibold text-[var(--color-ink)] leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </p>
        </div>
        {trailing && <div className="shrink-0 mt-0.5">{trailing}</div>}
      </div>
      <div className="px-1 pb-5">
        {children}
      </div>
    </div>
  )
}

/** Shared Nivo theme */
export const nivoTheme = {
  background:  'transparent',
  fontSize:    11,
  textColor:   '#a39e98',
  axis: {
    domain: { line: { stroke: 'transparent' } },
    ticks:  {
      line: { stroke: 'transparent' },
      text: { fontSize: 11, fill: '#a39e98' },
    },
    legend: { text: { fontSize: 12, fill: '#6b6560', fontWeight: 500 } },
  },
  grid:    { line: { stroke: '#f0ede8', strokeWidth: 1 } },
  legends: { text: { fontSize: 11, fill: '#6b6560' } },
  tooltip: {
    container: {
      background:   '#ffffff',
      border:       '1px solid #e2ddd7',
      borderRadius: 10,
      boxShadow:    '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      fontSize:     12,
      padding:      '8px 12px',
      color:        '#1a1916',
    },
  },
}

/** Chart color palette */
export const chartColors = {
  green:  '#1d6f42',
  terra:  '#c4522a',
  amber:  '#b5720e',
  slate:  '#64748b',
  purple: '#7c3aed',
  teal:   '#0d9488',
  soft:   '#e8e4de',
  greenFill: 'rgba(29,111,66,0.10)',
}

/** Warm multi-series palette */
export const seriesPalette = [
  '#1d6f42', '#c4522a', '#b5720e', '#64748b', '#7c3aed', '#0d9488',
]

/** Legend dot */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}
