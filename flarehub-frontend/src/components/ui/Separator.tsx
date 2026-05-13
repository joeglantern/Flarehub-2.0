import * as RadixSeparator from '@radix-ui/react-separator'
import { cn } from '@/lib/utils'

export function Separator({ orientation = 'horizontal', className }: {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  return (
    <RadixSeparator.Root
      orientation={orientation}
      className={cn(
        'bg-[var(--color-border)] shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className,
      )}
    />
  )
}
