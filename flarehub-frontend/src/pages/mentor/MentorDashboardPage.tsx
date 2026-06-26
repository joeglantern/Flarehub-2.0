import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Users, CalendarBlank, ArrowRight, ChatCircle,
  CheckCircle, ArrowUp,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/auth.store'
import { IllustrationMentor } from '@/components/illustrations/IllustrationMentor'
import { cn } from '@/lib/utils'
import type { ApiSuccess, ApiPaginated, MenteeWithProgress, MentorMeeting } from '@/types/api'

function greeting(name: string) {
  const h = new Date().getHours()
  return `${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, ${name} 👋`
}

function StatTile({
  icon, label, value, sub, color = 'var(--color-terra-500)',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</p>
        <p className="text-[22px] font-bold text-[var(--color-ink)] leading-none mt-0.5 tabular-nums"
          style={{ fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function MentorDashboardPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const { data: mentees, isLoading: menteesLoading } = useQuery({
    queryKey: ['mentees'],
    queryFn:  () => api.get<ApiSuccess<MenteeWithProgress[]>>('/mentor/mentees').then(r => r.data.data),
  })

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings', 'upcoming'],
    queryFn:  () => api.get<ApiPaginated<MentorMeeting>>('/mentor/meetings', {
      params: { status: 'Scheduled', limit: 5 },
    }).then(r => r.data.data),
  })

  const menteeCount     = mentees?.length ?? 0
  const meetingCount    = meetings?.length ?? 0
  const submittedCount  = mentees?.reduce((n, m) =>
    n + Object.values(m.submissionProgress).filter(s => s === 'submitted').length, 0) ?? 0
  const totalSlots      = (mentees?.length ?? 0) * 3
  const completionPct   = totalSlots > 0 ? Math.round((submittedCount / totalSlots) * 100) : 0

  return (
    <div className="space-y-6 page-enter">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-terra-50)] to-[#fdf0eb] border border-[var(--color-terra-100)] p-7 lg:p-9">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, var(--color-terra-500) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 w-full sm:max-w-[58%]">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-terra-500)] mb-2">
            Mentor · Afosihub
          </div>
          <h1 className="text-[32px] lg:text-[38px] font-bold text-[var(--color-ink)] leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}>
            {user ? greeting(user.firstName) : 'Dashboard'}
          </h1>
          <p className="text-[var(--color-ink-mute)] text-[14px] mt-2">
            Your mentoring overview for today.
          </p>

          {/* Hero stat chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--color-terra-100)]">
            <button
              onClick={() => navigate('/mentor/mentees')}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-terra-600)] hover:text-[var(--color-terra-700)] transition-colors"
            >
              <Users size={12} weight="bold" />
              {menteeCount} mentee{menteeCount !== 1 ? 's' : ''}
              <ArrowRight size={10} />
            </button>
            <span className="text-[var(--color-terra-200)]">·</span>
            <button
              onClick={() => navigate('/mentor/meetings')}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-terra-600)] hover:text-[var(--color-terra-700)] transition-colors"
            >
              <CalendarBlank size={12} weight="bold" />
              {meetingCount} upcoming meeting{meetingCount !== 1 ? 's' : ''}
              <ArrowRight size={10} />
            </button>
          </div>
        </div>

        {/* Illustration */}
        <div className="hidden sm:block absolute right-0 bottom-0 w-52 h-44 pointer-events-none select-none opacity-90">
          <IllustrationMentor />
        </div>
      </div>

      {/* ── Stat tiles ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<Users size={18} weight="duotone" />}
          label="My mentees"
          value={menteeCount}
          sub="assigned to you"
          color="var(--color-terra-500)"
        />
        <StatTile
          icon={<CalendarBlank size={18} weight="duotone" />}
          label="Upcoming"
          value={meetingCount}
          sub="scheduled sessions"
          color="var(--color-forest-500)"
        />
        <StatTile
          icon={<CheckCircle size={18} weight="duotone" />}
          label="Submissions done"
          value={submittedCount}
          sub={`of ${totalSlots} total`}
          color="var(--color-sun)"
        />
        <StatTile
          icon={<ArrowUp size={18} weight="duotone" />}
          label="Completion rate"
          value={`${completionPct}%`}
          sub="across all mentees"
          color="var(--color-forest-700)"
        />
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Mentees card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">Workspace</div>
              <h3 className="text-[16px] font-semibold text-[var(--color-ink)] mt-0.5"
                style={{ fontFamily: 'var(--font-display)' }}>My Mentees</h3>
            </div>
            <Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />}
              onClick={() => navigate('/mentor/mentees')}>See all</Button>
          </div>

          {menteesLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !mentees?.length ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-terra-50)] flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-[var(--color-terra-400)]" />
              </div>
              <p className="text-[13px] font-medium text-[var(--color-ink-mute)]">No mentees assigned yet</p>
              <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">The admin will assign mentees to you.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {mentees.slice(0, 4).map(m => {
                const done  = Object.values(m.submissionProgress).filter(s => s === 'submitted').length
                const total = Object.values(m.submissionProgress).length
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-elev)] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/mentor/mentees/${m.id}`)}
                  >
                    <Avatar firstName={m.firstName} lastName={m.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-mute)]">
                        {m.businessName ?? m.county ?? m.email}
                      </p>
                      {/* Submission progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--color-inset)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-forest-500)] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-ink-faint)] shrink-0">{done}/{total}</span>
                      </div>
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
                )
              })}
            </div>
          )}
        </Card>

        {/* Meetings card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">Schedule</div>
              <h3 className="text-[16px] font-semibold text-[var(--color-ink)] mt-0.5"
                style={{ fontFamily: 'var(--font-display)' }}>Upcoming Meetings</h3>
            </div>
            <Button variant="ghost" size="sm" iconRight={<ArrowRight size={13} />}
              onClick={() => navigate('/mentor/meetings')}>See all</Button>
          </div>

          {meetingsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !meetings?.length ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-forest-50)] flex items-center justify-center mx-auto mb-3">
                <CalendarBlank size={20} className="text-[var(--color-forest-400)]" />
              </div>
              <p className="text-[13px] font-medium text-[var(--color-ink-mute)]">No upcoming meetings</p>
              <Button variant="secondary" size="sm" className="mt-3"
                onClick={() => navigate('/mentor/meetings')}>
                Schedule one
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {meetings.map(m => {
                const dt      = new Date(m.meetingTime)
                const isToday = dt.toDateString() === new Date().toDateString()
                return (
                  <div key={m.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl transition-colors',
                      isToday ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-100)]' : 'hover:bg-[var(--color-elev)]',
                    )}
                  >
                    {/* Date block */}
                    <div className={cn(
                      'w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0',
                      isToday ? 'bg-[var(--color-forest-500)]' : 'bg-[var(--color-elev)]',
                    )}>
                      <span className={cn('text-[9px] font-mono uppercase leading-none',
                        isToday ? 'text-white/70' : 'text-[var(--color-ink-faint)]')}>
                        {dt.toLocaleDateString('en-KE', { month: 'short' })}
                      </span>
                      <span className={cn('text-[17px] font-bold leading-tight',
                        isToday ? 'text-white' : 'text-[var(--color-ink)]')}
                        style={{ fontFamily: 'var(--font-display)' }}>
                        {dt.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
                        {m.mentee?.firstName} {m.mentee?.lastName}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-mute)]">
                        {dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{m.meetingType}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isToday && (
                        <span className="text-[10px] font-mono font-semibold text-[var(--color-forest-600)] bg-[var(--color-forest-50)] border border-[var(--color-forest-100)] px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                      {m.link && (
                        <a href={m.link} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}>
                          <Button variant="secondary" size="sm">Join</Button>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'View all mentees',    sub: 'Track progress',    path: '/mentor/mentees',  color: 'var(--color-terra-500)' },
          { label: 'Schedule a meeting',  sub: 'Manage sessions',   path: '/mentor/meetings', color: 'var(--color-forest-500)' },
          { label: 'Message a mentee',    sub: 'Open conversations', path: '/mentor/messages', color: 'var(--color-sun)' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="card p-5 text-left flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in srgb, ${a.color} 10%, transparent)` }}>
              <ArrowRight size={16} style={{ color: a.color }} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[var(--color-ink)]">{a.label}</p>
              <p className="text-[12px] text-[var(--color-ink-faint)]">{a.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
