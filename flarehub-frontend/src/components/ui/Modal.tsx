import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Size = 'sm' | 'md' | 'lg'
const sizes: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title:     string
  description?: string
  size?:     Size
  children:  ReactNode
  footer?:   ReactNode
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full',
            'bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--color-border)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            sizes[size],
          )}
        >
          <div className="flex items-start justify-between p-5 border-b border-[var(--color-border)]">
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
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
