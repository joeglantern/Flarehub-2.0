import type { ReactNode } from 'react'
import { Flame } from '@phosphor-icons/react'
import heroImage from '@/assets/auth-hero.jpg'

interface Props {
  children: ReactNode
}

export function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — image ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] relative overflow-hidden">
        {/* Photo */}
        <img
          src={heroImage}
          alt="Entrepreneurs collaborating"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Dark gradient overlay — bottom half for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        {/* Branding overlay */}
        <div className="relative z-10 flex flex-col justify-between w-full p-10">
          {/* Logo top-left */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/15 backdrop-blur-sm border border-white/20 rounded-[var(--radius-md)] flex items-center justify-center">
              <Flame size={17} weight="fill" className="text-white" />
            </div>
            <span className="text-white text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Flarehub
            </span>
          </div>

          {/* Quote bottom-left */}
          <div className="space-y-3">
            <blockquote className="text-white/90 text-2xl font-semibold leading-snug max-w-sm" style={{ fontFamily: 'var(--font-display)' }}>
              "Where bold ideas<br />find their footing."
            </blockquote>
            <p className="text-white/55 text-sm">
              A platform built for Africa's next generation of entrepreneurs.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg-base)] overflow-y-auto">

        {/* Mobile logo (hidden on desktop — shown on image panel instead) */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={18} weight="fill" className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Flarehub
          </span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

    </div>
  )
}
