import { useState } from 'react'
import { ArrowSquareOut, DownloadSimple, FilePdf, File, X } from '@phosphor-icons/react'
import type { FileResponseValue } from '@/types/applicationForm'

interface Props {
  file:      FileResponseValue
  fieldType: 'file_upload' | 'image_upload' | 'video_upload'
}

function formatBytes(bytes: number) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function isPdf(file: FileResponseValue) {
  return file.mimeType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf')
}

function isImage(file: FileResponseValue) {
  return file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.fileName)
}

function isVideo(file: FileResponseValue) {
  return file.mimeType?.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.fileName)
}

export function MediaPreview({ file, fieldType }: Props) {
  const [lightbox, setLightbox] = useState(false)
  const [pdfOpen, setPdfOpen]   = useState(false)

  if (!file?.fileName) {
    return <span className="text-sm text-[var(--color-ink-faint)] italic">No file</span>
  }

  const url = file.filePath

  // ── Image ─────────────────────────────────────────────────────────────────
  if (fieldType === 'image_upload' || isImage(file)) {
    return (
      <>
        <div className="space-y-2">
          <div
            className="relative w-full max-w-sm rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-line)] cursor-zoom-in bg-[var(--color-elev)]"
            onClick={() => setLightbox(true)}
          >
            <img
              src={url}
              alt={file.fileName}
              className="w-full h-48 object-cover transition-transform duration-200 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
                View full size
              </span>
            </div>
          </div>
          <FileMeta file={file} url={url} />
        </div>

        {lightbox && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition"
              onClick={() => setLightbox(false)}
            >
              <X size={20} />
            </button>
            <img
              src={url}
              alt={file.fileName}
              className="max-h-[90vh] max-w-[90vw] rounded-[var(--radius-xl)] object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}
      </>
    )
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  if (fieldType === 'video_upload' || isVideo(file)) {
    return (
      <div className="space-y-2">
        <div className="rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-line)] bg-black max-w-sm">
          <video
            src={url}
            controls
            preload="metadata"
            className="w-full max-h-64 object-contain"
          />
        </div>
        <FileMeta file={file} url={url} />
      </div>
    )
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (isPdf(file)) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setPdfOpen(v => !v)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-elev)] hover:bg-[var(--color-inset)] transition-colors text-sm font-medium text-[var(--color-ink)]"
        >
          <FilePdf size={18} className="text-[var(--color-terra-500)] shrink-0" />
          <span className="truncate max-w-[220px]">{file.fileName}</span>
          <span className="text-[var(--color-ink-faint)] text-xs shrink-0">{formatBytes(file.sizeBytes)}</span>
          <span className="ml-1 text-[var(--color-ink-faint)] text-xs">{pdfOpen ? '▲ Hide' : '▼ Preview'}</span>
        </button>

        {pdfOpen && url && (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-line)] overflow-hidden">
            <iframe
              src={url}
              title={file.fileName}
              className="w-full h-[520px]"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-forest-600)] hover:underline"
            >
              <ArrowSquareOut size={13} />
              Open in new tab
            </a>
          )}
          {url && (
            <a
              href={url}
              download={file.fileName}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
            >
              <DownloadSimple size={13} />
              Download
            </a>
          )}
        </div>
      </div>
    )
  }

  // ── Generic file ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-elev)] max-w-sm">
        <File size={20} className="text-[var(--color-ink-mute)] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-ink)] truncate">{file.fileName}</p>
          <p className="text-xs text-[var(--color-ink-faint)]">{formatBytes(file.sizeBytes)}</p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[var(--color-ink-mute)] hover:text-[var(--color-forest-600)] transition-colors rounded-lg hover:bg-[var(--color-forest-50)]"
          >
            <ArrowSquareOut size={15} />
          </a>
        )}
      </div>
    </div>
  )
}

function FileMeta({ file, url }: { file: FileResponseValue; url: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-ink-faint)]">{file.fileName}</span>
      <span className="text-xs text-[var(--color-ink-faint)]">{formatBytes(file.sizeBytes)}</span>
      {url && (
        <a
          href={url}
          download={file.fileName}
          className="inline-flex items-center gap-1 text-xs text-[var(--color-forest-600)] hover:underline"
        >
          <DownloadSimple size={12} />
          Download
        </a>
      )}
    </div>
  )
}
