import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check, Minus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CheckboxProps {
  checked?:         boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
  label?:           ReactNode
  description?:     string
  disabled?:        boolean
  id?:              string
  className?:       string
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
  className,
}: CheckboxProps) {
  const inputId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <RadixCheckbox.Root
        id={inputId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          /* size + shape — slightly more rounded for personality */
          'w-[18px] h-[18px] shrink-0 rounded-[6px] border',
          'flex items-center justify-center mt-px',

          /* rest */
          'bg-white border-[var(--color-border)]',

          /* hover */
          'hover:border-[var(--color-border-strong)]',

          /* checked */
          'data-[state=checked]:bg-[var(--color-green-500)]',
          'data-[state=checked]:border-[var(--color-green-500)]',
          'data-[state=checked]:shadow-[0_0_0_2px_rgba(29,111,66,0.15)]',

          /* indeterminate */
          'data-[state=indeterminate]:bg-[var(--color-green-500)]',
          'data-[state=indeterminate]:border-[var(--color-green-500)]',

          /* focus */
          'focus-visible:outline-none',
          'focus-visible:shadow-[0_0_0_3px_rgba(29,111,66,0.20)]',

          /* transition */
          'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)] ease-out',

          /* disabled */
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <RadixCheckbox.Indicator forceMount>
          <span
            className={cn(
              'flex items-center justify-center',
              'transition-[transform,opacity] duration-[var(--duration-default)] ease-out',
              checked === false || checked === undefined
                ? 'scale-50 opacity-0'
                : 'scale-100 opacity-100',
            )}
          >
            {checked === 'indeterminate'
              ? <Minus size={11} weight="bold" className="text-white" />
              : <Check size={11} weight="bold" className="text-white" />}
          </span>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm text-[var(--color-text-primary)] cursor-pointer select-none leading-[18px]',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn(
              'text-xs text-[var(--color-text-muted)] leading-snug',
              disabled && 'opacity-40',
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
