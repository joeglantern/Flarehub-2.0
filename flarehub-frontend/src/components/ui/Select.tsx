import * as RadixSelect from '@radix-ui/react-select'
import { CaretDown, CaretUp, Check, WarningCircle, Info } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface SelectOption {
  value:     string
  label:     string
  icon?:     ReactNode
  disabled?: boolean
}

export interface SelectGroupOption {
  group:   string
  options: SelectOption[]
}

function isGroup(o: SelectOption | SelectGroupOption): o is SelectGroupOption {
  return 'group' in o
}

/* ─── Radix Select ───────────────────────────────────────────────────────── */

interface SelectProps {
  value?:         string
  onValueChange?: (value: string) => void
  options:        (SelectOption | SelectGroupOption)[]
  placeholder?:   string
  label?:         string
  error?:         string
  helper?:        string
  disabled?:      boolean
  required?:      boolean
  className?:     string
  id?:            string
  fullWidth?:     boolean
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  label,
  error,
  helper,
  disabled,
  required,
  className,
  id,
  fullWidth = true,
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>

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
          {required && (
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] shrink-0"
            />
          )}
          {label}
        </label>
      )}

      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'group flex items-center justify-between gap-2',
            'h-10 px-3.5 rounded-[var(--radius-lg)] border text-sm',
            fullWidth && 'w-full',

            /* rest */
            'bg-white border-[var(--color-border)] text-[var(--color-text-primary)]',

            /* hover */
            'hover:border-[var(--color-border-strong)]',

            /* open state */
            'data-[state=open]:border-[var(--color-green-500)]',
            'data-[state=open]:bg-[#f7fdf9]',
            'data-[state=open]:shadow-[inset_3px_0_0_var(--color-green-500),_0_0_0_3px_rgba(29,111,66,0.10)]',

            /* focus ring */
            'focus:outline-none focus:border-[var(--color-green-500)]',
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
              'data-[state=open]:border-[var(--color-error)] data-[state=open]:bg-[#fff8f8]',
              'data-[state=open]:shadow-[inset_3px_0_0_var(--color-error),_0_0_0_3px_rgba(185,28,28,0.10)]',
            ],
          )}
        >
          <RadixSelect.Value
            placeholder={
              <span className="text-[var(--color-text-muted)]">{placeholder}</span>
            }
          />
          <RadixSelect.Icon asChild>
            <CaretDown
              size={14}
              weight="bold"
              className={cn(
                'shrink-0 text-[var(--color-text-muted)]',
                'transition-transform duration-[var(--duration-default)]',
                'group-data-[state=open]:rotate-180',
                error && 'text-[var(--color-error)]',
              )}
            />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className={cn(
              'z-50 overflow-hidden',
              fullWidth
                ? 'w-[var(--radix-select-trigger-width)]'
                : 'min-w-[var(--radix-select-trigger-width)]',
              /* shape */
              'bg-white rounded-[var(--radius-lg)]',
              'border border-[var(--color-border)] shadow-[var(--shadow-lg)]',
              /* animation */
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
            )}
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-7 text-[var(--color-text-muted)] cursor-default bg-white border-b border-[var(--color-border)]">
              <CaretUp size={12} weight="bold" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1.5 max-h-[260px]">
              {options.map((item, i) =>
                isGroup(item) ? (
                  <RadixSelect.Group key={i}>
                    <RadixSelect.Label className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                      {item.group}
                    </RadixSelect.Label>
                    {item.options.map(opt => (
                      <SelectItemRow key={opt.value} option={opt} />
                    ))}
                    {i < options.length - 1 && (
                      <RadixSelect.Separator className="my-1.5 h-px bg-[var(--color-border)]" />
                    )}
                  </RadixSelect.Group>
                ) : (
                  <SelectItemRow key={(item as SelectOption).value} option={item as SelectOption} />
                ),
              )}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center h-7 text-[var(--color-text-muted)] cursor-default bg-white border-t border-[var(--color-border)]">
              <CaretDown size={12} weight="bold" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {/* Error */}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-error)] leading-snug">
          <WarningCircle size={13} weight="fill" className="shrink-0" />
          {error}
        </p>
      )}

      {/* Helper */}
      {!error && helper && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] leading-snug">
          <Info size={13} weight="regular" className="shrink-0" />
          {helper}
        </p>
      )}
    </div>
  )
}

function SelectItemRow({ option }: { option: SelectOption }) {
  return (
    <RadixSelect.Item
      value={option.value}
      disabled={option.disabled}
      className={cn(
        'relative flex items-center gap-2 rounded-[var(--radius-md)] cursor-pointer select-none outline-none',
        'px-3 py-2 pr-8 text-sm text-[var(--color-text-primary)]',
        'transition-colors duration-[var(--duration-fast)]',
        /* highlighted row — left accent appears */
        'data-[highlighted]:bg-[var(--color-green-50)] data-[highlighted]:text-[var(--color-green-700)]',
        'data-[highlighted]:shadow-[inset_2px_0_0_var(--color-green-500)]',
        /* selected */
        'data-[state=checked]:font-medium data-[state=checked]:text-[var(--color-green-700)]',
        /* disabled */
        'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
      )}
    >
      {option.icon && (
        <span className="shrink-0 text-[var(--color-text-muted)]">{option.icon}</span>
      )}
      <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2.5">
        <Check size={13} weight="bold" className="text-[var(--color-green-500)]" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  )
}

/* ─── NativeSelect ───────────────────────────────────────────────────────── */

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  error?:   string
  helper?:  string
  options?: (SelectOption | SelectGroupOption)[]
}

function isGroupNative(o: SelectOption | SelectGroupOption): o is SelectGroupOption {
  return 'group' in o
}

export function NativeSelect({
  label,
  error,
  helper,
  options = [],
  className,
  id,
  children,
  ...props
}: NativeSelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold leading-none select-none',
            'text-[var(--color-text-secondary)]',
            error && 'text-[var(--color-error)]',
          )}
        >
          {label}
        </label>
      )}

      {/* Wrapper for custom caret */}
      <div className="relative group">
        <select
          id={inputId}
          className={cn(
            'appearance-none w-full h-10 pl-3.5 pr-9 rounded-[var(--radius-lg)] border text-sm',
            'bg-white border-[var(--color-border)] text-[var(--color-text-primary)]',
            'hover:border-[var(--color-border-strong)]',
            'focus:outline-none focus:border-[var(--color-green-500)]',
            'focus:bg-[#f7fdf9]',
            'focus:shadow-[inset_3px_0_0_var(--color-green-500),_0_0_0_3px_rgba(29,111,66,0.10)]',
            'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)] ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && [
              'border-[var(--color-error)] bg-[#fff8f8]',
              'focus:border-[var(--color-error)]',
              'focus:shadow-[inset_3px_0_0_var(--color-error),_0_0_0_3px_rgba(185,28,28,0.10)]',
            ],
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children ??
            options.map((o, i) =>
              isGroupNative(o) ? (
                <optgroup key={i} label={o.group}>
                  {o.options.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ),
            )}
        </select>

        {/* Custom caret — colors when focused */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-green-500)] transition-colors duration-[var(--duration-default)]">
          <CaretDown size={13} weight="bold" />
        </span>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-error)] leading-snug">
          <WarningCircle size={13} weight="fill" className="shrink-0" />
          {error}
        </p>
      )}

      {!error && helper && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] leading-snug">
          <Info size={13} weight="regular" className="shrink-0" />
          {helper}
        </p>
      )}
    </div>
  )
}
