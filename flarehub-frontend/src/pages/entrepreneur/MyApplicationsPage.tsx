import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import type { ApiSuccess, Application } from '@/types/api'

const STAGES = ['Submitted', 'UnderReview', 'NeedsRevision', 'Approved', 'Rejected']
const STAGE_LABELS: Record<string, string> = {
  Submitted:     'Submitted',
  UnderReview:   'Under Review',
  NeedsRevision: 'Needs Revision',
  Approved:      'Approved',
  Rejected:      'Rejected',
}
const STAGE_COLORS: Record<string, string> = {
  Submitted:     'var(--color-ink-mute)',
  UnderReview:   'var(--color-info)',
  NeedsRevision: 'var(--color-warning)',
  Approved:      'var(--color-forest-500)',
  Rejected:      'var(--color-error)',
}
const PROGRAM_EMOJIS = ['🚀', '🌱', '⚡', '💡', '🏆', '🎯', '📈', '🔥']

export default function MyApplicationsPage() {
  const navigate = useNavigate()
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn:  () => api.get<ApiSuccess<Application[]>>('/applications/me').then(r => r.data.data),
  })

  const apps     = data ?? []
  const filtered = activeStage ? apps.filter(a => a.status === activeStage) : apps

  const stageCounts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length
    return acc
  }, {})

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Pipeline</div>
        <h1 className="text-[34px] lg:text-[40px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          My Applications
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          {apps.length} application{apps.length !== 1 ? 's' : ''} across {Object.values(stageCounts).filter(Boolean).length} stage{Object.values(stageCounts).filter(Boolean).length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Pipeline stage bars */}
      <div className="card p-5">
        <div className="text-[11px] font-mono uppercase text-[var(--color-ink-faint)] mb-4">Stage overview</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STAGES.map(stage => {
            const count    = stageCounts[stage]
            const isActive = activeStage === stage
            return (
              <button
                key={stage}
                onClick={() => setActiveStage(isActive ? null : stage)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition ${
                  isActive
                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white'
                    : 'border-[var(--color-line)] hover:bg-[var(--color-elev)]'
                }`}
              >
                <div
                  className="text-[24px] font-bold leading-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: isActive ? 'white' : STAGE_COLORS[stage],
                  }}
                >
                  {count}
                </div>
                <div className={`text-[10px] font-mono uppercase tracking-wide text-center leading-tight ${isActive ? 'text-white/70' : 'text-[var(--color-ink-mute)]'}`}>
                  {STAGE_LABELS[stage]}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter tag */}
      {activeStage && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--color-ink-mute)]">Showing:</span>
          <div
            className="tab-pill"
            data-on="true"
            onClick={() => setActiveStage(null)}
          >
            {STAGE_LABELS[activeStage]} ({stageCounts[activeStage]}) ×
          </div>
        </div>
      )}

      {/* Application cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center dotted">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">
            {activeStage ? `No ${STAGE_LABELS[activeStage]} applications` : 'No applications yet'}
          </div>
          <p className="text-[12px] text-[var(--color-ink-mute)] mt-1">
            {activeStage
              ? 'Try another stage or clear the filter.'
              : 'Find a program and apply to get started.'}
          </p>
          {!activeStage && (
            <Button variant="primary" size="sm" className="mt-4"
              onClick={() => navigate('/programs')}>
              Browse programs
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <div key={app.id}
              className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-pop transition-all cursor-pointer"
              onClick={() => navigate('/programs')}
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-forest-50)] flex items-center justify-center text-2xl shrink-0">
                {PROGRAM_EMOJIS[i % PROGRAM_EMOJIS.length]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[var(--color-ink)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {app.programName}
                </div>
                <div className="text-[12px] text-[var(--color-ink-mute)] mt-0.5">
                  Applied {formatDate(app.appliedAt)}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                <ArrowRight size={16} className="text-[var(--color-ink-mute)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {apps.length > 0 && !activeStage && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" icon={<ArrowRight size={14} />}
            onClick={() => navigate('/programs')}>
            Browse more programs
          </Button>
        </div>
      )}
    </div>
  )
}
