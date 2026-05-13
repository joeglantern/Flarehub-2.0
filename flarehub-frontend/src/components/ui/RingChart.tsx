import type { ReactNode } from 'react'

interface RingChartProps {
  value:     number
  size?:     number
  stroke?:   number
  color?:    string
  track?:    string
  label?:    ReactNode
  sublabel?: ReactNode
}

export function RingChart({
  value,
  size    = 100,
  stroke  = 10,
  color   = 'var(--color-forest-500)',
  track   = 'var(--color-elev)',
  label,
  sublabel,
}: RingChartProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        {label && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.2 }}>
              {label}
            </div>
            {sublabel && (
              <div className="text-[var(--color-ink-mute)]" style={{ fontSize: size * 0.1 }}>
                {sublabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
