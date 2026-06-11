import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  House, Binoculars, FileText, Target, Plus, ArrowRight, MagnifyingGlass,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { icon: House,     label: 'Go to Overview',       to: '/dashboard' },
  { icon: Binoculars,label: 'Browse programs',       to: '/programs' },
  { icon: FileText,  label: 'My applications',       to: '/applications' },
  { icon: Target,    label: 'Edit Smart Goals',      to: '/submissions/smart-goals' },
  { icon: Plus,      label: 'Apply to new program',  to: '/programs' },
]

interface Props {
  open:    boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleNav = (to: string) => {
    navigate(to)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-[var(--color-ink)]/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn('card w-[min(560px,92vw)] p-2 animate-rise')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-line)]">
          <MagnifyingGlass size={16} className="text-[var(--color-ink-mute)]" />
          <input
            ref={inputRef}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] outline-none"
          />
          <span className="font-mono text-[10px] text-[var(--color-ink-mute)]">esc</span>
        </div>

        {/* Actions */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[var(--color-ink-faint)] tracking-wider">
            Quick actions
          </div>
          {ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-elev)] text-left transition"
              >
                <span className="w-8 h-8 rounded-lg bg-[var(--color-elev)] flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[var(--color-ink-mute)]" />
                </span>
                <span className="flex-1 text-[13px] font-medium text-[var(--color-ink)]">{item.label}</span>
                <ArrowRight size={14} className="text-[var(--color-ink-mute)]" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
