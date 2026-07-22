import { useState } from 'react'
import type { FormField as FormFieldType, FieldResponseValue } from '@/types/applicationForm'
import { FieldWrapper } from './FieldWrapper'
import { inputCls } from './FieldWrapper'
import { cn } from '@/lib/utils'
import { Star, UploadSimple, Image, VideoCamera } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import type { SignedUploadResult } from '@/types/api'

interface Props {
  field:    FormFieldType
  value:    FieldResponseValue | undefined
  error?:   string
  onChange: (value: FieldResponseValue) => void
}

export function FormField({ field, value, error, onChange }: Props) {
  const id = `field-${field.id}`

  // Checkbox renders its own label inline — bypasses FieldWrapper to avoid duplication
  if (field.type === 'checkbox') {
    const checked = value === true
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none group">
          <div
            className={cn(
              'mt-0.5 w-5 h-5 rounded-[var(--radius-sm)] border-2 flex items-center justify-center shrink-0',
              'transition-all duration-[var(--duration-fast)]',
              checked
                ? 'bg-[var(--color-green-500)] border-[var(--color-green-500)]'
                : error
                ? 'border-[var(--color-error)]'
                : 'border-[var(--color-border)] group-hover:border-[var(--color-green-500)]',
            )}
          >
            <input
              id={id}
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
              aria-invalid={!!error}
            />
            {checked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="space-y-0.5 pt-px">
            <span className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
              {field.label}
              {field.required && (
                <span aria-hidden className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)] align-middle" />
              )}
            </span>
            {field.description && (
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{field.description}</p>
            )}
          </div>
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-[var(--color-error)] flex items-center gap-1">
            <span aria-hidden>●</span> {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <FieldWrapper
      fieldId={id}
      label={field.label}
      description={field.description}
      required={field.required}
      error={error}
    >
      <FieldInput id={id} field={field} value={value} error={error} onChange={onChange} />
    </FieldWrapper>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function FieldInput({ id, field, value, error, onChange }: Props & { id: string }) {
  const [fileUploading, setFileUploading] = useState(false)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)

  const uploadFileToStorage = async (file: File) => {
    setFileUploading(true)
    setFileUploadError(null)
    try {
      const { data: signed } = await api.post<{ success: true; data: SignedUploadResult }>(
        '/storage/signed-upload-url',
        { bucket: 'submissions', filename: file.name, mimeType: file.type, fileSize: file.size },
      )
      await fetch(signed.data.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })
      onChange({ fileName: file.name, filePath: signed.data.storagePath, mimeType: file.type, sizeBytes: file.size })
    } catch {
      setFileUploadError('Upload failed — please try again')
      // Leave the field empty so auto-save does not send invalid data
    } finally {
      setFileUploading(false)
    }
  }

  const errCls = error
    ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[inset_3px_0_0_var(--color-error),0_0_0_3px_rgba(185,28,28,0.08)]'
    : ''

  switch (field.type) {

    // ── Short text ────────────────────────────────────────────────────────
    case 'short_text':
    case 'email':
    case 'phone':
      return (
        <input
          id={id}
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'h-10', errCls)}
          maxLength={field.validation.maxLength}
          aria-invalid={!!error}
        />
      )

    // ── Long text ─────────────────────────────────────────────────────────
    case 'long_text':
      return (
        <textarea
          id={id}
          rows={4}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'py-2.5 resize-none', errCls)}
          maxLength={field.validation.maxLength}
          aria-invalid={!!error}
        />
      )

    // ── Number ────────────────────────────────────────────────────────────
    case 'number':
      return (
        <input
          id={id}
          type="number"
          value={typeof value === 'number' ? value : ''}
          placeholder={field.placeholder ?? '0'}
          onChange={(e) => onChange(e.target.value === '' ? '' as unknown as FieldResponseValue : Number(e.target.value))}
          className={cn(inputCls, 'h-10', errCls)}
          min={field.validation.minValue}
          max={field.validation.maxValue}
          aria-invalid={!!error}
        />
      )

    // ── Date ──────────────────────────────────────────────────────────────
    case 'date':
      return (
        <input
          id={id}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'h-10', errCls)}
          min={field.validation.minDate}
          max={field.validation.maxDate}
          aria-invalid={!!error}
        />
      )

    // ── Single choice ─────────────────────────────────────────────────────
    case 'single_choice':
      return (
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {(field.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'px-4 py-2 text-sm rounded-[var(--radius-full)] border-2 font-medium',
                'transition-all duration-[var(--duration-fast)]',
                value === opt.value
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-green-500)] hover:text-[var(--color-green-600)]',
                error && value !== opt.value && 'border-[var(--color-error)]/40',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )

    // ── Multiple choice ───────────────────────────────────────────────────
    case 'multiple_choice': {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="space-y-2.5">
          {(field.options ?? []).map((opt) => {
            const checked = selected.includes(opt.value)
            return (
              <label
                key={opt.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer',
                  'transition-all duration-[var(--duration-fast)]',
                  checked
                    ? 'bg-[var(--color-green-50)] border-[var(--color-green-500)]'
                    : 'bg-white border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    checked
                      ? 'bg-[var(--color-green-500)] border-[var(--color-green-500)]'
                      : 'bg-white border-[var(--color-border)]',
                  )}
                >
                  {checked && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value)
                    onChange(next)
                  }}
                  className="sr-only"
                />
                <span className="text-sm text-[var(--color-text-primary)]">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )
    }

    // ── Dropdown ──────────────────────────────────────────────────────────
    case 'dropdown':
      return (
        <select
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'h-10 cursor-pointer', errCls)}
          aria-invalid={!!error}
        >
          <option value="">Choose an option…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )

    // ── Yes / No ──────────────────────────────────────────────────────────
    case 'yes_no':
      return (
        <div className="flex gap-3">
          {([true, false] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                'flex-1 py-3 text-sm font-semibold rounded-[var(--radius-lg)] border-2',
                'transition-all duration-[var(--duration-fast)]',
                value === v
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)]'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-green-500)]',
                error && 'border-[var(--color-error)]/40',
              )}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      )

    // ── Rating ────────────────────────────────────────────────────────────
    case 'rating': {
      const max    = field.validation.maxValue ?? 5
      const rating = typeof value === 'number' ? value : 0
      return (
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                'w-10 h-10 rounded-[var(--radius-md)] text-sm font-bold border-2',
                'transition-all duration-[var(--duration-fast)]',
                n <= rating
                  ? 'bg-[var(--color-green-500)] text-white border-[var(--color-green-500)] scale-105'
                  : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-green-500)] hover:text-[var(--color-green-600)]',
              )}
              aria-label={`Rate ${n} out of ${max}`}
            >
              <Star
                size={16}
                weight={n <= rating ? 'fill' : 'regular'}
                className="mx-auto"
              />
            </button>
          ))}
        </div>
      )
    }

    // ── File / Image / Video upload ───────────────────────────────────────
    case 'file_upload':
    case 'image_upload':
    case 'video_upload': {
      const accept =
        field.type === 'image_upload' ? 'image/*'
        : field.type === 'video_upload' ? 'video/*'
        : (field.validation.allowedMimeTypes ?? []).join(',') || '*/*'

      const Icon =
        field.type === 'image_upload' ? Image
        : field.type === 'video_upload' ? VideoCamera
        : UploadSimple

      const hasFile = value && typeof value === 'object' && !Array.isArray(value) && 'fileName' in value

      return (
        <>
          <label
            className={cn(
              'flex flex-col items-center justify-center gap-3 py-8 px-4',
              'rounded-[var(--radius-xl)] border-2 border-dashed cursor-pointer',
              'transition-all duration-[var(--duration-default)]',
              hasFile
                ? 'border-[var(--color-green-500)] bg-[var(--color-green-50)]'
                : fileUploadError
                ? 'border-[var(--color-error)]/50 hover:border-[var(--color-error)]'
                : error
                ? 'border-[var(--color-error)]/50 hover:border-[var(--color-error)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-green-500)] hover:bg-[var(--color-green-50)]',
            )}
          >
            <input
              id={id}
              type="file"
              accept={accept}
              className="sr-only"
              disabled={fileUploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setFileUploadError(null)
                uploadFileToStorage(file)
              }}
            />
            {fileUploading ? (
              <Spinner size="md" className="text-[var(--color-green-500)]" />
            ) : (
              <Icon size={28} weight="duotone" className={hasFile ? 'text-[var(--color-green-500)]' : fileUploadError ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'} />
            )}
            {fileUploading ? (
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-green-600)]">Uploading…</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Please wait</p>
              </div>
            ) : hasFile ? (
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-green-600)]">
                  {(value as { fileName: string }).fileName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {field.type === 'image_upload' ? 'Upload an image'
                   : field.type === 'video_upload' ? 'Upload a video'
                   : 'Upload a file'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {field.validation.maxFileSizeMB
                    ? `Max ${field.validation.maxFileSizeMB} MB`
                    : 'Click to browse'}
                </p>
              </div>
            )}
          </label>
          {fileUploadError && (
            <p role="alert" className="text-xs font-medium text-[var(--color-error)] mt-1.5 flex items-center gap-1">
              <span aria-hidden>●</span> {fileUploadError}
            </p>
          )}
        </>
      )
    }

    default:
      return null
  }
}
