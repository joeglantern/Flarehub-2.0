import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, CalendarBlank, Users, Tag, ArrowRight } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Progress } from '@/components/ui/Progress'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import type { ApiSuccess, Program } from '@/types/api'

export default function ProgramDetailPage() {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const qc              = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: program, isLoading } = useQuery({
    queryKey: ['programs', id],
    queryFn:  () => api.get<ApiSuccess<Program>>(`/programs/${id}`).then(r => r.data.data),
  })

  const apply = useMutation({
    mutationFn: () => api.post('/applications', { programId: Number(id) }),
    onSuccess:  () => { toast.success('Application submitted'); qc.invalidateQueries({ queryKey: ['programs', id] }); setOpen(false) },
    onError:    () => toast.error('Could not apply', 'You may have already applied'),
  })

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-48 rounded-[20px]" />
      <Skeleton className="h-32 rounded-[20px]" />
    </div>
  )
  if (!program) return null

  const spotsLeft = program.maxParticipants != null && program.applicationCount != null
    ? Math.max(0, program.maxParticipants - program.applicationCount)
    : null
  const filled = program.maxParticipants && program.applicationCount != null
    ? (program.applicationCount / program.maxParticipants) * 100
    : null

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-2xl space-y-5 pb-24 lg:pb-8">

      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/programs')}>
        Back to programs
      </Button>

      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
              {program.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={program.hasApplied ? 'approved' : statusVariant(program.status)}>
                {program.hasApplied ? 'Applied' : program.status}
              </Badge>
              {program.applicationCount !== undefined && (
                <span className="text-[12px] text-[var(--color-ink-mute)] flex items-center gap-1">
                  <Users size={12} />{program.applicationCount} applicants
                </span>
              )}
            </div>
          </div>
          {!program.hasApplied && program.status === 'Active' && (
            <Button iconRight={<ArrowRight size={14} />} onClick={() => program.hasApplicationForm
              ? navigate(`/programs/${id}/apply`)
              : setOpen(true)
            }>
              Apply now
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--color-elev)] px-4 py-3">
            <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] flex items-center gap-1.5 mb-1">
              <CalendarBlank size={11} /> Deadline
            </div>
            <div className="text-[15px] font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
              {program.applicationDeadline ? formatDate(program.applicationDeadline) : 'Open'}
            </div>
          </div>
          {spotsLeft !== null && (
            <div className="rounded-xl bg-[var(--color-elev)] px-4 py-3">
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-1">Spots left</div>
              <div className="text-[15px] font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {spotsLeft}
              </div>
            </div>
          )}
        </div>

        {filled !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-[var(--color-ink-faint)] mb-1.5">
              <span>{program.applicationCount}/{program.maxParticipants} filled</span>
              <span className="font-mono">{Math.round(filled)}%</span>
            </div>
            <Progress value={filled} height={5} />
          </div>
        )}

        {program.grantAmount && (
          <div className="mt-4 flex items-center gap-2 text-[13px]">
            <span className="text-[var(--color-ink-mute)]">Grant amount:</span>
            <span className="font-semibold text-[var(--color-ink)]">KES {Number(program.grantAmount).toLocaleString()}</span>
          </div>
        )}
      </div>

      {program.description && (
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-3">About this program</div>
          <p className="text-[14px] text-[var(--color-ink-mute)] leading-relaxed">{program.description}</p>
        </div>
      )}

      {program.eligibilityRequirements && (
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-3">Eligibility</div>
          <p className="text-[14px] text-[var(--color-ink-mute)] leading-relaxed">{program.eligibilityRequirements}</p>
        </div>
      )}

      {program.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={13} className="text-[var(--color-ink-faint)]" />
          {program.tags.map(tag => (
            <span key={tag} className="chip bg-[var(--color-elev)] border-[var(--color-line)] text-[var(--color-ink-mute)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Apply to ${program.name}`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={apply.isPending} onClick={() => apply.mutate()}>Submit application</Button>
          </>
        }>
        <p className="text-[14px] text-[var(--color-ink-mute)]">
          Confirm your application for this program. You can only apply once.
        </p>
      </Modal>
    </div>
  )
}
