import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveLine }   from '@nivo/line'
import { ResponsiveBar }    from '@nivo/bar'
import { ResponsiveRadar }  from '@nivo/radar'
import { CalendarBlank }    from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { ChartCard, nivoTheme, chartColors, LegendDot } from '@/components/ui/ChartCard'
import { HorizBarList, DonutRingGroup } from '@/components/ui/BarChart'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'
import type { ApiSuccess, ApiPaginated, Program } from '@/types/api'

interface MonthData      { month: string; count: number }
interface MentorActivity { name: string; mentees: number; meetings: number; completed: number }
interface ProgramProgress {
  programName:          string
  approvedParticipants: number
  submissions: Record<string, { submitted: number; notSubmitted: number; rate: number }>
  evidence:    { total: number; verified: number; pending: number; rejected: number }
}

const STATUS_COLORS: Record<string, string> = {
  Approved:    '#1d6f42',
  Pending:     '#b5720e',
  Rejected:    '#c4522a',
  UnderReview: '#64748b',
}

function PeriodToggle({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-[var(--color-elev)] rounded-xl">
      {[6, 12].map(mo => (
        <button
          key={mo}
          type="button"
          onClick={() => onChange(mo)}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-[10px] transition-all',
            value === mo
              ? 'bg-white text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-faint)] hover:text-[var(--color-ink-mute)]',
          )}
        >
          {mo}mo
        </button>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [months, setMonths]           = useState(6)
  const [selectedProgramId, setSelectedProgramId] = useState('')

  const { data: byMonth } = useQuery({
    queryKey: ['analytics', 'by-month', months],
    queryFn:  () => api.get<ApiSuccess<MonthData[]>>('/admin/analytics/applications-by-month', { params: { months } }).then(r => r.data.data),
  })
  const { data: genderRaw } = useQuery({
    queryKey: ['analytics', 'gender'],
    queryFn:  () => api.get<ApiSuccess<Record<string, number>>>('/admin/analytics/gender-distribution').then(r => r.data.data),
  })
  const { data: countyRaw } = useQuery({
    queryKey: ['analytics', 'county'],
    queryFn:  () => api.get<ApiSuccess<Array<{ county: string; count: number }>>>('/admin/analytics/county-distribution').then(r => r.data.data),
  })
  const { data: completion } = useQuery({
    queryKey: ['analytics', 'completion'],
    queryFn:  () => api.get<ApiSuccess<Record<string, { submitted: number; notSubmitted: number }>>>('/admin/analytics/submission-completion').then(r => r.data.data),
  })
  const { data: mentorActivity } = useQuery({
    queryKey: ['analytics', 'mentor-activity'],
    queryFn:  () => api.get<ApiSuccess<MentorActivity[]>>('/admin/analytics/mentor-activity').then(r => r.data.data),
  })

  const { data: businessStageRaw } = useQuery({
    queryKey: ['analytics', 'business-stage'],
    queryFn:  () => api.get<ApiSuccess<Record<string, number>>>('/admin/analytics/business-stage').then(r => r.data.data),
  })

  const { data: appStatusRaw } = useQuery({
    queryKey: ['analytics', 'application-status'],
    queryFn:  () => api.get<ApiSuccess<Record<string, number>>>('/admin/analytics/application-status').then(r => r.data.data),
  })

  const { data: programs } = useQuery({
    queryKey: ['programs-list-analytics'],
    queryFn:  () => api.get<ApiPaginated<Program>>('/programs', { params: { limit: 100 } }).then(r => r.data.data),
  })

  const { data: programProgress } = useQuery({
    queryKey: ['analytics', 'program-progress', selectedProgramId],
    queryFn:  () =>
      api.get<ApiSuccess<ProgramProgress>>(`/admin/analytics/program-progress/${selectedProgramId}`).then(r => r.data.data),
    enabled: !!selectedProgramId,
  })

  const PALETTE = [chartColors.green, chartColors.terra, chartColors.amber, chartColors.slate]

  const lineData = byMonth ? [{ id: 'Applications', data: byMonth.map(d => ({ x: d.month, y: d.count })) }] : []

  const genderItems = genderRaw
    ? Object.entries(genderRaw).map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }))
    : []
  const totalGender = genderItems.reduce((n, d) => n + d.value, 0)

  const countyItems = countyRaw?.slice(0, 8).map((d, i) => ({
    label: d.county,
    value: d.count,
    color: `rgba(29,111,66,${1 - (i / 8) * 0.45})`,
  })) ?? []

  const radarData = completion
    ? Object.entries(completion).map(([key, v]) => ({
        submission: key.replace(/([A-Z])/g, ' $1').trim(),
        Submitted:  v.submitted,
        Pending:    v.notSubmitted,
      }))
    : []

  const stageItems = businessStageRaw
    ? Object.entries(businessStageRaw).map(([label, value], i) => ({
        label, value,
        color: [chartColors.green, chartColors.amber, chartColors.terra, chartColors.slate][i % 4],
      }))
    : []
  const totalStage = stageItems.reduce((n, d) => n + d.value, 0)

  const appStatusItems = appStatusRaw
    ? Object.entries(appStatusRaw).map(([label, value]) => ({
        label, value,
        color: STATUS_COLORS[label] ?? chartColors.slate,
      }))
    : []

  const programProgressBarData = programProgress
    ? Object.entries(programProgress.submissions).map(([key, v]) => ({
        category:    key.replace(/([A-Z])/g, ' $1').trim(),
        Submitted:   v.submitted,
        Outstanding: v.notSubmitted,
      }))
    : []

  return (
    <>
      <PageHeader title="Analytics" subtitle="Platform-wide data and trends." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <ChartCard
          title="Applications over time"
          subtitle={`Last ${months} months`}
          className="lg:col-span-8"
          trailing={<PeriodToggle value={months} onChange={setMonths} />}
        >
          {byMonth ? (
            <div style={{ height: 260 }}>
              <ResponsiveLine
                data={lineData}
                theme={{
                  ...nivoTheme,
                  grid: { line: { stroke: '#f0ede8', strokeWidth: 1, strokeDasharray: '4 4' } },
                }}
                margin={{ top: 24, right: 32, bottom: 48, left: 44 }}
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
                axisBottom={{ tickSize: 0, tickPadding: 12, tickRotation: -20 }}
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
                        <circle
                          cx={last.x}
                          cy={last.y}
                          r={6}
                          fill={chartColors.green}
                          stroke="#fff"
                          strokeWidth={2.5}
                        />
                        <circle
                          cx={last.x}
                          cy={last.y}
                          r={11}
                          fill={chartColors.green}
                          fillOpacity={0.15}
                        />
                      </g>
                    )
                  },
                  'slices', 'legends',
                ]}
                tooltip={({ point }) => (
                  <div className="rounded-2xl px-4 py-3 shadow-[var(--shadow-pop)] text-xs min-w-[140px]"
                    style={{ background: 'var(--color-ink)', border: 'none' }}>
                    <p className="font-mono uppercase text-[10px] text-white/50 mb-1">{String(point.data.x)}</p>
                    <p className="text-[20px] font-bold text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {String(point.data.y)}
                    </p>
                    <p className="text-white/60 text-[11px] mt-0.5">applications</p>
                  </div>
                )}
              />
            </div>
          ) : <Skeleton height={260} />}
        </ChartCard>

        <ChartCard
          title="Gender breakdown"
          subtitle={`${totalGender} total users`}
          className="lg:col-span-4"
        >
          {genderItems.length ? (
            <div className="px-4 pt-2 pb-2">
              <DonutRingGroup items={genderItems} />
            </div>
          ) : <Skeleton height={140} className="mx-4" />}
        </ChartCard>

        <ChartCard title="Top counties" subtitle="Users by location" className="lg:col-span-6">
          {countyItems.length ? (
            <div className="px-4 pt-2 pb-2">
              <HorizBarList data={countyItems} unit=" users" />
            </div>
          ) : countyRaw ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-[var(--color-ink-faint)]">No county data yet</p>
            </div>
          ) : <Skeleton height={200} className="mx-4" />}
        </ChartCard>

        <ChartCard
          title="Submission completion"
          subtitle="Submitted vs outstanding"
          className="lg:col-span-6"
          trailing={
            <div className="flex items-center gap-3">
              <LegendDot color={chartColors.green} label="Submitted" />
              <LegendDot color={chartColors.soft}  label="Pending" />
            </div>
          }
        >
          {radarData.length ? (
            <div style={{ height: 240 }}>
              <ResponsiveRadar
                data={radarData}
                theme={nivoTheme}
                keys={['Submitted', 'Pending']}
                indexBy="submission"
                margin={{ top: 36, right: 80, bottom: 36, left: 80 }}
                colors={[chartColors.green, '#d4cfc9']}
                fillOpacity={0.22}
                blendMode="multiply"
                dotSize={7}
                dotColor={{ from: 'color' }}
                dotBorderWidth={2}
                dotBorderColor="#fff"
                gridShape="linear"
                gridLevels={4}
                gridLabelOffset={12}
              />
            </div>
          ) : <Skeleton height={240} />}
        </ChartCard>

        <ChartCard
          title="Mentor activity"
          subtitle="Completion rate per mentor"
          className="lg:col-span-12"
          trailing={
            <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-ink-faint)]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--color-forest-500)] inline-block" />completed</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--color-elev)] border border-[var(--color-line)] inline-block" />scheduled</span>
            </div>
          }
        >
          {mentorActivity ? (
            mentorActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center">
                  <CalendarBlank size={20} className="text-[var(--color-ink-faint)]" />
                </div>
                <p className="text-sm text-[var(--color-ink-faint)]">No mentors assigned yet</p>
              </div>
            ) : (
              <div className="px-4 py-2 space-y-4">
                {/* Column headers */}
                <div className="flex items-center gap-4 pb-2 border-b border-[var(--color-line)]">
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] w-8 shrink-0" />
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] w-32 shrink-0">Mentor</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] w-20 shrink-0 text-center">Mentees</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] w-20 shrink-0 text-center">Meetings</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] flex-1">Completion rate</span>
                  <span className="text-[10px] font-mono uppercase text-[var(--color-ink-faint)] w-10 text-right shrink-0">Rate</span>
                </div>
                {mentorActivity.map((m, idx) => {
                  const rate = m.meetings > 0 ? Math.round((m.completed / m.meetings) * 100) : 0
                  const initials = m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const bgColors = ['var(--color-forest-50)', 'var(--color-terra-50)', '#fef3c7', 'var(--color-elev)']
                  const textColors = ['var(--color-forest-600)', 'var(--color-terra-600)', '#92400e', 'var(--color-ink-mute)']
                  return (
                    <div key={m.name} className="flex items-center gap-4 group">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                        style={{ background: bgColors[idx % 4], color: textColors[idx % 4] }}>
                        {initials}
                      </div>
                      {/* Name */}
                      <span className="text-[13px] font-medium text-[var(--color-ink)] w-32 truncate shrink-0">{m.name}</span>
                      {/* Mentees */}
                      <div className="w-20 shrink-0 flex justify-center">
                        <span className="chip text-[var(--color-forest-700)] border-[var(--color-forest-100)] bg-[var(--color-forest-50)]">
                          {m.mentees}
                        </span>
                      </div>
                      {/* Meetings */}
                      <div className="w-20 shrink-0 flex justify-center">
                        <span className="chip text-[var(--color-ink-mute)] border-[var(--color-line)]">
                          {m.meetings} / {m.completed}
                        </span>
                      </div>
                      {/* Completion bar */}
                      <div className="flex-1 min-w-0">
                        <div className="relative h-2.5 rounded-full bg-[var(--color-elev)] overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${rate}%`,
                              background: rate >= 75
                                ? 'var(--color-forest-500)'
                                : rate >= 40
                                  ? 'var(--color-sun)'
                                  : 'var(--color-terra-500)',
                            }}
                          />
                        </div>
                      </div>
                      {/* Rate */}
                      <span className="text-[12px] font-mono font-semibold w-10 text-right shrink-0"
                        style={{
                          color: rate >= 75
                            ? 'var(--color-forest-600)'
                            : rate >= 40
                              ? '#92400e'
                              : 'var(--color-terra-600)',
                        }}>
                        {rate}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          ) : <Skeleton height={200} />}
        </ChartCard>

        {/* ── Business Stage & Application Status ───────────────────────── */}
        <ChartCard
          title="Business stage"
          subtitle={`${totalStage} entrepreneurs`}
          className="lg:col-span-4"
        >
          {stageItems.length ? (
            <div className="px-4 pt-2 pb-2">
              <DonutRingGroup items={stageItems} />
            </div>
          ) : businessStageRaw ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-[var(--color-ink-faint)]">No stage data yet</p>
            </div>
          ) : <Skeleton height={140} className="mx-4" />}
        </ChartCard>

        <ChartCard
          title="Application status"
          subtitle="Breakdown by review stage"
          className="lg:col-span-8"
        >
          {appStatusItems.length ? (
            <div className="px-4 pt-2 pb-2">
              <HorizBarList data={appStatusItems} unit=" apps" />
            </div>
          ) : appStatusRaw ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-[var(--color-ink-faint)]">No applications yet</p>
            </div>
          ) : <Skeleton height={140} className="mx-4" />}
        </ChartCard>

        {/* ── Program Progress ───────────────────────────────────────────── */}
        <ChartCard
          title="Program progress"
          subtitle={programProgress ? programProgress.programName : 'Select a program to see submission breakdown'}
          className="lg:col-span-12"
          trailing={
            programs?.length ? (
              <select
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
                className="h-8 px-2.5 text-xs rounded-xl border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] text-[var(--color-ink)]"
              >
                <option value="">Select program…</option>
                {programs.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            ) : null
          }
        >
          {!selectedProgramId ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center">
                <span className="text-[18px]">📊</span>
              </div>
              <p className="text-sm text-[var(--color-ink-faint)]">Choose a program above to see submission progress</p>
            </div>
          ) : !programProgress ? (
            <Skeleton height={220} />
          ) : programProgressBarData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <p className="text-sm text-[var(--color-ink-faint)]">No approved participants yet</p>
            </div>
          ) : (
            <>
              <div style={{ height: 220 }}>
                <ResponsiveBar
                  data={programProgressBarData}
                  theme={nivoTheme}
                  keys={['Submitted', 'Outstanding']}
                  indexBy="category"
                  groupMode="grouped"
                  margin={{ top: 16, right: 24, bottom: 40, left: 90 }}
                  colors={[chartColors.green, chartColors.soft]}
                  borderRadius={4}
                  enableLabel={false}
                  enableGridX={false}
                  gridYValues={4}
                  axisBottom={{ tickSize: 0, tickPadding: 10, tickRotation: -15 }}
                  axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
                  tooltip={({ id, value, indexValue, color }) => (
                    <div className="bg-white border border-[var(--color-line)] rounded-xl px-3 py-2 shadow-[var(--shadow-pop)] text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="font-medium text-[var(--color-ink)]">{String(indexValue)}</span>
                      <span className="text-[var(--color-ink-faint)]">{String(id)}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center justify-center gap-4 pb-1">
                <LegendDot color={chartColors.green} label="Submitted" />
                <LegendDot color={chartColors.soft}  label="Outstanding" />
                <p className="text-[11px] text-[var(--color-ink-faint)] ml-2">
                  {programProgress.approvedParticipants} approved participants
                </p>
              </div>
            </>
          )}
        </ChartCard>

      </div>
    </>
  )
}

