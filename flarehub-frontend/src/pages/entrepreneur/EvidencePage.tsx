import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash, DownloadSimple, CloudArrowUp } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/store/ui.store'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import type { ApiPaginated, Evidence, SignedUploadResult } from '@/types/api'

const ALLOWED = ['image/jpeg','image/png','image/webp','application/pdf','video/mp4','audio/mpeg','text/csv']
const MAX_BYTES = 50 * 1024 * 1024

export default function EvidencePage() {
  const [page, setPage]        = useState(1)
  const [uploading, setUpl]    = useState(false)
  const [deleteTarget, setDel] = useState<Evidence | null>(null)
  const [dragging, setDrag]    = useState(false)
  const inputRef               = useRef<HTMLInputElement>(null)
  const qc                     = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['evidence', page],
    queryFn:  () => api.get<ApiPaginated<Evidence>>('/evidence/me', { params: { page, limit: 12 } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/evidence/${id}`),
    onSuccess: () => {
      toast.success('Evidence deleted')
      qc.invalidateQueries({ queryKey: ['evidence'] })
      setDel(null)
    },
    onError: () => toast.error('Cannot delete', 'Only pending evidence can be deleted'),
  })

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) return toast.error('File type not allowed')
    if (file.size > MAX_BYTES) return toast.error('File too large', 'Maximum 50 MB')
    setUpl(true)
    try {
      const { data: signed } = await api.post<{ success: true; data: SignedUploadResult }>(
        '/storage/signed-upload-url',
        { bucket: 'evidence', filename: file.name, mimeType: file.type, fileSize: file.size }
      )
      await fetch(signed.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await api.post('/evidence', {
        fileName:    file.name,
        storagePath: signed.data.storagePath,
        fileSize:    file.size,
        mimeType:    file.type,
        fileType:    file.name.split('.').pop() ?? '',
      })
      toast.success('Evidence uploaded')
      qc.invalidateQueries({ queryKey: ['evidence'] })
    } catch {
      toast.error('Upload failed', 'Try again')
    } finally {
      setUpl(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Connect</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Evidence
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Upload supporting files for your milestones.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
          dragging
            ? 'border-[var(--color-forest-500)] bg-[var(--color-forest-50)]'
            : 'border-[var(--color-line)] hover:border-[var(--color-terra-500)]/50 hover:bg-[var(--color-terra-50)]/30'
        )}
      >
        {uploading
          ? <Spinner size="md" className="text-[var(--color-forest-500)]" />
          : <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center">
              <CloudArrowUp size={22} className="text-[var(--color-ink-mute)]" />
            </div>
        }
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[var(--color-ink)]">
            {uploading ? 'Uploading…' : 'Drop a file here, or click to browse'}
          </p>
          <p className="text-[12px] text-[var(--color-ink-faint)] mt-1">Images, PDF, video, audio, CSV · max 50 MB</p>
        </div>
        <input ref={inputRef} type="file" className="hidden"
          accept={ALLOWED.join(',')}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Evidence list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[20px]" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="card p-10 text-center dotted">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
            <Camera size={22} className="text-white" />
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">No evidence uploaded</div>
          <p className="text-[12px] text-[var(--color-ink-mute)] mt-1 max-w-xs mx-auto">
            Upload photos, receipts, reports, or any file that supports your milestone progress.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.data.map(ev => (
              <div key={ev.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[var(--color-ink)] truncate flex-1">{ev.fileName}</p>
                  <Badge variant={statusVariant(ev.status)}>{ev.status}</Badge>
                </div>
                <p className="text-[12px] text-[var(--color-ink-mute)]">
                  {formatFileSize(ev.fileSize)} · {formatDate(ev.uploadDate)}
                </p>
                {ev.notes && (
                  <p className="text-[11px] text-[var(--color-terra-600)] bg-[var(--color-terra-50)] px-2 py-1 rounded-lg">{ev.notes}</p>
                )}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--color-line)]">
                  {ev.downloadUrl && (
                    <a href={ev.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" icon={<DownloadSimple size={13} />}>Download</Button>
                    </a>
                  )}
                  {ev.status === 'pending' && (
                    <Button variant="ghost" size="sm" icon={<Trash size={13} />}
                      onClick={() => setDel(ev)} className="text-[var(--color-error)] ml-auto">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={12} onChange={setPage} />
        </>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDel(null)} title="Delete evidence" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDel(null)}>Keep it</Button>
            <Button variant="danger" loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </Button>
          </>
        }>
        <p className="text-sm text-[var(--color-ink-mute)]">
          This will permanently delete <strong className="text-[var(--color-ink)]">{deleteTarget?.fileName}</strong>. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
