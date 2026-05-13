import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label:      string
  value:      ReactNode
  sub?:       string
  trend?:     number
  sparkData?: number[]
  color?:     string
  className?: string
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 56, h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function StatCard({ label, value, sub, trend, sparkData, color = 'var(--color-forest-500)', className }: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0
  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</div>
          <div
            className="font-display text-[28px] font-bold leading-none mt-1.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {value}
          </div>
          {sub && <div className="text-[11px] text-[var(--color-ink-mute)] mt-0.5">{sub}</div>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>

      {trend !== undefined && (
        <div className={cn(
          'text-[11px] font-semibold font-mono',
          trendUp ? 'text-[var(--color-forest-600)]' : 'text-[var(--color-terra-500)]',
        )}>
          {trendUp ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  )
}
