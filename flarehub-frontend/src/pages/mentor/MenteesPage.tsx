import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, ChatCircle, ArrowRight } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiSuccess, MenteeWithProgress } from '@/types/api'

export default function MenteesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['mentees'],
    queryFn:  () => api.get<ApiSuccess<MenteeWithProgress[]>>('/mentor/mentees').then(r => r.data.data),
  })

  return (
    <div className="space-y-6 page-enter">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Mentor · Flarehub</p>
          <h1 className="text-[32px] font-bold text-[var(--color-ink)] leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}>
            My Mentees
          </h1>
          {data && (
            <p className="text-[14px] text-[var(--color-ink-mute)] mt-1">
              {data.length} entrepreneur{data.length !== 1 ? 's' : ''} assigned to you
            </p>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[140px] rounded-[20px]" />)}
        </div>
      ) : !data?.length ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-terra-50)] flex items-center justify-center mb-4">
            <Users size={24} className="text-[var(--color-terra-400)]" />
          </div>
          <p className="text-[16px] font-semibold text-[var(--color-ink)]">No mentees yet</p>
          <p className="text-[13px] text-[var(--color-ink-faint)] mt-1 max-w-xs">
            Mentees will appear here once the admin assigns them to you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(m => {
            const done  = Object.values(m.submissionProgress).filter(v => v === 'submitted').length
            const total = Object.values(m.submissionProgress).length
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={m.id}
                className="card p-5 flex flex-col gap-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all group"
                onClick={() => navigate(`/mentor/mentees/${m.id}`)}>

                {/* Top row */}
                <div className="flex items-start gap-3">
                  <Avatar firstName={m.firstName} lastName={m.lastName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[var(--color-ink)] leading-tight">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-[12px] text-[var(--color-ink-faint)] mt-0.5 truncate">{m.email}</p>
                    {m.businessStage && (
                      <Badge variant="default" className="mt-1.5">{m.businessStage}</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); navigate(`/mentor/messages/${m.id}`) }}
                    title={`Message ${m.firstName}`}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-[var(--color-ink-mute)] hover:text-[var(--color-forest-600)] hover:bg-[var(--color-forest-50)] transition-all shrink-0"
                  >
                    <ChatCircle size={15} weight="duotone" />
                  </button>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-[var(--color-ink-faint)]">Submissions</span>
                    <span className="text-[11px] font-mono font-semibold text-[var(--color-ink-mute)]">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-inset)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-forest-500)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--color-line)]">
                  {m.businessName ? (
                    <span className="text-[11px] text-[var(--color-ink-faint)] truncate">{m.businessName}</span>
                  ) : (
                    <span className="text-[11px] text-[var(--color-ink-faint)]">{m.county ?? '—'}</span>
                  )}
                  <span className="text-[11px] font-semibold text-[var(--color-terra-600)] flex items-center gap-0.5 shrink-0">
                    View <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
