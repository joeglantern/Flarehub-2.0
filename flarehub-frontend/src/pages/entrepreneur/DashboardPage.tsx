import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Camera, CheckCircle, Circle, MegaphoneSimple,
  ChatCircle, Target, Trophy,
} from '@phosphor-icons/react'
import { IllustrationPlant } from '@/components/illustrations/IllustrationPlant'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Progress } from '@/components/ui/Progress'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate } from '@/lib/utils'
import type {
  ApiPaginated, ApiSuccess, Application,
  Announcement, SmartGoal, MilestonePlan, MarketResearch, Evidence,
} from '@/types/api'

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name} 👋`
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn:  () => api.get<ApiSuccess<Application[]>>('/applications/me').then(r => r.data.data),
    enabled:  !!user,
  })

  const { data: smartGoal } = useQuery({
    queryKey: ['smart-goal'],
    queryFn:  () => api.get<ApiSuccess<SmartGoal | null>>('/submissions/smart-goals/me').then(r => r.data.data),
    enabled:  !!user,
  })

  const { data: milestonePlan } = useQuery({
    queryKey: ['milestone-plan'],
    queryFn:  () => api.get<ApiSuccess<MilestonePlan | null>>('/submissions/milestones/me').then(r => r.data.data),
    enabled:  !!user,
  })

  const { data: marketResearch } = useQuery({
    queryKey: ['market-research'],
    queryFn:  () => api.get<ApiSuccess<MarketResearch | null>>('/submissions/market-research/me').then(r => r.data.data),
    enabled:  !!user,
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn:  () => api.get<ApiSuccess<Announcement[]>>('/announcements').then(r => r.data.data),
    enabled:  !!user,
  })

  const { data: evidence } = useQuery({
    queryKey: ['evidence', 'me'],
    queryFn:  () => api.get<ApiPaginated<Evidence>>('/evidence/me?limit=100').then(r => r.data.data),
    enabled:  !!user,
  })

  const pinned           = announcements?.find(a => a.isPinned)
  const submissionsDone  = [!!smartGoal, !!milestonePlan, !!marketResearch].filter(Boolean).length
  const submissionPct    = Math.round((submissionsDone / 3) * 100)
  const evidenceCount    = evidence?.length ?? 0
  const appCount         = appsData?.length ?? 0
  const activeApps       = appsData?.filter(a => !['Rejected'].includes(a.status)) ?? []

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl mesh-green text-white p-7 lg:p-9">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            {activeApps.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="chip bg-[var(--color-terra-500)] text-white border-transparent">
                  {activeApps.length} active application{activeApps.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <h1
              className="text-[34px] lg:text-[42px] font-bold leading-[1.05] text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {user ? greeting(user.firstName) : ''}
            </h1>
            <p className="text-white/70 mt-2 text-[14px] max-w-lg">
              Here&apos;s where things stand with your business today.
            </p>

            {/* Submission progress */}
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-[12px] text-white/70 mb-1.5">
                <span>Weekly submissions</span>
                <span className="font-mono">{submissionsDone}/3 done</span>
              </div>
              <Progress value={submissionPct} color="#ffffff" track="rgba(255,255,255,0.25)" height={6} />
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="dark" size="sm" icon={<Camera size={14} />}
                onClick={() => navigate('/evidence')}>
                Upload Evidence
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20"
                size="sm" icon={<ChatCircle size={14} />}
                onClick={() => navigate('/messages')}>
                Messages
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20"
                size="sm" icon={<Target size={14} />}
                onClick={() => navigate('/submissions/smart-goals')}>
                Goals
              </Button>
            </div>
          </div>

          {/* Illustration + mini stat */}
          <div className="hidden lg:flex items-end gap-4 shrink-0">
            <div className="w-40 h-40 opacity-90 drop-shadow-sm">
              <IllustrationPlant />
            </div>
            <div className="rough rotate-2 px-5 py-4 bg-white/95 text-[var(--color-ink)] shadow-pop w-44 mb-4">
              <div className="font-mono text-[10px] text-[var(--color-terra-600)] uppercase">submissions</div>
              <div className="text-[28px] font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {submissionsDone}/3
              </div>
              <div className="text-[11px] text-[var(--color-ink-mute)] mt-0.5">completed this cohort</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pinned announcement ────────────────────────────────────── */}
      {pinned && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[var(--color-forest-50)] border border-[var(--color-forest-100)]">
          <MegaphoneSimple size={16} weight="fill" className="text-[var(--color-forest-500)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-forest-700)]">{pinned.title}</p>
            <p className="text-sm text-[var(--color-forest-600)] mt-0.5">{pinned.body}</p>
          </div>
        </div>
      )}

      {/* ── Stat row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Applications"
          value={appsLoading ? '—' : appCount}
          sub="total submitted"
          sparkData={[1, 2, 1, 3, appCount, appCount, appCount]}
          color="var(--color-forest-500)"
        />
        <StatCard
          label="Evidence"
          value={evidenceCount}
          sub="items uploaded"
          sparkData={[0, 1, 2, 1, 3, evidenceCount, evidenceCount]}
          color="var(--color-terra-500)"
        />
        <StatCard
          label="Submissions"
          value={`${submissionsDone}/3`}
          sub="forms completed"
          sparkData={[0, 0, 1, 1, submissionsDone, submissionsDone, submissionsDone]}
          color="var(--color-sun)"
        />
        <StatCard
          label="Next Meeting"
          value="—"
          sub="no sessions yet"
          color="var(--color-forest-700)"
        />
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Applications list */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">Pipeline</div>
                <h3 className="text-[16px] font-semibold text-[var(--color-ink)] mt-0.5">My Applications</h3>
              </div>
              <Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />}
                onClick={() => navigate('/applications')}>
                See all
              </Button>
            </div>

            {appsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : appsData && appsData.length > 0 ? (
              <ul className="space-y-2">
                {appsData.slice(0, 4).map(app => (
                  <li key={app.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-elev)] transition cursor-pointer"
                    onClick={() => navigate('/applications')}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-forest-50)] flex items-center justify-center shrink-0 text-lg">
                      🚀
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{app.programName}</div>
                      <div className="text-[11px] text-[var(--color-ink-mute)]">{formatDate(app.appliedAt)}</div>
                    </div>
                    <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
                  <Trophy size={24} className="text-white" />
                </div>
                <p className="text-[13px] font-semibold text-[var(--color-ink)]">No applications yet</p>
                <p className="text-[12px] text-[var(--color-ink-mute)] mt-1">Find a program to get started.</p>
                <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/programs')}>
                  Browse programs
                </Button>
              </div>
            )}
          </div>

          {/* Submission progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">Progress</div>
                <h3 className="text-[16px] font-semibold text-[var(--color-ink)] mt-0.5">Submissions</h3>
              </div>
              <span className="font-mono text-[12px] text-[var(--color-ink-mute)]">{submissionsDone}/3</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Smart Goals',    done: !!smartGoal,      to: '/submissions/smart-goals' },
                { label: 'Milestone Plan', done: !!milestonePlan,  to: '/submissions/milestones' },
                { label: 'Market Research',done: !!marketResearch, to: '/submissions/market-research' },
              ].map(s => (
                <div key={s.label}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-elev)] transition cursor-pointer"
                  onClick={() => navigate(s.to)}
                >
                  {s.done
                    ? <CheckCircle size={18} weight="fill" className="text-[var(--color-forest-500)] shrink-0" />
                    : <Circle size={18} weight="regular" className="text-[var(--color-ink-mute)] shrink-0" />
                  }
                  <span className={s.done
                    ? 'text-[13px] font-medium text-[var(--color-ink)]'
                    : 'text-[13px] text-[var(--color-ink-mute)]'
                  }>{s.label}</span>
                  {!s.done && (
                    <span className="ml-auto text-[11px] text-[var(--color-terra-500)] font-semibold">
                      Start →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Mentor session card */}
          <div className="card p-5">
            <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)]">Next session</div>
            <div className="mt-3">
              <p className="text-[13px] text-[var(--color-ink-mute)]">
                Sessions are scheduled by your mentor once you&apos;re assigned one.
              </p>
            </div>
          </div>

          {/* Announcements */}
          {announcements && announcements.length > 0 && (
            <div className="card p-5">
              <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-3">Announcements</div>
              <ul className="space-y-3">
                {announcements.slice(0, 3).map(a => (
                  <li key={a.id} className="flex items-start gap-2">
                    <MegaphoneSimple size={14} weight="fill" className="text-[var(--color-terra-500)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--color-ink)]">{a.title}</p>
                      <p className="text-[11px] text-[var(--color-ink-mute)] mt-0.5 line-clamp-2">{a.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievement chips */}
          <div className="card p-5">
            <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-3">Achievements</div>
            <div className="flex flex-wrap gap-2">
              {submissionsDone >= 1 && (
                <span className="chip text-[var(--color-forest-700)] border-[var(--color-forest-200)]">✅ First submission</span>
              )}
              {submissionsDone >= 3 && (
                <span className="chip text-[var(--color-forest-700)] border-[var(--color-forest-200)]">🎯 All submissions done</span>
              )}
              {appCount >= 1 && (
                <span className="chip text-[var(--color-terra-600)] border-[var(--color-terra-200)]">🚀 First application</span>
              )}
              {evidenceCount >= 5 && (
                <span className="chip text-[var(--color-ink-mute)] border-[var(--color-line)]">📸 5+ evidence uploads</span>
              )}
              {submissionsDone === 0 && appCount === 0 && (
                <span className="text-[12px] text-[var(--color-ink-mute)]">Complete submissions to earn achievements.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
