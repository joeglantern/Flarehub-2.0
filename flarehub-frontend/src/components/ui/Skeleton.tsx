import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  height?:   string | number
  width?:    string | number
  rounded?:  'sm' | 'md' | 'lg' | 'full'
}

const radii = {
  sm:   'rounded-[var(--radius-sm)]',
  md:   'rounded-[var(--radius-md)]',
  lg:   'rounded-[var(--radius-lg)]',
  full: 'rounded-full',
}

export function Skeleton({ className, height, width, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', radii[rounded], className)}
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[var(--color-bg-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton height={36} width={36} rounded="full" />
        <div className="flex-1">
          <Skeleton height={14} width="40%" className="mb-2" />
          <Skeleton height={12} width="25%" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}
