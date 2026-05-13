import { cn } from '@/lib/utils'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-6 h-6 border-2',
}

export function Spinner({ size = 'md', className }: { size?: Size; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-current border-r-transparent animate-spin',
        sizes[size],
        className,
      )}
      aria-label="Loading"
    />
  )
}
