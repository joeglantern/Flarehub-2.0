import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FormSchema, FieldResponseValue, FormResponse } from '@/types/applicationForm'
import { fieldIsVisible } from '@/utils/evaluateCondition'
import { useFormDraft } from '@/hooks/useFormDraft'
import { FormProgress }      from './FormProgress'
import { FormSection }       from './FormSection'
import { FormReviewStep }    from './FormReviewStep'
import { FormNavigationBar } from './FormNavigationBar'

interface Props {
  schema:        FormSchema
  programId:     number
  initialDraftId?: number | null
  initialResponses?: Record<string, FieldResponseValue>
  onSuccess:     (applicationId: number) => void
}

export function FormRenderer({
  schema, programId, initialDraftId = null, initialResponses = {}, onSuccess,
}: Props) {
  const [step, setStep]           = useState(0)
  const [responses, setResponses] = useState<Record<string, FieldResponseValue>>(initialResponses)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [draftId, setDraftId]     = useState<number | null>(initialDraftId)

  const { scheduleSave, flush, isSaving, lastSaved } = useFormDraft({
    draftId,
    programId,
    onDraftCreated: setDraftId,
  })

  const sections    = schema.sections
  const showReview  = schema.settings.showReviewStep
  const totalSteps  = sections.length + (showReview ? 1 : 0)
  const isReview    = showReview && step === sections.length
  const currentSection = isReview ? null : sections[step]

  // Auto-save on response changes — skip during/after submission
  useEffect(() => {
    if (!schema.settings.allowDraft) return
    if (Object.keys(responses).length === 0) return
    if (submitMutation.isPending || submitMutation.isSuccess) return
    const formResponse: FormResponse = { version: 1, fields: responses }
    scheduleSave(formResponse)
  }, [responses]) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(fieldId: string, value: FieldResponseValue) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  // ─── Validate current section ────────────────────────────────────────────

  function validateSection(): boolean {
    if (!currentSection) return true
    const newErrors: Record<string, string> = {}

    currentSection.fields
      .filter((f) => fieldIsVisible(f, responses))
      .forEach((field) => {
        if (!field.required) return
        const val = responses[field.id]
        const isEmpty =
          val === undefined || val === null || val === '' ||
          (Array.isArray(val) && val.length === 0)
        if (isEmpty) {
          newErrors[field.id] = 'This field is required'
        }
      })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  function handleNext() {
    if (!validateSection()) {
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0]
      if (firstErrorId) {
        document.getElementById(`field-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    // Flush draft on section change
    if (schema.settings.allowDraft) {
      flush({ version: 1, fields: responses })
    }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleEditStep(idx: number) {
    setStep(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<{ data: { id: number } }>('/applications', {
        programId,
        isDraft:   false,
        responses: { version: 1, fields: responses } satisfies FormResponse,
      }).then((r) => r.data.data.id),
    onSuccess: (id) => onSuccess(id),
  })

  function handleSubmit() {
    submitMutation.mutate()
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">

      {/* Progress */}
      {totalSteps > 1 && (
        <div className="mb-8">
          <FormProgress
            sections={sections}
            currentStep={step}
            showReview={showReview}
          />
        </div>
      )}

      {/* Content */}
      {isReview ? (
        <FormReviewStep
          schema={schema}
          responses={responses}
          onEdit={handleEditStep}
        />
      ) : currentSection ? (
        <FormSection
          section={currentSection}
          responses={responses}
          errors={errors}
          onChange={setField}
        />
      ) : null}

      {/* Submit error */}
      {submitMutation.isError && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-error)]">
            {(submitMutation.error as { response?: { data?: { error?: { message?: string } } } })
              ?.response?.data?.error?.message ?? 'Submission failed — please check your answers and try again.'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <FormNavigationBar
        step={step}
        total={totalSteps}
        isFirst={step === 0}
        isLast={step === totalSteps - 1}
        isSubmitting={submitMutation.isPending}
        isSaving={isSaving}
        lastSaved={lastSaved}
        submitLabel={schema.settings.submitButtonLabel ?? 'Submit application'}
        allowDraft={schema.settings.allowDraft}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
