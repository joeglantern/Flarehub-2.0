import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stairs, Plus, ChatText, CheckCircle, Circle } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import { formatDateTime } from '@/lib/utils'
import type { ApiSuccess, MilestonePlan } from '@/types/api'

const milestoneSchema = z.object({
  number:   z.number(),
  title:    z.string().min(1, 'Required'),
  timeline: z.string().min(1, 'Required'),
  budget:   z.string().min(1, 'Required'),
  goal:     z.string().min(1, 'Required'),
  tasks:    z.string().min(1, 'Required'),
  evidence: z.string().min(1, 'Required'),
  metrics:  z.array(z.string()),
})

const schema = z.object({
  businessName:         z.string().min(1, 'Required'),
  grantAmount:          z.string().optional(),
  implementationPeriod: z.string().optional(),
  stage:                z.string().optional(),
  milestones:           z.array(milestoneSchema).min(1),
})
type FormData = z.infer<typeof schema>

const defaultMilestone = (n: number) => ({
  number: n, title: '', timeline: '', budget: '', goal: '', tasks: '', evidence: '', metrics: [],
})

export default function MilestonePlanPage() {
  const qc = useQueryClient()

  const { data: plan, isLoading } = useQuery({
    queryKey: ['milestone-plan'],
    queryFn:  () => api.get<ApiSuccess<MilestonePlan | null>>('/submissions/milestones/me').then(r => r.data.data),
  })

  const { register, control, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: plan ? {
      businessName:         plan.businessName,
      grantAmount:          plan.grantAmount ?? '',
      implementationPeriod: plan.implementationPeriod ?? '',
      stage:                plan.stage ?? '',
      milestones:           (plan.milestones as FormData['milestones']) ?? [defaultMilestone(1)],
    } : { businessName: '', milestones: [defaultMilestone(1)] },
  })

  const { fields, append } = useFieldArray({ control, name: 'milestones' })

  const save = useMutation({
    mutationFn: (data: FormData) => plan
      ? api.patch('/submissions/milestones/me', data).then(r => r.data)
      : api.post('/submissions/milestones', data).then(r => r.data),
    onSuccess: () => { toast.success('Milestone plan saved'); qc.invalidateQueries({ queryKey: ['milestone-plan'] }) },
    onError:   () => toast.error('Could not save'),
  })

  if (isLoading) return (
    <div className="px-4 lg:px-7 py-6 max-w-[1100px] mx-auto">
      <Skeleton className="h-12 w-56 rounded-2xl mb-4" />
      <Skeleton className="h-96 rounded-[20px]" />
    </div>
  )

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1100px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Build</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Milestone Plan
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Document your implementation milestones step by step.
        </p>
      </div>

      {/* Admin comment */}
      {plan?.adminComment && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-terra-50)] border border-[var(--color-terra-100)]">
          <ChatText size={16} weight="fill" className="text-[var(--color-terra-500)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-mono uppercase text-[var(--color-terra-600)] mb-1">
              Admin comment {plan.commentedAt ? `· ${formatDateTime(plan.commentedAt)}` : ''}
            </p>
            <p className="text-sm text-[var(--color-ink)]">{plan.adminComment}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-5">

        {/* Business details */}
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">Business details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Business name" required error={errors.businessName?.message} {...register('businessName')} />
            <Input label="Grant amount" placeholder="KES 250,000" {...register('grantAmount')} />
            <Input label="Implementation period" placeholder="6 months" {...register('implementationPeriod')} />
            <Input label="Stage" placeholder="MVP" {...register('stage')} />
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">
            Milestones · {fields.length} step{fields.length !== 1 ? 's' : ''}
          </div>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[var(--color-line)]" />

            <div className="space-y-6">
              {fields.map((field, index) => {
                const hasTitle = !!(field as any).title
                return (
                  <div key={field.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-[var(--color-line)]">
                      {hasTitle
                        ? <CheckCircle size={18} weight="fill" className="text-[var(--color-forest-500)]" />
                        : <Circle size={18} weight="regular" className="text-[var(--color-ink-mute)]" />
                      }
                    </div>

                    {/* Milestone card */}
                    <div className="flex-1 pb-2">
                      <div className="text-[11px] font-mono uppercase text-[var(--color-ink-faint)] mb-2">
                        Milestone {index + 1}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input label="Title" required
                            error={(errors.milestones?.[index] as any)?.title?.message}
                            {...register(`milestones.${index}.title`)} />
                          <Input label="Timeline" required placeholder="Month 1-2"
                            error={(errors.milestones?.[index] as any)?.timeline?.message}
                            {...register(`milestones.${index}.timeline`)} />
                          <Input label="Budget" required placeholder="KES 50,000"
                            error={(errors.milestones?.[index] as any)?.budget?.message}
                            {...register(`milestones.${index}.budget`)} />
                          <Input label="Goal" required
                            error={(errors.milestones?.[index] as any)?.goal?.message}
                            {...register(`milestones.${index}.goal`)} />
                        </div>
                        <Textarea label="Tasks" required rows={2}
                          error={(errors.milestones?.[index] as any)?.tasks?.message}
                          {...register(`milestones.${index}.tasks`)} />
                        <Textarea label="Evidence required" required rows={2}
                          error={(errors.milestones?.[index] as any)?.evidence?.message}
                          {...register(`milestones.${index}.evidence`)} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {fields.length < 5 && (
            <button
              type="button"
              onClick={() => append(defaultMilestone(fields.length + 1))}
              className="w-full mt-5 flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-[var(--color-terra-500)]/40 bg-[var(--color-terra-50)]/50 hover:bg-[var(--color-terra-50)] transition text-[13px] font-semibold text-[var(--color-terra-600)]"
            >
              <Plus size={16} weight="bold" /> Add milestone
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting || save.isPending}
            disabled={!isDirty && !!plan}
            icon={<Stairs size={15} />}
          >
            {plan ? 'Save changes' : 'Submit plan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
