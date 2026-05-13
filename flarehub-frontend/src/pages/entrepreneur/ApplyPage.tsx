import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import { IllustrationSuccess } from '@/components/illustrations/IllustrationSuccess'
import { api } from '@/lib/api'
import type { ApiSuccess, Program, Application } from '@/types/api'
import { useApplicationForm } from '@/hooks/useApplicationForm'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

export default function ApplyPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const programQuery = useQuery({
    queryKey: ['programs', id],
    queryFn:  () => api.get<ApiSuccess<Program>>(`/programs/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })

  const formQuery = useApplicationForm(id!)

  // Check for existing draft application
  const draftQuery = useQuery({
    queryKey: ['applications', 'draft', id],
    queryFn:  () =>
      api.get<{ data: Application[] }>('/applications').then(r =>
        r.data.data.find(a => String(a.programId) === id && a.isDraft) ?? null,
      ),
    enabled: !!id,
  })

  const isLoading = programQuery.isLoading || formQuery.isLoading || draftQuery.isLoading

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton height={40} />
        <Skeleton height={200} />
        <Skeleton height={120} />
      </div>
    )
  }

  const program = programQuery.data
  const schema  = formQuery.data
  const draft   = draftQuery.data

  // Already applied (submitted)
  if (program?.hasApplied) {
    return (
      <div className="max-w-2xl">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
          onClick={() => navigate(`/programs/${id}`)} className="mb-6">
          Back
        </Button>
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center">
            <CheckCircle size={24} weight="fill" className="text-white" />
          </div>
          <h2 className="text-[22px] font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>Already applied</h2>
          <p className="text-[14px] text-[var(--color-ink-mute)]">
            You have already submitted an application for this program.
          </p>
          <Button variant="secondary" onClick={() => navigate('/applications')}>
            View my applications
          </Button>
        </div>
      </div>
    )
  }

  // No form schema — shouldn't happen, but fall back gracefully
  if (!schema) {
    return (
      <div className="max-w-2xl">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
          onClick={() => navigate(`/programs/${id}`)} className="mb-6">
          Back
        </Button>
        <p className="text-[14px] text-[var(--color-ink-faint)]">This program has no application form.</p>
      </div>
    )
  }

  function handleSuccess() {
    setSubmitted(true)
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return <SuccessScreen programName={program?.name ?? 'program'} onDone={() => navigate('/applications')} />
  }

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-2xl space-y-6 pb-24 lg:pb-8">
      <div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
          onClick={() => navigate(`/programs/${id}`)}>
          Back to {program?.name}
        </Button>
        <h1 className="text-[28px] font-bold mt-4 leading-tight text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Apply to {program?.name ?? 'program'}
        </h1>
        <p className="text-[14px] text-[var(--color-ink-mute)] mt-1">
          {draft ? 'Continuing your saved draft' : 'Fill out the form below to apply'}
        </p>
      </div>

      <FormRenderer
        schema={schema}
        programId={Number(id)}
        initialDraftId={draft?.id ?? null}
        initialResponses={
          draft?.responses
            ? (draft.responses as { fields: Record<string, unknown> }).fields as Record<string, import('@/types/applicationForm').FieldResponseValue>
            : {}
        }
        onSuccess={handleSuccess}
      />
    </div>
  )
}


// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ programName, onDone }: { programName: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center py-16 gap-6">
      <div className="w-52 h-52">
        <IllustrationSuccess />
      </div>

      <div className="space-y-2">
        <h1 className="text-[28px] font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Application submitted!
        </h1>
        <p className="text-[14px] text-[var(--color-ink-mute)] leading-relaxed">
          Your application for <span className="font-semibold text-[var(--color-ink)]">{programName}</span> is in.
          We'll be in touch soon.
        </p>
      </div>

      <div className="w-full max-w-[200px] h-1 rounded-full bg-[var(--color-line)] overflow-hidden">
        <div className="h-full bg-[var(--color-forest-500)] rounded-full"
          style={{ animation: 'grow-bar 4s linear forwards' }} />
      </div>
      <p className="text-[11px] font-mono text-[var(--color-ink-faint)] -mt-4">Redirecting to your applications…</p>

      <Button onClick={onDone} variant="secondary" icon={<CheckCircle size={15} weight="fill" />}>
        View my applications
      </Button>

      <style>{`
        @keyframes grow-bar { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}
