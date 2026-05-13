import { useRef, useState } from 'react'
import { Upload } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/lib/api'
import type { SignedUploadResult } from '@/types/api'

interface FileUploadZoneProps {
  bucket:       string
  accept?:      string[]
  maxBytes?:    number
  onUploaded:   (storagePath: string, file: File) => void
  className?:   string
  hint?:        string
}

export function FileUploadZone({
  bucket,
  accept,
  maxBytes = 50 * 1024 * 1024,
  onUploaded,
  className,
  hint,
}: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = async (file: File) => {
    setError(null)
    if (accept && !accept.includes(file.type)) {
      setError('File type not allowed')
      return
    }
    if (file.size > maxBytes) {
      setError(`File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB)`)
      return
    }
    setUploading(true)
    try {
      const { data: signed } = await api.post<{ success: true; data: SignedUploadResult }>(
        '/storage/signed-upload-url',
        { bucket, filename: file.name, mimeType: file.type, fileSize: file.size },
      )
      await fetch(signed.data.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })
      onUploaded(signed.data.storagePath, file)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); e.dataTransfer.files[0] && handle(e.dataTransfer.files[0]) }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[var(--radius-lg)] p-8 flex flex-col items-center justify-center gap-2',
          'cursor-pointer transition-colors',
          dragging
            ? 'border-[var(--color-green-500)] bg-[var(--color-green-50)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-elevated)]',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {uploading
          ? <Spinner size="md" className="text-[var(--color-green-500)]" />
          : <Upload size={22} className="text-[var(--color-text-muted)]" />}
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {uploading ? 'Uploading...' : 'Drop a file here, or click to browse'}
        </p>
        {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept?.join(',')}
          onChange={e => e.target.files?.[0] && handle(e.target.files[0])}
        />
      </div>
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  )
}
