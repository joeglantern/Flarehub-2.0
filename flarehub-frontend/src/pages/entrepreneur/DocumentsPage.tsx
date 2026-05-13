import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Upload, DownloadSimple, Trash, FilePdf, FileDoc } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/ui.store'
import { formatDate, formatFileSize, cn } from '@/lib/utils'
import type { ApiPaginated, Document, SignedUploadResult } from '@/types/api'

const ALLOWED = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function DocumentsPage() {
  const [page, setPage]     = useState(1)
  const [uploading, setUpl] = useState(false)
  const [dragging, setDrag] = useState(false)
  const inputRef            = useRef<HTMLInputElement>(null)
  const qc                  = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page],
    queryFn:  () => api.get<ApiPaginated<Document>>('/documents/me', { params: { page, limit: 12 } }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}`),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['documents'] }) },
  })

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) return toast.error('Only PDF and Word documents allowed')
    if (file.size > 50 * 1024 * 1024) return toast.error('File too large', 'Maximum 50 MB')
    setUpl(true)
    try {
      const { data: signed } = await api.post<{ success: true; data: SignedUploadResult }>(
        '/storage/signed-upload-url',
        { bucket: 'documents', filename: file.name, mimeType: file.type, fileSize: file.size }
      )
      await fetch(signed.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await api.post('/documents', { originalName: file.name, storagePath: signed.data.storagePath, fileSize: file.size, fileType: file.type })
      toast.success('Document uploaded')
      qc.invalidateQueries({ queryKey: ['documents'] })
    } catch { toast.error('Upload failed') }
    finally { setUpl(false) }
  }

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1100px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Connect</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Documents
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Upload business plans, pitch decks, and supporting files.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[20px] p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
          dragging
            ? 'border-[var(--color-forest-500)] bg-[var(--color-forest-50)]'
            : 'border-[var(--color-line)] hover:border-[var(--color-terra-500)]/50 hover:bg-[var(--color-terra-50)]/30'
        )}>
        {uploading
          ? <Spinner size="md" className="text-[var(--color-forest-500)]" />
          : <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center">
              <Upload size={22} className="text-[var(--color-ink-mute)]" />
            </div>
        }
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[var(--color-ink)]">
            {uploading ? 'Uploading…' : 'Drop a PDF or Word file, or click to browse'}
          </p>
          <p className="text-[12px] text-[var(--color-ink-faint)] mt-1">PDF and .docx files · max 50 MB</p>
        </div>
        <input ref={inputRef} type="file" className="hidden" accept={ALLOWED.join(',')}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px] rounded-[20px]" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="card p-10 text-center dotted">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
            <FolderOpen size={22} className="text-white" />
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">No documents yet</div>
          <p className="text-[12px] text-[var(--color-ink-mute)] mt-1">
            Upload your business plan or pitch deck to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.data.map(doc => (
              <div key={doc.id} className="card p-4 flex items-center gap-3">
                {doc.fileType === 'application/pdf'
                  ? <FilePdf size={24} weight="fill" className="text-[var(--color-error)] shrink-0" />
                  : <FileDoc size={24} weight="fill" className="text-[var(--color-info)] shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--color-ink)] truncate">{doc.originalName}</p>
                  <p className="text-[12px] text-[var(--color-ink-mute)]">{formatFileSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}</p>
                </div>
                <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                {doc.downloadUrl && (
                  <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" icon={<DownloadSimple size={13} />} />
                  </a>
                )}
                <Button variant="ghost" size="sm" icon={<Trash size={13} />}
                  onClick={() => deleteMut.mutate(doc.id)} className="text-[var(--color-error)]" />
              </div>
            ))}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={12} onChange={setPage} />
        </>
      )}
    </div>
  )
}
