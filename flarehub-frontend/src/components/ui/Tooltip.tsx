import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TooltipProps {
  content:  string
  children: ReactNode
  side?:    'top' | 'right' | 'bottom' | 'left'
  delay?:   number
}

export function Tooltip({ content, children, side = 'top', delay = 400 }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium rounded-[var(--radius-md)]',
              'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)]',
              'shadow-[var(--shadow-md)] z-50',
              'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
              'data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=delayed-open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-[var(--color-text-primary)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
