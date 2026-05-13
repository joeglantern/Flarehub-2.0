import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChartBar, ChatText } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import { formatDateTime } from '@/lib/utils'
import type { ApiSuccess, MarketResearch } from '@/types/api'

const schema = z.object({
  businessName:     z.string().min(1, 'Required'),
  surveyObjective:  z.string().optional(),
  sampleSize:       z.string().optional(),
  location:         z.string().optional(),
  awareness:        z.string().optional(),
  interest:         z.string().optional(),
  avgWillingness:   z.string().optional(),
  priceRange:       z.string().optional(),
  currentSolutions: z.string().optional(),
  openComments:     z.string().optional(),
  opportunity1:     z.string().optional(),
  opportunity2:     z.string().optional(),
  riskBarrier:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function MarketResearchPage() {
  const qc = useQueryClient()
  const { data: research, isLoading } = useQuery({
    queryKey: ['market-research'],
    queryFn:  () => api.get<ApiSuccess<MarketResearch | null>>('/submissions/market-research/me').then(r => r.data.data),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: research ? {
      businessName:     research.businessName,
      surveyObjective:  research.surveyObjective ?? '',
      sampleSize:       research.sampleSize ?? '',
      location:         research.location ?? '',
      awareness:        research.awareness ?? '',
      interest:         research.interest ?? '',
      avgWillingness:   research.avgWillingness ?? '',
      priceRange:       research.priceRange ?? '',
      currentSolutions: research.currentSolutions ?? '',
      openComments:     research.openComments ?? '',
      opportunity1:     research.opportunity1 ?? '',
      opportunity2:     research.opportunity2 ?? '',
      riskBarrier:      research.riskBarrier ?? '',
    } : { businessName: '' },
  })

  const save = useMutation({
    mutationFn: (data: FormData) => research
      ? api.patch('/submissions/market-research/me', data)
      : api.post('/submissions/market-research', data),
    onSuccess: () => { toast.success('Market research saved'); qc.invalidateQueries({ queryKey: ['market-research'] }) },
    onError:   () => toast.error('Could not save'),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-56 rounded-2xl" />
      <Skeleton className="h-64 rounded-[20px]" />
    </div>
  )

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1100px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Build</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Market Research
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Document your market analysis and findings.
        </p>
      </div>

      {/* Admin comment */}
      {research?.adminComment && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-terra-50)] border border-[var(--color-terra-100)]">
          <ChatText size={16} weight="fill" className="text-[var(--color-terra-500)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-mono uppercase text-[var(--color-terra-600)] mb-1">
              Admin comment {research.commentedAt ? `· ${formatDateTime(research.commentedAt)}` : ''}
            </p>
            <p className="text-sm text-[var(--color-ink)]">{research.adminComment}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-5">

        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">Survey basics</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business name" required error={errors.businessName?.message} {...register('businessName')} />
            <Input label="Sample size" placeholder="50 respondents" {...register('sampleSize')} />
            <Input label="Location" {...register('location')} />
            <Input label="Avg willingness to pay" {...register('avgWillingness')} />
            <Input label="Price range" {...register('priceRange')} />
          </div>
          <div className="mt-4">
            <Textarea label="Survey objective" rows={2} {...register('surveyObjective')} />
          </div>
        </div>

        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">Findings</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea label="Awareness" rows={2} {...register('awareness')} />
            <Textarea label="Interest" rows={2} {...register('interest')} />
            <Textarea label="Current solutions" rows={2} {...register('currentSolutions')} />
            <Textarea label="Open comments" rows={2} {...register('openComments')} />
          </div>
        </div>

        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">Insights</div>
          <div className="flex flex-col gap-4">
            <Textarea label="Opportunity 1" rows={2} {...register('opportunity1')} />
            <Textarea label="Opportunity 2" rows={2} {...register('opportunity2')} />
            <Textarea label="Risks and barriers" rows={2} {...register('riskBarrier')} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || save.isPending}
            disabled={!isDirty && !!research} icon={<ChartBar size={15} />}>
            {research ? 'Save changes' : 'Submit research'}
          </Button>
        </div>
      </form>
    </div>
  )
}
