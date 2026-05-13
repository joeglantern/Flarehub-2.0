import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MagnifyingGlass, DownloadSimple, Star, ArrowSquareOut, CheckSquare, Square, X } from '@phosphor-icons/react'
import { ApplicationDrawer } from '@/components/application-drawer/ApplicationDrawer'
import { IllustrationApplications } from '@/components/illustrations/IllustrationApplications'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { NativeSelect } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import type { ApiPaginated, ApiSuccess, Application, ApplicationStatus, ApplicationScore } from '@/types/api'

const STATUSES: ApplicationStatus[] = ['Pending', 'UnderReview', 'Approved', 'Rejected']

const scoreSchema = z.object({
  innovation:      z.number().min(1, 'Min 1').max(10, 'Max 10'),
  feasibility:     z.number().min(1, 'Min 1').max(10, 'Max 10'),
  impact:          z.number().min(1, 'Min 1').max(10, 'Max 10'),
  teamStrength:    z.number().min(1, 'Min 1').max(10, 'Max 10'),
  marketPotential: z.number().min(1, 'Min 1').max(10, 'Max 10'),
  notes:           z.string().optional(),
})
type ScoreForm = z.infer<typeof scoreSchema>

const SCORE_FIELDS: { key: keyof ScoreForm; label: string }[] = [
  { key: 'innovation',      label: 'Innovation'       },
  { key: 'feasibility',     label: 'Feasibility'      },
  { key: 'impact',          label: 'Impact'           },
  { key: 'teamStrength',    label: 'Team strength'    },
  { key: 'marketPotential', label: 'Market potential' },
]

