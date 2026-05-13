import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SealCheck, SealWarning, CheckSquare, Square } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from '@/store/ui.store'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import type { ApiPaginated, Evidence, EvidenceStatus } from '@/types/api'

export default function EvidenceReviewPage() {
  const [page, setPage]       = useState(1)
  const [notes, setNotes]     = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkNotes, setBulkNotes] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'evidence', page],
    queryFn:  () => api.get<ApiPaginated<Evidence>>('/evidence', {
      params: { page, limit: 12, status: 'pending' },
    }).then(r => r.data),
  })

  const review = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: EvidenceStatus; note?: string }) =>
      api.patch(`/evidence/${id}/status`, { status, notes: note }).then(r => r.data),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'verified' ? 'Evidence verified' : 'Evidence rejected')
      qc.invalidateQueries({ queryKey: ['admin', 'evidence'] })
    },
    onError: () => toast.error('Review failed'),
  })

  const bulkReview = useMutation({
    mutationFn: ({ status, note }: { status: EvidenceStatus; note?: string }) =>
      api.patch('/evidence/bulk-status', {
        ids:    [...selected],
        status,
        notes:  note || undefined,
      }).then(r => r.data),
    onSuccess: (_, vars) => {
      toast.success(`${selected.size} items ${vars.status === 'verified' ? 'verified' : 'rejected'}`)
      setSelected(new Set())
      setBulkNotes('')
      qc.invalidateQueries({ queryKey: ['admin', 'evidence'] })
    },
    onError: () => toast.error('Bulk review failed'),
  })

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!data?.data) return
    if (selected.size === data.data.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.data.map(e => e.id)))
    }
  }

  const allSelected = !!data?.data.length && selected.size === data.data.length

  return (
    <>
      <PageHeader title="Evidence Review" subtitle="Review and verify pending evidence uploads." />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={180} />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<SealCheck size={28} />} heading="All caught up" body="No pending evidence to review." />
      ) : (
        <>
          {/* Select all + bulk action bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
            >
              {allSelected
                ? <CheckSquare size={18} className="text-[var(--color-forest-500)]" />
                : <Square size={18} />}
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>

            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-ink-faint)]">{selected.size} selected</span>
                <input
                  value={bulkNotes}
                  onChange={e => setBulkNotes(e.target.value)}
                  placeholder="Notes (optional)…"
                  className="h-8 px-3 text-xs rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] w-48"
                />
                <Button
                  size="sm"
                  icon={<SealCheck size={13} />}
                  disabled={bulkReview.isPending}
                  onClick={() => bulkReview.mutate({ status: 'verified', note: bulkNotes })}
                >
                  Verify all
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<SealWarning size={13} />}
                  disabled={bulkReview.isPending}
                  onClick={() => bulkReview.mutate({ status: 'rejected', note: bulkNotes })}
                >
                  Reject all
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {data.data.map(ev => (
              <Card
                key={ev.id}
                className={cn(
                  'flex flex-col gap-3 cursor-pointer transition-shadow',
                  selected.has(ev.id) && 'ring-2 ring-[var(--color-forest-500)]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelect(ev.id)}
                    className="mt-0.5 shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-forest-500)] transition-colors"
                  >
                    {selected.has(ev.id)
                      ? <CheckSquare size={18} className="text-[var(--color-forest-500)]" />
                      : <Square size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">{ev.fileName}</p>
                    <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                      {formatFileSize(ev.fileSize)} · {formatDate(ev.uploadDate)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(ev.status)}>{ev.status}</Badge>
                </div>
                {ev.downloadUrl && (
                  <a href={ev.downloadUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[var(--color-forest-500)] hover:underline">View file</a>
                )}
                <Textarea
                  placeholder="Notes for the user..."
                  rows={2}
                  value={notes[ev.id] ?? ''}
                  onChange={e => setNotes(n => ({ ...n, [ev.id]: e.target.value }))}
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" icon={<SealCheck size={14} />}
                    onClick={() => review.mutate({ id: ev.id, status: 'verified', note: notes[ev.id] })}>
                    Verify
                  </Button>
                  <Button size="sm" variant="danger" icon={<SealWarning size={14} />}
                    onClick={() => review.mutate({ id: ev.id, status: 'rejected', note: notes[ev.id] })}>
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={12} onChange={setPage} />
        </>
      )}
    </>
  )
}
