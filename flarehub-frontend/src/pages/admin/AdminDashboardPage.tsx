import { useQuery } from '@tanstack/react-query'
import { ResponsiveLine } from '@nivo/line'
import {
  UsersThree, ClipboardText, SealCheck, Binoculars,
  ArrowUp, ArrowDown, ArrowRight,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChartCard, nivoTheme, chartColors } from '@/components/ui/ChartCard'
import { DonutRingGroup } from '@/components/ui/BarChart'
import { useAuthStore } from '@/store/auth.store'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { IllustrationShield } from '@/components/illustrations/IllustrationShield'
import type { ApiSuccess, AdminOverview } from '@/types/api'

function greeting(name: string) {
  const h = new Date().getHours()
  return h < 12 ? `Good morning, ${name} 👋` : h < 17 ? `Good afternoon, ${name} 👋` : `Good evening, ${name} 👋`
}

interface MonthData { month: string; count: number }
interface GenderData { [key: string]: number }

function StatTile({
  icon, label, value, sub, color = 'var(--color-forest-500)', trend,
}: {
  icon:    React.ReactNode
  label:   string
  value:   string | number
  sub?:    string
  color?:  string
  trend?:  'up' | 'down'
}) {
  return (
    <div className="card p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] transition-all">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full',
            trend === 'up'
              ? 'text-[var(--color-forest-600)] bg-[var(--color-forest-50)]'
              : 'text-[var(--color-terra-600)] bg-[var(--color-terra-50)]',
          )}>
            {trend === 'up' ? <ArrowUp size={10} weight="bold" /> : <ArrowDown size={10} weight="bold" />}
          </div>
        )}
      </div>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</p>
        <p className="text-[32px] font-bold text-[var(--color-ink)] leading-none mt-1 tabular-nums"
          style={{ fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        {sub && <p className="text-[12px] text-[var(--color-ink-faint)] mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn:  () => api.get<ApiSuccess<AdminOverview>>('/admin/analytics/overview').then(r => r.data.data),
  })

  const { data: byMonth } = useQuery({
    queryKey: ['analytics', 'by-month'],
    queryFn:  () => api.get<ApiSuccess<MonthData[]>>('/admin/analytics/applications-by-month', { params: { months: 6 } }).then(r => r.data.data),
  })

  const { data: genderRaw } = useQuery({
    queryKey: ['analytics', 'gender'],
    queryFn:  () => api.get<ApiSuccess<GenderData>>('/admin/analytics/gender-distribution').then(r => r.data.data),
  })

  const lineData = byMonth ? [{
    id:   'Applications',
    color: chartColors.green,
    data:  byMonth.map(d => ({ x: d.month, y: d.count })),
  }] : []

  const GENDER_COLORS = [chartColors.green, chartColors.terra, chartColors.amber, chartColors.slate]
  const genderData = genderRaw
    ? Object.entries(genderRaw).map(([label, value], i) => ({
        label, value, color: GENDER_COLORS[i % GENDER_COLORS.length],
      }))
    : []

  return (
    <div className="space-y-6 page-enter">

      {/* ── Dark hero ───────────────────────────────────────────────────── */}
      <div className="mesh-dark rounded-3xl p-7 lg:p-9 relative overflow-hidden text-white">
        {/* Background dots */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Illustration — desktop only */}
        <div className="absolute right-0 bottom-0 w-44 h-44 pointer-events-none select-none hidden lg:block" style={{ opacity: 0.4, mixBlendMode: 'screen' }}>
          <IllustrationShield />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="lg:max-w-[55%]">
            <div className="text-[11px] font-mono uppercase tracking-widest text-white/50 mb-2">Admin · Flarehub</div>
            <h1 className="text-[34px] lg:text-[42px] font-bold leading-[1.05] text-white"
              style={{ fontFamily: 'var(--font-display)' }}>
              {user ? greeting(user.firstName) : 'Dashboard'}
            </h1>
            <p className="text-white/60 text-[14px] mt-2">
              Here&apos;s what&apos;s happening across the platform today.
            </p>
          </div>

          {overview && (
            <div className="flex flex-wrap gap-3 lg:shrink-0">
              {[
                { label: 'Users',        value: overview.totalUsers },
                { label: 'Applications', value: overview.totalApplications },
                { label: 'Approval rate',value: `${overview.successRate}%` },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 min-w-[100px]">
                  <div className="text-[11px] font-mono uppercase text-white/50">{s.label}</div>
                  <div className="text-[22px] font-bold text-white mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick nav */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          {[
            { label: 'Users',        path: '/admin/users' },
            { label: 'Applications', path: '/admin/applications' },
            { label: 'Programs',     path: '/admin/programs' },
            { label: 'Evidence',     path: '/admin/evidence' },
            { label: 'Analytics',    path: '/admin/analytics' },
          ].map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70 hover:text-white transition-colors">
              {l.label} <ArrowRight size={11} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat tiles ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[20px]" />)}
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<UsersThree size={20} weight="duotone" />}
            label="Total users"
            value={overview.totalUsers.toLocaleString()}
            sub={`+${overview.newUsersThisMonth} this month`}
            color="var(--color-forest-500)"
            trend="up"
          />
          <StatTile
            icon={<ClipboardText size={20} weight="duotone" />}
            label="Applications"
            value={overview.totalApplications.toLocaleString()}
            sub={`${overview.approvedApplications} approved`}
            color="var(--color-info)"
          />
          <StatTile
            icon={<SealCheck size={20} weight="duotone" />}
            label="Approval rate"
            value={`${overview.successRate}%`}
            sub={`${overview.rejectedApplications} rejected`}
            color="var(--color-sun)"
            trend={overview.successRate > 50 ? 'up' : 'down'}
          />
          <StatTile
            icon={<Binoculars size={20} weight="duotone" />}
            label="Active programs"
            value={overview.activePrograms}
            sub={`of ${overview.totalPrograms} total`}
            color="var(--color-terra-500)"
          />
        </div>
      )}

      {/* ── Second stat row ──────────────────────────────────────────────── */}
      {overview && !isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-forest-50)] flex items-center justify-center shrink-0">
              <ArrowUp size={14} className="text-[var(--color-forest-600)]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)]">New / month</p>
              <p className="text-[20px] font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {overview.newUsersThisMonth}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-terra-50)] flex items-center justify-center shrink-0">
              <ArrowDown size={14} className="text-[var(--color-terra-500)]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)]">Rejected</p>
              <p className="text-[20px] font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {overview.rejectedApplications}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <SealCheck size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)]">Pending evidence</p>
              <p className="text-[20px] font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                {overview.pendingEvidence}
              </p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3 cursor-pointer hover:bg-[var(--color-elev)] transition-colors"
            onClick={() => navigate('/admin/evidence')}>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-elev)] flex items-center justify-center shrink-0">
              <ArrowRight size={14} className="text-[var(--color-ink-mute)]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)]">Review evidence</p>
              <p className="text-[13px] font-semibold text-[var(--color-ink)]">Go to queue →</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <ChartCard title="Applications over time" subtitle="Last 6 months" className="lg:col-span-3">
          {byMonth ? (
            <div style={{ height: 240 }}>
              <ResponsiveLine
                data={lineData}
                theme={{
                  ...nivoTheme,
                  grid: { line: { stroke: '#f0ede8', strokeWidth: 1, strokeDasharray: '4 4' } },
                }}
                margin={{ top: 20, right: 24, bottom: 44, left: 44 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, nice: true }}
                curve="monotoneX"
                colors={[chartColors.green]}
                lineWidth={3}
                pointSize={0}
                enableArea
                areaBaselineValue={0}
                defs={[{
                  id:     'waveGrad',
                  type:   'linearGradient',
                  colors: [
                    { offset: 0,   color: chartColors.green, opacity: 0.35 },
                    { offset: 55,  color: chartColors.green, opacity: 0.08 },
                    { offset: 100, color: chartColors.green, opacity: 0 },
                  ],
                  gradientTransform: 'rotate(90)',
                }]}
                fill={[{ match: '*', id: 'waveGrad' }]}
                enableGridX={false}
                gridYValues={4}
                axisBottom={{ tickSize: 0, tickPadding: 10, tickRotation: -20 }}
                axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
                enableCrosshair
                crosshairType="x"
                useMesh
                layers={[
                  'grid', 'axes', 'areas', 'lines',
                  'crosshair', 'mesh',
                  ({ points }) => {
                    const last = points[points.length - 1]
                    if (!last) return null
                    return (
                      <g>
                        <circle cx={last.x} cy={last.y} r={11} fill={chartColors.green} fillOpacity={0.15} />
                        <circle cx={last.x} cy={last.y} r={6}  fill={chartColors.green} stroke="#fff" strokeWidth={2.5} />
                      </g>
                    )
                  },
                  'slices', 'legends',
                ]}
                tooltip={({ point }) => (
                  <div className="rounded-2xl px-4 py-3 shadow-[var(--shadow-pop)] text-xs min-w-[130px]"
                    style={{ background: 'var(--color-ink)' }}>
                    <p className="font-mono uppercase text-[10px] text-white/50 mb-1">{String(point.data.x)}</p>
                    <p className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {String(point.data.y)}
                    </p>
                    <p className="text-white/60 text-[11px] mt-0.5">applications</p>
                  </div>
                )}
              />
            </div>
          ) : <Skeleton className="h-[240px] rounded-xl mx-4" />}
        </ChartCard>

        <ChartCard title="Gender distribution" subtitle="All users" className="lg:col-span-2">
          {genderData.length ? (
            <div className="px-4 pt-2 pb-2">
              <DonutRingGroup items={genderData} />
            </div>
          ) : <Skeleton className="h-[120px] rounded-xl mx-4" />}
        </ChartCard>
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Review applications', sub: 'Manage pipeline', path: '/admin/applications', color: 'var(--color-forest-500)' },
          { label: 'Manage programs',     sub: 'Create & edit',   path: '/admin/programs',     color: 'var(--color-terra-500)' },
          { label: 'View analytics',      sub: 'Detailed charts', path: '/admin/analytics',    color: 'var(--color-sun)' },
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
