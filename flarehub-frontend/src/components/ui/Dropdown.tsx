import * as RadixDropdown from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export const DropdownRoot    = RadixDropdown.Root
export const DropdownTrigger = RadixDropdown.Trigger

export function DropdownContent({ className, children, align = 'end', ...props }: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-[180px] rounded-[var(--radius-lg)] border border-[var(--color-border)]',
          'bg-[var(--color-bg-surface)] shadow-[var(--shadow-lg)] p-1',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  )
}

interface DropdownItemProps extends RadixDropdown.DropdownMenuItemProps {
  icon?:      ReactNode
  danger?:    boolean
}

export function DropdownItem({ icon, danger, className, children, ...props }: DropdownItemProps) {
  return (
    <RadixDropdown.Item
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-[var(--radius-md)] cursor-pointer select-none outline-none',
        'transition-colors duration-[var(--duration-fast)]',
        danger
          ? 'text-[var(--color-error)] hover:bg-[#fef2f2] focus:bg-[#fef2f2]'
          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] focus:bg-[var(--color-bg-elevated)]',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </RadixDropdown.Item>
  )
}

export function DropdownSeparator() {
  return <RadixDropdown.Separator className="my-1 h-px bg-[var(--color-border)]" />
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <RadixDropdown.Label className="px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
      {children}
    </RadixDropdown.Label>
  )
}
