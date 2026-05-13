import { WarningCircle } from '@phosphor-icons/react'
import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong. Try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <WarningCircle size={40} weight="light" className="text-[var(--color-error)] mb-3" />
      <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
