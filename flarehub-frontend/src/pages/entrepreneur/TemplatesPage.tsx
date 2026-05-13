import { useQuery } from '@tanstack/react-query'
import { DownloadSimple, FilePdf, FileDoc } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiSuccess, AdminTemplate } from '@/types/api'

const typeLabels: Record<string, string> = {
  smart_goals:       'SMART Goals',
  milestone:         'Milestone Plan',
  market_research:   'Market Research',
  survey:            'Survey',
  customer_feedback: 'Customer Feedback',
}

export default function TemplatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn:  () => api.get<ApiSuccess<AdminTemplate[]>>('/templates').then(r => r.data.data),
  })

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Resources</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Templates
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Download official templates to complete your submissions.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[20px]" />)}
        </div>
      ) : !data?.length ? (
        <div className="card p-10 text-center dotted">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
            <DownloadSimple size={22} className="text-white" />
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">No templates available</div>
          <p className="text-[12px] text-[var(--color-ink-mute)] mt-1">
            Templates will appear here when the admin uploads them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(tmpl => (
            <div key={tmpl.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {tmpl.fileType === 'application/pdf'
                  ? <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <FilePdf size={20} weight="fill" className="text-[var(--color-error)]" />
                    </div>
                  : <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileDoc size={20} weight="fill" className="text-[var(--color-info)]" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--color-ink)]">{tmpl.title}</p>
                  {tmpl.description && (
                    <p className="text-[12px] text-[var(--color-ink-mute)] mt-1 leading-relaxed">{tmpl.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)]">
                <Badge variant="default">{typeLabels[tmpl.templateType] ?? tmpl.templateType}</Badge>
                {tmpl.downloadUrl && (
                  <a href={tmpl.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" icon={<DownloadSimple size={13} />}>Download</Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
