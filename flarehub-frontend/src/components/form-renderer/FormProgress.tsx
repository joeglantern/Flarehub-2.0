import { CheckCircle } from '@phosphor-icons/react'
import type { FormSection } from '@/types/applicationForm'
import { cn } from '@/lib/utils'

interface Props {
  sections:    FormSection[]
  currentStep: number
  showReview:  boolean
}

export function FormProgress({ sections, currentStep, showReview }: Props) {
  const steps = [
    ...sections.map((s) => s.title),
    ...(showReview ? ['Review'] : []),
  ]

  if (steps.length <= 1) return null

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1" role="list" aria-label="Form progress">
      {steps.map((label, idx) => {
        const isDone    = idx < currentStep
        const isCurrent = idx === currentStep

        return (
          <div key={idx} role="listitem" className="flex items-center min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  'border-2 transition-all duration-[var(--duration-default)]',
                  isDone
                    ? 'bg-[var(--color-green-500)] border-[var(--color-green-500)]'
                    : isCurrent
                    ? 'bg-white border-[var(--color-green-500)]'
                    : 'bg-white border-[var(--color-border)]',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? (
                  <CheckCircle size={14} weight="fill" className="text-white" />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isCurrent
                        ? 'text-[var(--color-green-500)]'
                        : 'text-[var(--color-text-muted)]',
                    )}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium truncate max-w-[64px] text-center',
                  isCurrent
                    ? 'text-[var(--color-green-500)]'
                    : isDone
                    ? 'text-[var(--color-text-secondary)]'
                    : 'text-[var(--color-text-muted)]',
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-12 shrink-0 mx-1 mb-5 rounded-full transition-colors duration-[var(--duration-default)]',
                  idx < currentStep
                    ? 'bg-[var(--color-green-500)]'
                    : 'bg-[var(--color-border)]',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
