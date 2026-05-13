import {
  type InputHTMLAttributes,
  forwardRef,
  type ReactNode,
  useState,
} from 'react'
import { WarningCircle, Info, Eye, EyeSlash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  error?:     string
  helper?:    string
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helper, leftIcon, rightIcon, className, id, type, fullWidth = true, ...props },
    ref,
  ) => {
    const inputId    = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const [show, setShow] = useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword ? (show ? 'text' : 'password') : type

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>

        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold leading-none select-none',
              'text-[var(--color-text-secondary)]',
              /* activates when sibling input is focused — via parent group */
              'peer-focus:text-[var(--color-green-600)]',
              error && 'text-[var(--color-error)]',
            )}
          >
            {props.required && (
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0"
              />
            )}
            {label}
          </label>
        )}

        {/* Field wrapper — group drives icon + focus coordination */}
        <div className="group relative">

          {/* Left icon */}
          {leftIcon && (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10',
                'text-[var(--color-text-muted)]',
                'group-focus-within:text-[var(--color-green-500)]',
                'transition-colors duration-[var(--duration-default)]',
                error && 'text-[var(--color-error)]',
              )}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            /* peer class lets sibling label react to focus */
            className={cn(
              'peer h-10 rounded-[var(--radius-lg)] border text-sm',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              fullWidth && 'w-full',

              /* ── rest ───────────────────────────────────────────── */
              'bg-white border-[var(--color-border)]',

              /* ── hover ──────────────────────────────────────────── */
              'hover:border-[var(--color-border-strong)]',

              /* ── focus — left accent bar + outer glow ───────────── */
              'focus:outline-none',
              'focus:border-[var(--color-green-500)]',
              'focus:bg-[#f7fdf9]',
              'focus:shadow-[inset_3px_0_0_var(--color-green-500),_0_0_0_3px_rgba(29,111,66,0.10)]',

              /* ── transition ─────────────────────────────────────── */
              'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)] ease-out',

              /* ── disabled ───────────────────────────────────────── */
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:hover:border-[var(--color-border)]',

              /* ── error ──────────────────────────────────────────── */
              error && [
                'border-[var(--color-error)] bg-[#fff8f8]',
                'hover:border-[var(--color-error)]',
                'focus:border-[var(--color-error)] focus:bg-[#fff8f8]',
                'focus:shadow-[inset_3px_0_0_var(--color-error),_0_0_0_3px_rgba(185,28,28,0.10)]',
              ],

              /* ── icon padding ───────────────────────────────────── */
              leftIcon             ? 'pl-9'  : 'px-3.5',
              (rightIcon || isPassword) ? 'pr-9' : '',

              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error   ? `${inputId}-error`
              : helper ? `${inputId}-helper`
              : undefined
            }
            {...props}
          />

          {/* Right: password toggle OR custom rightIcon */}
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow(v => !v)}
              className={cn(
                'absolute right-3.5 top-1/2 -translate-y-1/2',
                'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                'transition-colors duration-[var(--duration-fast)]',
                'focus:outline-none',
              )}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show
                ? <EyeSlash size={15} weight="regular" />
                : <Eye      size={15} weight="regular" />}
            </button>
          ) : rightIcon ? (
            <span
              aria-hidden
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              {rightIcon}
            </span>
          ) : null}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-error)] leading-snug"
          >
            <WarningCircle size={13} weight="fill" className="shrink-0" />
            {error}
          </p>
        )}

        {/* Helper message */}
        {!error && helper && (
          <p
            id={`${inputId}-helper`}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] leading-snug"
          >
            <Info size={13} weight="regular" className="shrink-0" />
            {helper}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
