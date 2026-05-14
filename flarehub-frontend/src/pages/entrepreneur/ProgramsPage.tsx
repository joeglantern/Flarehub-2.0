import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MagnifyingGlass, SlidersHorizontal, Tag } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, Program } from '@/types/api'

const TAGS = ['All', 'Accelerator', 'Grant', 'Bootcamp', 'Fellowship', 'Cohort']

function ProgramCard({ program, onApply, onNavigate }: {
  program: Program
  onApply: (p: Program) => void
  onNavigate: (id: number) => void
}) {
  const spotsLeft = program.maxParticipants != null && program.applicationCount != null
    ? Math.max(0, program.maxParticipants - program.applicationCount)
    : null
  const filled = program.maxParticipants && program.applicationCount != null
    ? (program.applicationCount / program.maxParticipants) * 100
    : null
  const closing = spotsLeft != null && spotsLeft <= 4 && spotsLeft > 0

  return (
    <div
      className="card p-5 sheen group hover:-translate-y-1 hover:shadow-pop transition-all relative overflow-hidden cursor-pointer"
      onClick={() => onNavigate(program.id)}
    >
      {/* Hover corner fold */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-l-[28px] border-t-[var(--color-terra-500)] border-l-transparent opacity-0 group-hover:opacity-100 transition" />

      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft bg-[var(--color-forest-50)] text-[var(--color-forest-600)]">
          <Tag size={22} weight="duotone" />
        </div>
        <Badge variant={program.hasApplied ? 'approved' : statusVariant(program.status)}>
          {program.hasApplied ? 'Applied' : (program.tags[0] ?? program.status)}
        </Badge>
      </div>

      <h3 className="text-[18px] font-semibold text-[var(--color-ink)] mt-3 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {program.name}
      </h3>
      {program.description && (
        <p className="text-[13px] text-[var(--color-ink-mute)] mt-2 line-clamp-2 leading-relaxed">
          {program.description}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[var(--color-elev)]/70 px-3 py-2">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-mute)]">deadline</div>
          <div className="text-[14px] font-semibold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
            {program.applicationDeadline ? formatDate(program.applicationDeadline) : '—'}
          </div>
        </div>
        <div className="rounded-xl bg-[var(--color-elev)]/70 px-3 py-2">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-mute)]">spots left</div>
          <div className="text-[14px] font-semibold text-[var(--color-ink)] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            {spotsLeft != null ? spotsLeft : '—'}
            {closing && (
              <span className="text-[10px] font-mono text-[var(--color-terra-600)] bg-[var(--color-terra-50)] px-1.5 py-0.5 rounded">
                closing
              </span>
            )}
          </div>
        </div>
      </div>

      {filled !== null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-mute)] mb-1">
            <span>{program.applicationCount}/{program.maxParticipants} filled</span>
            <span className="font-mono">{Math.round(filled)}%</span>
          </div>
          <Progress value={filled} height={5} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
        {program.hasApplied ? (
          <Badge variant={statusVariant(program.status)}>{program.status}</Badge>
        ) : (
          <Button size="sm" iconRight={<ArrowRight size={12} />} onClick={() => {
            program.hasApplicationForm
              ? onNavigate(program.id)
              : onApply(program)
          }}>
            Apply
          </Button>
        )}
        <button className="text-[12px] font-semibold text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] flex items-center gap-1">
          Details <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

export default function ProgramsPage() {
  const [page, setPage]         = useState(1)
  const [filter, setFilter]     = useState('All')
  const [applyTarget, setApply] = useState<Program | null>(null)
  const qc                      = useQueryClient()
  const navigate                = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['programs', page, filter],
    queryFn:  () => api.get<ApiPaginated<Program>>('/programs', {
      params: { page, limit: 12, status: 'Active', ...(filter !== 'All' ? { tag: filter } : {}) },
    }).then(r => r.data),
  })

  const applyMutation = useMutation({
    mutationFn: (programId: number) =>
      api.post('/applications', { programId }).then(r => r.data),
    onSuccess: () => {
      toast.success('Application submitted')
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['programs'] })
      setApply(null)
    },
    onError: () => toast.error('Could not apply', 'You may have already applied'),
  })

  const programs = data?.data ?? []
  const featured = programs[0]
  const rest     = programs.slice(1)

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Programs · Kenya</div>
          <h1 className="text-[34px] lg:text-[40px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
            Find your <span className="squiggle">launchpad</span>.
          </h1>
          <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
            {data?.meta.total ?? '—'} active programs. Curated for you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal size={14} />}>Filters</Button>
        </div>
      </div>

      {/* Tag filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {TAGS.map(t => (
          <div key={t} className="tab-pill" data-on={filter === t} onClick={() => { setFilter(t); setPage(1) }}>
            {t}
          </div>
        ))}
        <span className="ml-auto text-[12px] text-[var(--color-ink-mute)] font-mono">
          {programs.length} programs
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-3">
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-[20px]" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="card p-10 text-center dotted">
          <div className="w-16 h-16 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-4 shadow-soft text-[var(--color-forest-600)]">
            <MagnifyingGlass size={32} weight="duotone" />
          </div>
          <div className="text-[18px] font-semibold text-[var(--color-ink)]">No programs found</div>
          <p className="text-[13px] text-[var(--color-ink-mute)] mt-1 max-w-sm mx-auto">
            No active programs right now. Try a different filter or check back soon.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => { setFilter('All'); setPage(1) }}>
            Show all programs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Featured */}
          {featured && (
            <div
              className="lg:col-span-3 relative overflow-hidden rounded-3xl mesh-dark text-white p-7 lg:p-9 cursor-pointer"
              onClick={() => navigate(`/programs/${featured.id}`)}
            >
              <div className="grid lg:grid-cols-2 gap-6 items-center relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="chip bg-white/10 text-white border-white/20">featured program</span>
                    {featured.applicationDeadline && (
                      <span className="chip bg-[var(--color-terra-500)] text-white border-transparent">
                        closes {formatDate(featured.applicationDeadline)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-[28px] lg:text-[36px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
                    {featured.name}
                  </h2>
                  {featured.description && (
                    <p className="text-white/70 mt-3 max-w-md text-[14px]">{featured.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-5" onClick={e => e.stopPropagation()}>
                    {featured.hasApplied ? (
                      <Badge variant="approved">Applied</Badge>
                    ) : (
                      <>
                        <Button variant="terra" iconRight={<ArrowRight size={14} />}
                          onClick={() => featured.hasApplicationForm
                            ? navigate(`/programs/${featured.id}/apply`)
                            : setApply(featured)
                          }>
                          Apply now
                        </Button>
                        <Button variant="ghost" className="text-white hover:bg-white/10"
                          onClick={() => navigate(`/programs/${featured.id}`)}>
                          Preview
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative h-[180px] hidden lg:block">
                  <div className="absolute right-0 top-0 rough rotate-3 px-4 py-3 bg-white/95 text-[var(--color-ink)] shadow-pop w-48">
                    <div className="font-mono text-[10px] text-[var(--color-terra-600)] uppercase">deadline</div>
                    <div className="text-[20px] font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {featured.applicationDeadline ? formatDate(featured.applicationDeadline) : 'Open'}
                    </div>
                  </div>
                  <div className="absolute left-2 bottom-2 -rotate-2 px-4 py-3 bg-[var(--color-forest-50)] text-[var(--color-forest-700)] rounded-2xl shadow-pop border border-[var(--color-forest-100)] w-44">
                    <div className="font-mono text-[10px] uppercase">spots left</div>
                    <div className="text-[20px] font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {featured.maxParticipants != null && featured.applicationCount != null
                        ? Math.max(0, featured.maxParticipants - featured.applicationCount)
                        : '∞'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rest of cards */}
          {rest.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              onApply={setApply}
              onNavigate={(id) => navigate(`/programs/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl font-mono text-[13px] transition ${
                p === page
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-[var(--color-elev)] text-[var(--color-ink-mute)] hover:bg-[var(--color-inset)]'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Apply modal */}
      <Modal open={!!applyTarget} onClose={() => setApply(null)}
        title={`Apply to ${applyTarget?.name ?? ''}`}
        description="Confirm your application. You can only apply once per program."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApply(null)}>Cancel</Button>
            <Button loading={applyMutation.isPending}
              onClick={() => applyTarget && applyMutation.mutate(applyTarget.id)}>
              Submit application
            </Button>
          </>
        }>
        {applyTarget?.eligibilityRequirements && (
          <div className="p-3 rounded-xl bg-[var(--color-elev)]">
            <p className="text-[11px] font-mono uppercase text-[var(--color-ink-faint)] mb-1">Eligibility</p>
            <p className="text-sm text-[var(--color-ink)]">{applyTarget.eligibilityRequirements}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
