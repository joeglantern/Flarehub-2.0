import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs    = RadixTabs.Root
export const TabsContent = RadixTabs.Content

export function TabsList({ className, children, ...props }: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        'flex items-center border-b border-[var(--color-border)] gap-0',
        className,
      )}
      {...props}
    >
      {children}
    </RadixTabs.List>
  )
}

export function TabsTrigger({ className, children, ...props }: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] border-b-2 border-transparent -mb-px',
        'hover:text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)]',
        'data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:border-[var(--color-green-500)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-green-500)]/30 rounded-t',
        className,
      )}
      {...props}
    >
      {children}
    </RadixTabs.Trigger>
  )
}
