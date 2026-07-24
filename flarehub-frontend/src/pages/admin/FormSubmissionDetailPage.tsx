import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, DownloadSimple, Star, EnvelopeSimple, Phone,
  MapPin, Buildings, ArrowSquareOut,
  CheckCircle, Clock, XCircle, Spinner,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import { MediaPreview } from '@/components/submission-review/MediaPreview'
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
  const answeredCount = section.fields.filter(f => {
    const val = fields[f.id]
    return val !== undefined && val !== null && val !== ''
  }).length

  if (!section.fields.length) return null

  return (
    <Card>
      <CardHeader className="mb-5">
        <CardTitle className="text-sm">{section.title}</CardTitle>
        <span className="text-[11px] font-mono text-[var(--color-ink-faint)]">
          {answeredCount}/{section.fields.length} answered
        </span>
      </CardHeader>

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
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FormSubmissionDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['form-submission', id],
    queryFn:  () =>
      api.get<ApiSuccess<SubmissionDetail>>(`/admin/form-submissions/${id}`)
        .then(r => r.data.data),
  })

  useEffect(() => {
    if (data) document.title = `${data.user.firstName} ${data.user.lastName}'s submission — Afosihub`
    return () => { document.title = 'Afosihub' }
  }, [data])

  const changeStatus = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      api.patch(`/applications/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['form-submission', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'form-submissions'] })
    },
    onError: () => toast.error('Could not update status'),
  })

  const handleExport = async () => {
    if (!data) return
    try {
      const res = await api.get('/admin/form-submissions/export', {
        responseType: 'blob',
        params: { applicationId: data.id },
      })
      const disposition = res.headers['content-disposition'] as string | undefined
      const match        = disposition?.match(/filename="(.+)"/)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = match?.[1] ?? `submission-${data.id}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      toast.error('Export failed')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height={32} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton height={320} />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton height={200} />
            <Skeleton height={200} />
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
          onClick={() => navigate('/admin/form-submissions')}>
          Back to submissions
        </Button>
        <Button variant="secondary" size="sm" icon={<DownloadSimple size={14} />} onClick={handleExport}>
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left col: applicant sidebar ───────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar
                src={data.user.profilePic}
                firstName={data.user.firstName}
                lastName={data.user.lastName}
                size="xl"
              />
              <div>
                <h1 className="font-bold text-[15px] text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {data.user.firstName} {data.user.lastName}
                </h1>
                <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{data.program.name}</p>
              </div>
              <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-line)] space-y-2.5 text-sm">
              <a href={`mailto:${data.user.email}`} className="flex items-center gap-2 text-[var(--color-ink-mute)] hover:text-[var(--color-forest-600)] transition-colors">
                <EnvelopeSimple size={13} className="shrink-0" />
                <span className="truncate">{data.user.email}</span>
              </a>
              {data.user.phone && (
                <a href={`tel:${data.user.phone}`} className="flex items-center gap-2 text-[var(--color-ink-mute)] hover:text-[var(--color-forest-600)] transition-colors">
                  <Phone size={13} className="shrink-0" />
                  {data.user.phone}
                </a>
              )}
              {data.user.county && (
                <div className="flex items-center gap-2 text-[var(--color-ink-mute)]">
                  <MapPin size={13} className="shrink-0" />
                  {data.user.county}
                </div>
              )}
              {data.user.businessName && (
                <div className="flex items-center gap-2 text-[var(--color-ink-mute)]">
                  <Buildings size={13} className="shrink-0" />
                  {data.user.businessName}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-line)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">Applied</span>
                <span className="text-[var(--color-ink)]">{formatDate(data.appliedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">Submitted</span>
                <span className="text-[var(--color-ink)]">{formatDate(data.submittedAt)}</span>
              </div>
            </div>

            <a
              href={`/admin/users/${data.user.id}`}
              className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition-colors"
            >
              <ArrowSquareOut size={13} />
              View applicant profile
            </a>
          </Card>

          {/* ── Status ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <div className="flex flex-col gap-1.5">
              {STATUS_ORDER.map(s => {
                const meta   = STATUS_META[s]
                const active = data.status === s
                const Icon   = meta.icon
                return (
                  <button
                    key={s}
                    disabled={active || changeStatus.isPending}
                    onClick={() => changeStatus.mutate(s)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] border transition-all text-left',
                      active
                        ? meta.cls + ' cursor-default'
                        : 'bg-transparent border-[var(--color-line)] text-[var(--color-ink-mute)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]',
                    )}
                  >
                    <Icon size={14} />
                    {s}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* ── Score ──────────────────────────────────────────────── */}
          {data.score && (
            <Card>
              <CardHeader><CardTitle>Score</CardTitle></CardHeader>
              <div className="flex items-center gap-1.5 mb-3">
                <Star size={16} weight="fill" className="text-amber-400" />
                <span className="text-lg font-bold text-[var(--color-ink)]">{data.score.totalScore}</span>
                <span className="text-xs text-[var(--color-ink-faint)]">/ 50</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ['Innovation', data.score.innovation],
                  ['Feasibility', data.score.feasibility],
                  ['Impact', data.score.impact],
                  ['Team strength', data.score.teamStrength],
                  ['Market potential', data.score.marketPotential],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-[var(--color-ink-mute)]">{label}</span>
                    <span className="text-[var(--color-ink)] font-medium">{val}/10</span>
                  </div>
                ))}
              </div>
              {data.score.notes && (
                <p className="mt-3 pt-3 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-mute)] italic">
                  {data.score.notes}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* ── Right col: form responses ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {(data.formSchema.sections ?? []).map(section => (
            <SectionBlock
              key={section.id}
              section={section}
              fields={data.responses.fields}
            />
          ))}
        </div>
      </div>
    </>
  )
}
