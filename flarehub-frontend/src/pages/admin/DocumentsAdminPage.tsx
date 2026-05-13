import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlass, DownloadSimple, FileText, CheckCircle, Clock, X } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess } from '@/types/api'

type DocStatus = 'Pending' | 'Reviewed' | 'NeedsRevision' | 'Approved'
type DocCategory = 'milestone' | 'survey' | 'smart_goals' | 'market_research' | 'customer_feedback'

interface AdminDocument {
  id:               number
  originalName:     string
  fileSize:         number
  fileType:         string
  documentCategory: DocCategory
  status:           DocStatus
  description:      string | null
  priority:         'low' | 'medium' | 'high' | 'urgent'
  uploadedAt:       string
  downloadUrl:      string | null
  user:             { id: string; firstName: string; lastName: string; email: string }
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  Pending:       { label: 'Pending',        color: 'var(--color-sun)',          bg: 'var(--color-terra-50)' },
  Reviewed:      { label: 'Reviewed',       color: 'var(--color-info)',         bg: '#e0f0ff' },
  NeedsRevision: { label: 'Needs Revision', color: 'var(--color-terra-600)',    bg: 'var(--color-terra-50)' },
  Approved:      { label: 'Approved',       color: 'var(--color-forest-600)',   bg: 'var(--color-forest-50)' },
}

const STATUSES: DocStatus[] = ['Pending', 'Reviewed', 'NeedsRevision', 'Approved']

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function StatusDot({ status }: { status: DocStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}>
      {status === 'Approved' ? <CheckCircle size={11} weight="fill" /> : <Clock size={11} />}
      {cfg.label}
    </span>
  )
}

export default function DocumentsAdminPage() {
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<DocStatus | ''>('')
  const [catFilter, setCat]       = useState<DocCategory | ''>('')
  const [target, setTarget]       = useState<AdminDocument | null>(null)
  const [newStatus, setNewStatus] = useState<DocStatus>('Reviewed')
  const [notes, setNotes]         = useState('')
  const debounced                 = useDebounce(search)
  const qc                        = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'documents', page, debounced, statusFilter, catFilter],
    queryFn:  () => api.get<ApiPaginated<AdminDocument>>('/documents', {
      params: {
        page, limit: 20,
        search:           debounced || undefined,
        status:           statusFilter || undefined,
        documentCategory: catFilter   || undefined,
      },
    }).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: DocStatus; notes: string }) =>
      api.patch<ApiSuccess<AdminDocument>>(`/documents/${id}/status`, { status, notes: notes || undefined })
        .then(r => r.data),
    onSuccess: () => {
      toast.success('Document status updated')
      qc.invalidateQueries({ queryKey: ['admin', 'documents'] })
      setTarget(null)
      setNotes('')
    },
    onError: () => toast.error('Could not update status'),
  })

  const openReview = (doc: AdminDocument) => {
    setTarget(doc)
    setNewStatus(doc.status === 'Pending' ? 'Reviewed' : doc.status)
    setNotes('')
  }

  const pendingCount = data?.data.filter(d => d.status === 'Pending').length ?? 0

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Admin · Flarehub</p>
          <h1 className="text-[32px] font-bold text-[var(--color-ink)] leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Documents
          </h1>
          {data && (
            <p className="text-[14px] text-[var(--color-ink-mute)] mt-1">
              {data.meta.total} total
              {pendingCount > 0 && <span className="ml-2 text-[var(--color-terra-600)] font-semibold">· {pendingCount} pending review</span>}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-mute)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search documents or users…"
            className="w-full h-10 pl-9 pr-4 text-[13px] rounded-xl border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] placeholder:text-[var(--color-ink-mute)] transition-colors"
          />
        </div>
        <NativeSelect value={statusFilter} onChange={e => { setStatus(e.target.value as DocStatus | ''); setPage(1) }} className="w-44">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </NativeSelect>
        <NativeSelect value={catFilter} onChange={e => { setCat(e.target.value as DocCategory | ''); setPage(1) }} className="w-44">
          <option value="">All categories</option>
          <option value="milestone">Milestone</option>
          <option value="survey">Survey</option>
          <option value="smart_goals">Smart Goals</option>
          <option value="market_research">Market Research</option>
          <option value="customer_feedback">Customer Feedback</option>
        </NativeSelect>
        {(statusFilter || catFilter || search) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setCat(''); setPage(1) }}
            className="flex items-center gap-1 text-[12px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[20px]" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center mb-3">
            <FileText size={22} className="text-[var(--color-ink-faint)]" />
          </div>
          <p className="text-[14px] font-medium text-[var(--color-ink-mute)]">No documents found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-elev)]">
                  {['Document', 'Uploaded by', 'Category', 'Size', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold font-mono uppercase text-[var(--color-ink-mute)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {data.data.map(doc => (
                  <tr key={doc.id} className="hover:bg-[var(--color-elev)] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-elev)] flex items-center justify-center shrink-0">
                          <FileText size={15} className="text-[var(--color-ink-mute)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate max-w-[200px]">
                            {doc.originalName}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-faint)]">{formatDate(doc.uploadedAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar firstName={doc.user.firstName} lastName={doc.user.lastName} size="sm" />
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-ink)]">
                            {doc.user.firstName} {doc.user.lastName}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-faint)]">{doc.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-[var(--color-ink-mute)] capitalize">
                        {doc.documentCategory.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-mono text-[var(--color-ink-mute)]">
                      {fmtSize(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={doc.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openReview(doc)}>
                          Review
                        </Button>
                        {doc.downloadUrl && (
                          <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" icon={<DownloadSimple size={13} />}>
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
              total={data.meta.total} limit={20} onChange={setPage} />
          )}
        </>
      )}

      {/* Review modal */}
      <Modal
        open={!!target}
        onClose={() => { setTarget(null); setNotes('') }}
        title="Review document"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setTarget(null); setNotes('') }}>Cancel</Button>
            <Button
              loading={updateStatus.isPending}
              onClick={() => target && updateStatus.mutate({ id: target.id, status: newStatus, notes })}
            >
              Save
            </Button>
          </>
        }
      >
        {target && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-elev)]">
              <FileText size={18} className="text-[var(--color-ink-mute)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{target.originalName}</p>
                <p className="text-[11px] text-[var(--color-ink-faint)]">
                  {target.user.firstName} {target.user.lastName} · {fmtSize(target.fileSize)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">New status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-semibold transition-all text-left',
                      newStatus === s
                        ? 'border-[var(--color-forest-500)] bg-[var(--color-forest-50)] text-[var(--color-forest-700)]'
                        : 'border-[var(--color-line)] text-[var(--color-ink-mute)] hover:bg-[var(--color-elev)]',
                    )}
                  >
                    <StatusDot status={s} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-1.5">Notes (optional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add review notes for the user…"
                rows={3}
                className="w-full px-3 py-2 text-[13px] rounded-xl border border-[var(--color-line)] bg-[var(--color-elev)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] outline-none focus:border-[var(--color-forest-500)] resize-none transition-colors"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
