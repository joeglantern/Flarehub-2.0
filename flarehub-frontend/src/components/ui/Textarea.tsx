import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { WarningCircle, Info } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:     string
  error?:     string
  helper?:    string
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, showCount, className, id, maxLength, value, ...props }, ref) => {
    const inputId   = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="flex flex-col gap-1.5 w-full">

        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold leading-none select-none',
              'text-[var(--color-text-secondary)]',
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

        {/* Textarea wrapper */}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            rows={4}
            maxLength={maxLength}
            value={value}
            className={cn(
              'w-full rounded-[var(--radius-lg)] border text-sm',
              'px-3.5 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'resize-y min-h-[88px] leading-relaxed',

              /* rest */
              'bg-white border-[var(--color-border)]',

              /* hover */
              'hover:border-[var(--color-border-strong)]',

              /* focus */
              'focus:outline-none',
              'focus:border-[var(--color-green-500)]',
              'focus:bg-[#f7fdf9]',
              'focus:shadow-[inset_3px_0_0_var(--color-green-500),_0_0_0_3px_rgba(29,111,66,0.10)]',

              /* transition */
              'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)] ease-out',

              /* disabled */
              'disabled:opacity-50 disabled:cursor-not-allowed',

              /* error */
              error && [
                'border-[var(--color-error)] bg-[#fff8f8]',
                'hover:border-[var(--color-error)]',
                'focus:border-[var(--color-error)] focus:bg-[#fff8f8]',
                'focus:shadow-[inset_3px_0_0_var(--color-error),_0_0_0_3px_rgba(185,28,28,0.10)]',
              ],

              showCount && maxLength && 'pb-7',
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

          {/* Char count */}
          {showCount && maxLength && (
            <span
              className={cn(
                'absolute bottom-2.5 right-3 text-[10px] tabular-nums select-none pointer-events-none font-medium',
                charCount >= maxLength            ? 'text-[var(--color-error)]'
                : charCount >= maxLength * 0.8    ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-muted)]',
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        {/* Error */}
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

        {/* Helper */}
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
Textarea.displayName = 'Textarea'
