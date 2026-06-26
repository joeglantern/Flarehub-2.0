import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

export function Squiggle({ color = '#c4522a', thickness = 3 }: { color?: string; thickness?: number }) {
  return (
    <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 10 C 14 2, 26 16, 40 9 S 66 2, 82 11 S 112 3, 130 10 S 162 17, 180 8 S 196 3, 198 10"
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TornEdge({ flip = false, fill = 'var(--elevated)' }: { flip?: boolean; fill?: string }) {
  const d = 'M0,20 C40,6 80,30 120,16 S200,4 240,22 S320,6 360,18 S440,32 480,14 S560,26 600,10 S680,30 720,16 S800,4 840,22 S920,8 960,20 S1040,32 1080,12 S1160,28 1200,18 L1200,40 L0,40 Z'
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height: 36, transform: flip ? 'scaleY(-1)' : 'none' }}
    >
      <path d={d} fill={fill} />
    </svg>
  )
}

export function FlareMark({ size = 18, bg = 'var(--ink)', accent = 'var(--t500)' }: { size?: number; bg?: string; accent?: string }) {
  const box = Math.round(size * 1.9)
  const radius = Math.round(box * 0.38)
  const dot = Math.round(size * 0.42)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: box, height: box, borderRadius: radius, background: bg, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      <svg viewBox="0 0 256 256" width={size} height={size} aria-hidden="true">
        <path d="M173.79,51.48a221.25,221.25,0,0,0-41.67-34.34,8,8,0,0,0-8.24,0A221.25,221.25,0,0,0,82.21,51.48C54.59,80.48,40,112.47,40,144a88,88,0,0,0,176,0C216,112.47,201.41,80.48,173.79,51.48ZM96,184c0-27.67,22.53-47.28,32-54.3,9.48,7,32,26.63,32,54.3a32,32,0,0,1-64,0Z" fill="white" />
      </svg>
      <span style={{ position: 'absolute', top: -2, right: -2, width: dot, height: dot, borderRadius: '50%', background: accent, border: '2px solid var(--base, #f7f6f3)' }} />
    </span>
  )
}

export function MarkerPortrait({ seed = 1, rotate = -3, w = 320, h = 380 }: { seed?: number; rotate?: number; w?: number; h?: number }) {
  const r = (i: number) => {
    const x = Math.sin(seed * 999 + i * 37) * 10000
    return x - Math.floor(x)
  }
  const skin = ['#8c5a3d', '#6e4026', '#a5754f', '#704229'][seed % 4]
  const shirt = ['#1d6f42', '#c4522a', '#12472b', '#1a1916'][seed % 4]
  const bg = ['#d0ecdb', '#f9ddd1', '#e8e4de', '#f0ede8'][seed % 4]
  return (
    <svg
      viewBox="0 0 320 380"
      width={w}
      height={h}
      style={{ transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(4px 8px 0 rgba(26,25,22,0.12))' }}
    >
      <defs>
        <filter id={`rough-${seed}`}>
          <feTurbulence baseFrequency="0.04" numOctaves="2" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
        <pattern id={`hatch-${seed}`} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(26,25,22,0.15)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="10" y="10" width="300" height="360" rx="6" fill={bg} filter={`url(#rough-${seed})`} />
      <rect x="10" y="10" width="300" height="360" rx="6" fill={`url(#hatch-${seed})`} opacity="0.5" />
      <path
        d={`M${40 + r(1) * 10} 380 C 60 260, 120 240, 160 240 S 260 260, ${280 - r(2) * 10} 380 Z`}
        fill={shirt}
        filter={`url(#rough-${seed})`}
      />
      <rect x="145" y="210" width="30" height="40" fill={skin} filter={`url(#rough-${seed})`} />
      <ellipse cx="160" cy="170" rx="62" ry="72" fill={skin} filter={`url(#rough-${seed})`} />
      <path
        d="M98 150 C 96 90, 150 80, 160 82 C 176 80, 226 92, 222 155 C 210 120, 180 118, 160 120 C 140 118, 116 122, 98 150 Z"
        fill="#1a1916"
        filter={`url(#rough-${seed})`}
      />
      <ellipse cx="140" cy="170" rx="4" ry="5" fill="#1a1916" />
      <ellipse cx="180" cy="170" rx="4" ry="5" fill="#1a1916" />
      <path d="M140 195 Q 160 210 180 195" stroke="#1a1916" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="160" cy="170" rx="62" ry="72" fill="none" stroke="#1a1916" strokeWidth="2" filter={`url(#rough-${seed})`} />
    </svg>
  )
}

export function SketchIcon({ name, size = 36, color = 'var(--ink)' }: { name: string; size?: number; color?: string }) {
  const common = { width: size, height: size, viewBox: '0 0 40 40', fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'pencil':
      return <svg {...common}><path d="M7 31 L9 24 L26 7 L33 14 L16 31 Z"/><path d="M24 9 L31 16"/><path d="M6 33 L13 32"/></svg>
    case 'handshake':
      return <svg {...common}><path d="M4 22 L10 16 L15 19 L21 14 L28 18 L36 14"/><path d="M10 16 L14 24 L21 22 L28 27"/><path d="M28 18 L32 23"/></svg>
    case 'rocket':
      return <svg {...common}><path d="M14 28 C 10 24, 10 16, 20 6 C 30 16, 30 24, 26 28 Z"/><circle cx="20" cy="16" r="3"/><path d="M14 28 L10 32 M26 28 L30 32 M18 30 L16 36 M22 30 L24 36"/></svg>
    default:
      return <svg {...common}><circle cx="20" cy="20" r="10"/></svg>
  }
}

export function Reveal({
  children,
  delay = 0,
  className = '',
  style = {},
}: {
  children: ReactNode
  delay?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setShown(true), delay)
          io.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function CountUp({ to, duration = 1400, prefix = '', suffix = '' }: { to: number; duration?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const startedRef = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const start = performance.now()
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.floor(eased * to))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

export function LottieIcon({ src, size = 56, loop = true, autoplay = true, style }: {
  src: string; size?: number; loop?: boolean; autoplay?: boolean; style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''
    const player = document.createElement('lottie-player')
    player.setAttribute('src', src)
    player.setAttribute('background', 'transparent')
    player.setAttribute('speed', '1')
    player.style.width = `${size}px`
    player.style.height = `${size}px`
    if (loop) player.setAttribute('loop', '')
    if (autoplay) player.setAttribute('autoplay', '')
    el.appendChild(player)
  }, [src, size, loop, autoplay])
  return <div ref={ref} style={{ width: size, height: size, ...style }} />
}

export function LottieOnView({ src, size = 200, style }: {
  src: string; size?: number; style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player: any = document.createElement('lottie-player')
    player.setAttribute('src', src)
    player.setAttribute('background', 'transparent')
    player.setAttribute('speed', '1')
    player.style.width = `${size}px`
    player.style.height = `${size}px`
    el.appendChild(player)
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => player.play?.(), 350)
        io.disconnect()
      }
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [src, size])
  return <div ref={ref} style={{ width: size, height: size, ...style }} />
}
