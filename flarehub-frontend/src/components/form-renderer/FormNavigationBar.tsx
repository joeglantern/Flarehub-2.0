import { ArrowLeft, ArrowRight, PaperPlaneTilt, FloppyDisk } from '@phosphor-icons/react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

interface Props {
  step:         number
  total:        number
  isFirst:      boolean
  isLast:       boolean
  isSubmitting: boolean
  isSaving:     boolean
  lastSaved:    Date | null
  submitLabel:  string
  allowDraft:   boolean
  onBack:       () => void
  onNext:       () => void
  onSubmit:     () => void
}

export function FormNavigationBar({
  step, total, isFirst, isLast, isSubmitting, isSaving, lastSaved,
  submitLabel, allowDraft, onBack, onNext, onSubmit,
}: Props) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--color-border)]">

      {/* Left: back + draft status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)]',
            'border border-[var(--color-border)] bg-white',
            'hover:bg-[var(--color-bg-elevated)] transition-colors duration-[var(--duration-fast)]',
            'disabled:opacity-30 disabled:cursor-not-allowed',
          )}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Draft save indicator */}
        {allowDraft && (
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            {isSaving ? (
              <>
                <Spinner size="xs" className="text-[var(--color-text-muted)]" />
                Saving…
              </>
            ) : lastSaved ? (
              <>
                <FloppyDisk size={12} weight="fill" className="text-[var(--color-green-500)]" />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </span>
        )}
      </div>

      {/* Right: step counter + next/submit */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          {step + 1} / {total}
        </span>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              'flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-[var(--radius-md)]',
              'bg-[var(--color-green-500)] text-white',
              'hover:bg-[var(--color-green-600)] active:bg-[var(--color-green-700)]',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'transition-colors duration-[var(--duration-fast)]',
            )}
          >
            {isSubmitting ? (
              <Spinner size="xs" />
            ) : (
              <PaperPlaneTilt size={14} weight="fill" />
            )}
            {submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className={cn(
              'flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-[var(--radius-md)]',
              'bg-[var(--color-green-500)] text-white',
              'hover:bg-[var(--color-green-600)] transition-colors duration-[var(--duration-fast)]',
            )}
          >
            Next
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
