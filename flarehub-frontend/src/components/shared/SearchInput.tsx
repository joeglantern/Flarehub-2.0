import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value:       string
  onChange:    (value: string) => void
  placeholder?: string
  className?:  string
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<MagnifyingGlass size={15} />}
        rightIcon={
          value
            ? (
              <button
                onClick={() => onChange('')}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )
            : null
        }
      />
    </div>
  )
}
