import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  limit:      number
  onChange:   (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, total, limit, onChange, className }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end   = Math.min(page * limit, total)

  if (totalPages <= 1) return null

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<CaretLeft size={14} />}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        />
        <span className="text-sm text-[var(--color-text-secondary)] px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={<CaretRight size={14} />}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        />
      </div>
    </div>
  )
}
