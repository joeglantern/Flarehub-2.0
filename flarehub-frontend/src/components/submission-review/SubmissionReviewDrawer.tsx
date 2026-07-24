import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, DownloadSimple, Star, EnvelopeSimple, Phone,
  MapPin, Buildings, CalendarBlank, ArrowSquareOut,
  CheckCircle, Clock, XCircle, Spinner,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/ui.store'
import { MediaPreview } from './MediaPreview'
import type { ApiSuccess, ApplicationStatus } from '@/types/api'
import type { FormSchema, FormSection, FormField, FieldResponseValue, FileResponseValue, FieldType } from '@/types/applicationForm'

interface SubmissionDetail {
  id:           number
  status:       ApplicationStatus
  submittedAt:  string | null
  appliedAt:    string
  adminComment: string | null
  user: {
    id:            string
    firstName:     string
    lastName:      string
    email:         string
    phone:         string | null
    county:        string | null
    gender:        string | null
    businessName:  string | null
    businessStage: string | null
    profilePic:    string | null
  }
  program:    { id: number; name: string }
  formSchema: FormSchema
  responses:  { version: 1; fields: Record<string, FieldResponseValue> }
  score:      null | {
    innovation: number; feasibility: number; impact: number
    teamStrength: number; marketPotential: number; totalScore: number; notes: string | null
  }
}

const STATUS_ORDER: ApplicationStatus[] = ['Pending', 'UnderReview', 'Approved', 'Rejected']

const STATUS_META: Record<ApplicationStatus, { icon: typeof CheckCircle; cls: string }> = {
  Pending:     { icon: Clock,        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  UnderReview: { icon: Spinner,      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  Approved:    { icon: CheckCircle,  cls: 'bg-[var(--color-forest-50)] text-[var(--color-forest-600)] border-[var(--color-forest-100)]' },
  Rejected:    { icon: XCircle,      cls: 'bg-red-50 text-red-600 border-red-100' },
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isFileValue(v: unknown): v is FileResponseValue {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'fileName' in v
}

function isMediaField(type: FieldType) {
  return type === 'image_upload' || type === 'video_upload' || type === 'file_upload'
}

// ── Inline value renderer ─────────────────────────────────────────────────────

function FieldValue({ field, value }: { field: FormField; value: FieldResponseValue | undefined }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-sm text-[var(--color-ink-faint)] italic">No answer</span>
  }

  if (isMediaField(field.type) && isFileValue(value)) {
    return (
      <MediaPreview
        file={value}
        fieldType={field.type as 'file_upload' | 'image_upload' | 'video_upload'}
      />
    )
  }

  switch (field.type) {
    case 'checkbox':
      return (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
          value === true
            ? 'bg-[var(--color-forest-50)] text-[var(--color-forest-600)] border-[var(--color-forest-100)]'
            : 'bg-[var(--color-elev)] text-[var(--color-ink-mute)] border-[var(--color-line)]',
        )}>
          {value === true ? '✓ Checked' : '✗ Unchecked'}
        </span>
      )

    case 'yes_no':
      return (
        <span className={cn(
          'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border',
          value === true
            ? 'bg-[var(--color-forest-50)] text-[var(--color-forest-600)] border-[var(--color-forest-100)]'
            : 'bg-red-50 text-red-600 border-red-100',
        )}>
          {value === true ? 'Yes' : 'No'}
        </span>
      )

    case 'rating': {
      const max    = field.validation.maxValue ?? 5
      const rating = typeof value === 'number' ? value : 0
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <Star key={n} size={15} weight={n <= rating ? 'fill' : 'regular'}
              className={n <= rating ? 'text-amber-400' : 'text-[var(--color-border)]'} />
          ))}
          <span className="ml-1.5 text-xs text-[var(--color-ink-faint)]">{rating} / {max}</span>
        </div>
      )
    }

    case 'single_choice': {
      const opt = field.options?.find(o => o.value === value)
      return (
        <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-[var(--color-elev)] border border-[var(--color-line)] text-[var(--color-ink)]">
          {opt?.label ?? String(value)}
        </span>
      )
    }

    case 'multiple_choice': {
      const vals = Array.isArray(value) ? value : []
      if (!vals.length) return <span className="text-sm text-[var(--color-ink-faint)] italic">None selected</span>
      return (
        <div className="flex flex-wrap gap-1.5">
          {vals.map(v => {
            const opt = field.options?.find(o => o.value === v)
            return (
              <span key={v} className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--color-forest-50)] text-[var(--color-forest-600)] border border-[var(--color-forest-100)]">
                {opt?.label ?? v}
              </span>
            )
          })}
        </div>
      )
    }

    case 'dropdown': {
      const opt = field.options?.find(o => o.value === value)
      return <span className="text-sm text-[var(--color-ink)]">{opt?.label ?? String(value)}</span>
    }

    case 'date':
      return (
        <span className="text-sm text-[var(--color-ink)]">
          {new Date(String(value)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      )

    case 'long_text':
      return <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{String(value)}</p>

    case 'email':
      return (
        <a href={`mailto:${String(value)}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-forest-600)] hover:underline">
          <EnvelopeSimple size={13} />
          {String(value)}
        </a>
      )

    case 'phone':
      return (
        <a href={`tel:${String(value)}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-forest-600)] hover:underline">
          <Phone size={13} />
          {String(value)}
        </a>
      )

    default:
      return <span className="text-sm text-[var(--color-ink)]">{String(value)}</span>
  }
}

