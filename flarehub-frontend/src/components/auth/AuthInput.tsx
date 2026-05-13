import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label:   string
  error?:  string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const [show, setShow] = useState(false)
    const isPassword      = type === 'password'
    const resolvedType    = isPassword ? (show ? 'text' : 'password') : type

    return (
      <div className="group space-y-0">
        {/* Label */}
        <label
          htmlFor={inputId}
          className={cn(
            'block text-[11px] font-bold uppercase tracking-widest mb-2',
            'transition-colors duration-[var(--duration-default)]',
            error
              ? 'text-[var(--color-error)]'
              : 'text-[var(--color-text-muted)] group-focus-within:text-[var(--color-green-500)]',
          )}
        >
          {label}
        </label>

        {/* Input row */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={cn(
              // Reset all browser defaults
              'w-full bg-transparent appearance-none',
              'outline-none focus:outline-none ring-0 focus:ring-0',
              // Typography
              'text-base text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-muted)] placeholder:text-sm',
              // Spacing
              'pb-3 pr-10',
              // Only bottom border — no box
              'border-0 border-b-2',
              'transition-[border-color] duration-[var(--duration-default)]',
              // States
              error
                ? 'border-[var(--color-error)]'
                : 'border-[var(--color-border-strong)] focus:border-[var(--color-green-500)]',
              // Autofill — kill Chrome's blue box
              '[&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset]',
              '[&:-webkit-autofill]:[-webkit-text-fill-color:var(--color-text-primary)]',
              '[&:-webkit-autofill]:transition-[background-color_9999s]',
              'auth-input',
              className,
            )}
            style={{ boxShadow: 'none', WebkitAppearance: 'none', outline: 'none' }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow((v) => !v)}
              className="absolute right-0 bottom-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show
                ? <EyeSlash size={16} weight="regular" />
                : <Eye      size={16} weight="regular" />}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[var(--color-error)]"
          >
            <WarningCircle size={12} weight="fill" className="shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  },
)
AuthInput.displayName = 'AuthInput'
