import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MagnifyingGlass, DownloadSimple, X, CalendarBlank,
  EnvelopeSimple, CheckCircle, ArrowRight,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubmissionReviewDrawer } from '@/components/submission-review/SubmissionReviewDrawer'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess, ApplicationStatus, Program } from '@/types/api'

interface SubmissionRow {
  id:          number
  status:      ApplicationStatus
  submittedAt: string | null
  appliedAt:   string
  fieldCount:  number
  user: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
    county:    string | null
  }
  program: { id: number; name: string }
}

const STATUSES: ApplicationStatus[] = ['Pending', 'UnderReview', 'Approved', 'Rejected']

async function triggerExport(params: Record<string, string | undefined>) {
  try {
    const res = await api.get('/admin/form-submissions/export', {
      responseType: 'blob',
      params,
    })
    const blob = new Blob([res.data], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = 'form-submissions.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  } catch {
    toast.error('Export failed')
  }
}

export default function FormSubmissionsPage() {
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState<ApplicationStatus | ''>('')
  const [programId, setProgramId] = useState('')
  const [activeId, setActiveId]   = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const debounced                 = useDebounce(search)

  // Programs that have a form (for filter dropdown)
  const programs = useQuery({
    queryKey: ['admin', 'programs-with-forms'],
    queryFn:  () =>
      api.get<ApiPaginated<Program>>('/programs', { params: { limit: 100 } })
        .then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const formPrograms = (programs.data?.data ?? []).filter(p => p.hasApplicationForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'form-submissions', page, debounced, status, programId],
    queryFn:  () =>
      api.get<ApiPaginated<SubmissionRow>>('/admin/form-submissions', {
        params: {
          page,
          limit:     20,
          search:    debounced  || undefined,
          status:    status     || undefined,
          programId: programId  || undefined,
        },
      }).then(r => r.data),
  })

  const hasFilters = !!(programId || status || search)

  const clearFilters = () => {
    setProgramId('')
    setStatus('')
    setSearch('')
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    await triggerExport({
      search:    debounced || undefined,
      status:    status    || undefined,
      programId: programId || undefined,
    })
    setExporting(false)
  }

  return (
    <>
      <PageHeader
        title="Form Submissions"
        subtitle={data ? `${data.meta.total} total` : undefined}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<DownloadSimple size={14} />}
            loading={exporting}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        }
      />

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search applicants…"
          leftIcon={<MagnifyingGlass size={15} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
          fullWidth={false}
        />
        <NativeSelect
          value={programId}
          onChange={e => { setProgramId(e.target.value); setPage(1) }}
          className="w-56"
        >
          <option value="">All programs</option>
          {formPrograms.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={status}
          onChange={e => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1) }}
          className="w-44"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </NativeSelect>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState
          heading="No submissions yet"
          body={hasFilters ? 'No submissions match your filters.' : 'Submissions from form-builder programs will appear here.'}
        />
      ) : (
        <>
          <Card padding="none" className="overflow-x-auto mb-5">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-elev)]">
                  {['Applicant', 'Program', 'Submitted', 'Fields', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setActiveId(row.id)}
                    className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-elev)] cursor-pointer group transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-forest-600)] transition-colors leading-tight">
                        {row.user.firstName} {row.user.lastName}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-faint)] mt-0.5">
                        <EnvelopeSimple size={11} />
                        {row.user.email}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--color-ink-mute)]">
                      {row.program.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                        <CalendarBlank size={12} />
                        {formatDate(row.submittedAt ?? row.appliedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-mute)]">
                        <CheckCircle size={12} className="text-[var(--color-forest-500)]" />
                        {row.fieldCount} fields
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-mute)] group-hover:text-[var(--color-forest-600)] transition-colors">
                        Review
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={20}
            onChange={setPage}
          />
        </>
      )}

      {/* ── Review drawer ─────────────────────────────────────────────── */}
      <SubmissionReviewDrawer
        submissionId={activeId}
        onClose={() => setActiveId(null)}
      />
    </>
  )
}
