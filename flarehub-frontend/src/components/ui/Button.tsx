import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'terra' | 'dark'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  icon?:      ReactNode
  iconRight?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'bg-[var(--color-forest-500)] text-white hover:bg-[var(--color-forest-600)] active:bg-[var(--color-forest-700)]',
  secondary: 'bg-white text-[var(--color-ink)] border border-[var(--color-line)] hover:bg-[var(--color-elev)] active:bg-[var(--color-inset)]',
  ghost:     'bg-transparent text-[var(--color-ink-mute)] hover:bg-[var(--color-elev)] hover:text-[var(--color-ink)] active:bg-[var(--color-inset)]',
  danger:    'bg-[var(--color-error)] text-white hover:opacity-90 active:opacity-80',
  terra:     'bg-[var(--color-terra-500)] text-white hover:bg-[var(--color-terra-600)] active:opacity-90',
  dark:      'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] active:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-7  px-3   text-xs   gap-1.5 rounded-lg',
  md: 'h-9  px-4   text-sm   gap-2   rounded-xl',
  lg: 'h-11 px-5   text-base gap-2   rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-[var(--duration-fast)] select-none cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-[var(--color-forest-500)] focus-visible:outline-offset-2',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 'xs' : 'sm'} /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  ),
)
Button.displayName = 'Button'
