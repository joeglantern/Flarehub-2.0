import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface DrawerProps {
  open:     boolean
  onClose:  () => void
  title:    string
  description?: string
  width?:   string
  children: ReactNode
  footer?:  ReactNode
}

export function Drawer({ open, onClose, title, description, width = 'max-w-xl', children, footer }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40" />
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 bottom-0 z-50 w-full flex flex-col',
            'bg-[var(--color-bg-surface)] shadow-[var(--shadow-lg)] border-l border-[var(--color-border)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            'duration-200',
            width,
          )}
        >
          <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)] shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                className="ml-4 p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {footer && (
            <div className="shrink-0 flex items-center justify-end gap-2 p-5 border-t border-[var(--color-border)]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