// ── Section block ─────────────────────────────────────────────────────────────

function SectionBlock({ section, fields }: { section: FormSection; fields: Record<string, FieldResponseValue> }) {
  const visible = section.fields.filter(f => {
    const val = fields[f.id]
    return val !== undefined && val !== null && val !== ''
  })

  if (!visible.length) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)]">
          {section.title}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)]" />
      </div>

      <div className="space-y-5">
        {section.fields.map(field => {
          const value = fields[field.id]
          const empty = value === undefined || value === null || value === ''
          return (
            <div key={field.id}>
              <p className="text-[11px] font-semibold text-[var(--color-ink-faint)] uppercase tracking-wide mb-1.5">
                {field.label}
                {field.required && <span className="ml-1 text-[var(--color-terra-500)]">*</span>}
              </p>
              {empty
                ? <span className="text-sm text-[var(--color-ink-faint)] italic">Not answered</span>
                : <FieldValue field={field} value={value} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main drawer ───────────────────────────────────────────────────────────────

interface DrawerProps {
  submissionId: number | null
  onClose:      () => void
  onStatusChange?: () => void
}

export function SubmissionReviewDrawer({ submissionId, onClose, onStatusChange }: DrawerProps) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['form-submission', submissionId],
    queryFn:  () =>
      api.get<ApiSuccess<SubmissionDetail>>(`/admin/form-submissions/${submissionId}`)
        .then(r => r.data.data),
    enabled: !!submissionId,
  })

  const changeStatus = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      api.patch(`/applications/${submissionId}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['form-submission', submissionId] })
      qc.invalidateQueries({ queryKey: ['admin', 'form-submissions'] })
      onStatusChange?.()
    },
    onError: () => toast.error('Could not update status'),
  })

  const handleExport = async () => {
    if (!data) return
    try {
      const res = await api.get(`/admin/form-submissions/export`, {
        responseType: 'blob',
        params: { programId: data.program.id },
      })
      const blob = new Blob([res.data], { type: 'text/csv' })
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `submission-${data.id}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      toast.error('Export failed')
    }
  }

  const open = !!submissionId

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-xl bg-[var(--color-paper)] shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {!data && isLoading ? (
          <DrawerSkeleton onClose={onClose} />
        ) : !data ? null : (
          <>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="relative px-6 pt-6 pb-5 border-b border-[var(--color-line)] shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] hover:bg-[var(--color-elev)] transition"
              >
                <X size={18} />
              </button>

              {/* Applicant identity */}
              <div className="flex items-start gap-4 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-ink)] text-white flex items-center justify-center text-lg font-bold shrink-0 select-none">
                  {data.user.firstName[0]}{data.user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-[var(--color-ink)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {data.user.firstName} {data.user.lastName}
                  </h2>
                  <p className="text-sm text-[var(--color-ink-mute)] mt-0.5">{data.program.name}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
                    <span className="text-xs text-[var(--color-ink-faint)]">
                      Submitted {formatDate(data.submittedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Applicant meta row */}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                  <EnvelopeSimple size={12} />
                  <a href={`mailto:${data.user.email}`} className="hover:text-[var(--color-forest-600)] hover:underline transition-colors">
                    {data.user.email}
                  </a>
                </span>
                {data.user.phone && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                    <Phone size={12} />
                    <a href={`tel:${data.user.phone}`} className="hover:text-[var(--color-forest-600)] hover:underline transition-colors">
                      {data.user.phone}
                    </a>
                  </span>
                )}
                {data.user.county && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                    <MapPin size={12} />
                    {data.user.county}
                  </span>
                )}
                {data.user.businessName && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                    <Buildings size={12} />
                    {data.user.businessName}
                  </span>
                )}
              </div>

              {/* Status quick-change */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[var(--color-ink-faint)] font-mono uppercase tracking-wider mr-1">Status:</span>
                {STATUS_ORDER.map(s => {
                  const meta    = STATUS_META[s]
                  const active  = data.status === s
                  const Icon    = meta.icon
                  return (
                    <button
                      key={s}
                      disabled={active || changeStatus.isPending}
                      onClick={() => changeStatus.mutate(s)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-all',
                        active
                          ? meta.cls + ' cursor-default'
                          : 'bg-transparent border-[var(--color-line)] text-[var(--color-ink-mute)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
                      )}
                    >
                      <Icon size={11} />
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Score strip (if scored) ──────────────────────────── */}
            {data.score && (
              <div className="px-6 py-3 border-b border-[var(--color-line)] bg-[var(--color-elev)] shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star size={14} weight="fill" className="text-amber-400" />
                    <span className="text-sm font-bold text-[var(--color-ink)]">{data.score.totalScore}/50</span>
                    <span className="text-xs text-[var(--color-ink-faint)] ml-2">
                      Innovation {data.score.innovation} · Feasibility {data.score.feasibility} · Impact {data.score.impact} · Team {data.score.teamStrength} · Market {data.score.marketPotential}
                    </span>
                  </div>
                </div>
                {data.score.notes && (
                  <p className="mt-1 text-xs text-[var(--color-ink-mute)] italic">{data.score.notes}</p>
                )}
              </div>
            )}

            {/* ── Responses ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {(data.formSchema.sections ?? []).map(section => (
                <SectionBlock
                  key={section.id}
                  section={section}
                  fields={data.responses.fields}
                />
              ))}
            </div>

            {/* ── Footer ───────────────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-[var(--color-line)] flex items-center justify-between shrink-0 bg-[var(--color-paper)]">
              <a
                href={`/admin/users/${data.user.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
              >
                <ArrowSquareOut size={13} />
                View applicant profile
              </a>
              <Button
                variant="secondary"
                size="sm"
                icon={<DownloadSimple size={14} />}
                onClick={handleExport}
              >
                Export
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function DrawerSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="px-6 pt-6 pb-5 border-b border-[var(--color-line)] shrink-0">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-ink-mute)]">
          <X size={18} />
        </button>
        <div className="flex items-start gap-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-[var(--color-elev)] animate-pulse" />
            <div className="h-3 w-28 rounded bg-[var(--color-elev)] animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex-1 px-6 py-6 space-y-6">
        {[120, 80, 160, 100].map((w, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 rounded bg-[var(--color-elev)] animate-pulse" style={{ width: w / 2 }} />
            <div className="h-4 rounded bg-[var(--color-elev)] animate-pulse" style={{ width: w }} />
          </div>
        ))}
      </div>
    </>
  )
}
