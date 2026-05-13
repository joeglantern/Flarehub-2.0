import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, Warning, X } from '@phosphor-icons/react'
import { useUiStore, type Toast, type ToastType } from '@/store/ui.store'
import { cn } from '@/lib/utils'

const config: Record<ToastType, { icon: typeof CheckCircle; borderColor: string; iconColor: string }> = {
  success: { icon: CheckCircle, borderColor: 'border-l-[var(--color-success)]',  iconColor: 'text-[var(--color-success)]' },
  error:   { icon: XCircle,     borderColor: 'border-l-[var(--color-error)]',    iconColor: 'text-[var(--color-error)]' },
  info:    { icon: Info,        borderColor: 'border-l-[var(--color-info)]',     iconColor: 'text-[var(--color-info)]' },
  warning: { icon: Warning,     borderColor: 'border-l-[var(--color-warning)]',  iconColor: 'text-[var(--color-warning)]' },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUiStore()
  const { icon: Icon, borderColor, iconColor } = config[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: 8,  scale: 0.96 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 w-80 p-4 rounded-[var(--radius-2xl)] border border-[var(--color-line)] border-l-4',
        'bg-white shadow-[var(--shadow-pop)]',
        borderColor,
      )}
    >
      <Icon size={18} weight="fill" className={cn('shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-[var(--color-ink-mute)] leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useUiStore()
  return (
    <div className="fixed bottom-24 lg:bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
