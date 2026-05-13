import { cn } from '@/lib/utils'
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto w-full">
      <table className={cn('w-full text-sm border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] sticky top-0 z-10', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-[var(--color-border)]', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className, children, onClick, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-[var(--duration-fast)]',
        onClick && 'cursor-pointer hover:bg-[var(--color-bg-elevated)]',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-[var(--color-text-primary)]', className)}
      {...props}
    >
      {children}
    </td>
  )
}