async function exportCSV(search: string, status: string) {
  try {
    const response = await api.get('/applications/export', {
      responseType: 'blob',
      params: { search: search || undefined, status: status || undefined },
    })
    const blob = new Blob([response.data], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'applications.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast.error('Could not export CSV')
  }
}

export default function ApplicationsPage() {
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState<ApplicationStatus | ''>('')
  const [target, setTarget]       = useState<{ app: Application; newStatus: ApplicationStatus } | null>(null)
  const [scoreTarget, setScore]   = useState<Application | null>(null)
  const [drawerApp, setDrawer]    = useState<Application | null>(null)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('UnderReview')
  const [exportLoading, setExportLoading] = useState(false)
  const debounced                 = useDebounce(search)
  const qc                        = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'applications', page, debounced, status],
    queryFn:  () => api.get<ApiPaginated<Application>>('/applications', {
      params: { page, limit: 20, search: debounced || undefined, status: status || undefined },
    }).then(r => r.data),
  })

  const existingScore = useQuery({
    queryKey: ['application-score', scoreTarget?.id],
    queryFn:  () =>
      api.get<ApiSuccess<ApplicationScore | null>>(`/applications/${scoreTarget!.id}/score`)
        .then(r => r.data.data),
    enabled: !!scoreTarget,
  })

  const { register, handleSubmit: handleScoreSubmit, formState: { errors, isSubmitting }, reset } = useForm<ScoreForm>({
    resolver: zodResolver(scoreSchema),
    values:   existingScore.data ? {
      innovation:      existingScore.data.innovation,
      feasibility:     existingScore.data.feasibility,
      impact:          existingScore.data.impact,
      teamStrength:    existingScore.data.teamStrength,
      marketPotential: existingScore.data.marketPotential,
      notes:           existingScore.data.notes ?? '',
    } : undefined,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      api.patch(`/applications/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      toast.success('Application updated')
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      setTarget(null)
    },
    onError: () => toast.error('Update failed'),
  })

  const onSaveScore = handleScoreSubmit((d) => saveScore.mutate(d))

  const saveScore = useMutation({
    mutationFn: (data: ScoreForm) =>
      api.post(`/applications/${scoreTarget!.id}/score`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Score saved')
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      qc.invalidateQueries({ queryKey: ['application-score', scoreTarget?.id] })
      setScore(null)
      reset()
    },
    onError: () => toast.error('Could not save score'),
  })

  const bulkUpdate = useMutation({
    mutationFn: (applicationIds: number[]) =>
      api.patch('/applications/bulk-status', { applicationIds, status: bulkStatus }).then(r => r.data),
    onSuccess: () => {
      toast.success(`${selected.size} application(s) updated`)
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      setSelected(new Set())
    },
    onError: () => toast.error('Bulk update failed'),
  })

  const totalScore = (s: ApplicationScore) =>
    s.innovation + s.feasibility + s.impact + s.teamStrength + s.marketPotential

  const allIds        = data?.data.map(a => a.id) ?? []
  const allSelected   = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected  = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleExport = async () => {
    setExportLoading(true)
    await exportCSV(search, status)
    setExportLoading(false)
  }

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle={data ? `${data.meta.total} total` : ''}
        actions={
          <Button variant="secondary" size="sm" icon={<DownloadSimple size={14} />}
            loading={exportLoading}
            onClick={handleExport}>
            Export CSV
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <Input
          placeholder="Search applicants..."
          leftIcon={<MagnifyingGlass size={15} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
          fullWidth={false}
        />
        <NativeSelect
          value={status}
          onChange={e => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1) }}
          className="w-44"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </NativeSelect>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={56} />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState illustration={<IllustrationApplications />} heading="No applications"
          body="No applications match your filters." />
      ) : (
        <>
          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-3 px-4 py-2.5 mb-2 rounded-xl bg-[var(--color-ink)] text-white text-sm">
              <span className="font-semibold">{selected.size} selected</span>
              <span className="flex-1" />
              <NativeSelect
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as ApplicationStatus)}
                className="w-40 h-8 text-sm text-[var(--color-ink)] rounded-lg"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </NativeSelect>
              <Button
                size="sm"
                loading={bulkUpdate.isPending}
                onClick={() => bulkUpdate.mutate([...selected])}
                className="bg-white text-[var(--color-ink)] hover:bg-white/90"
              >
                Apply
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1 text-white/70 hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <Card padding="none" className="overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-elev)]">
                  <th className="px-4 py-2.5 w-10">
                    <button onClick={toggleAll} className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition">
                      {allSelected
                        ? <CheckSquare size={16} weight="fill" className="text-[var(--color-forest-600)]" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  {['Applicant', 'Program', 'Applied', 'Score', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => setDrawer(app)}
                    className={`border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-elev)] cursor-pointer group transition-colors ${selected.has(app.id) ? 'bg-[var(--color-forest-50)]' : ''}`}
                  >
                    <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleOne(app.id)} className="text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition">
                        {selected.has(app.id)
                          ? <CheckSquare size={16} weight="fill" className="text-[var(--color-forest-600)]" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-forest-600)] transition-colors">
                        {app.user?.firstName} {app.user?.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-faint)]">{app.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-mute)]">{app.program?.name}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">{formatDate(app.appliedAt)}</td>
                    <td className="px-4 py-3">
                      {app.score ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-warning)]">
                          <Star size={12} weight="fill" />
                          {totalScore(app.score)}/50
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-ink-faint)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" icon={<Star size={13} />}
                          onClick={() => { setScore(app); reset() }}>
                          Score
                        </Button>
                        <Button variant="ghost" size="sm" icon={<ArrowSquareOut size={13} />}
                          onClick={() => setDrawer(app)}>
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={20} onChange={setPage} />
        </>
      )}

      {/* ── Status change confirm ─────────────────────────────────── */}
      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        size="sm"
        title={`Mark as ${target?.newStatus}`}
        description={`Change status for ${target?.app.user?.firstName}'s application to "${target?.newStatus}"?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
            <Button
              loading={updateStatus.isPending}
              onClick={() => target && updateStatus.mutate({ id: target.app.id, status: target.newStatus })}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-ink-mute)]">
          The applicant will be notified by email and in-app.
        </p>
      </Modal>

      {/* ── Application detail drawer ────────────────────────────── */}
      <ApplicationDrawer
        app={drawerApp}
        onClose={() => setDrawer(null)}
      />

      {/* ── Score drawer ──────────────────────────────────────────── */}
      <Drawer
        open={!!scoreTarget}
        onClose={() => { setScore(null); reset() }}
        title={`Score — ${scoreTarget?.user?.firstName} ${scoreTarget?.user?.lastName}`}
        footer={
          <Button
            loading={isSubmitting || saveScore.isPending}
            onClick={onSaveScore}
          >
            Save score
          </Button>
        }
      >
        <div className="space-y-4">
          {existingScore.data && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-forest-50)] border border-[var(--color-forest-100)]">
              <Star size={14} weight="fill" className="text-[var(--color-warning)]" />
              <p className="text-sm font-medium text-[var(--color-forest-700)]">
                Current total: {totalScore(existingScore.data)}/50
              </p>
            </div>
          )}

          <p className="text-xs text-[var(--color-ink-faint)]">
            Rate each criterion from 1 (lowest) to 10 (highest).
          </p>

          {SCORE_FIELDS.map(f => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              placeholder="1–10"
              error={errors[f.key]?.message}
              {...register(f.key, { valueAsNumber: true })}
            />
          ))}

          <Textarea
            label="Notes"
            placeholder="Optional scoring notes..."
            rows={3}
            {...register('notes')}
          />
        </div>
      </Drawer>
    </>
  )
}
