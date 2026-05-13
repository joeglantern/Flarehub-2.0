import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Briefcase } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import type { ApiSuccess, BusinessPlan } from '@/types/api'

type PlanData = Record<string, string>

const FIELDS = [
  { key: 'business_name', label: 'Business name', type: 'input' },
  { key: 'address', label: 'Business address', type: 'input' },
  { key: 'members', label: 'Team members', type: 'input' },
  { key: 'purpose', label: 'Business purpose', type: 'textarea' },
  { key: 'objectives', label: 'Objectives', type: 'textarea' },
  { key: 'products_services', label: 'Products and services', type: 'textarea' },
  { key: 'target_customers', label: 'Target customers', type: 'textarea' },
  { key: 'marketing_product', label: 'Marketing strategy', type: 'textarea' },
  { key: 'competitive_advantage', label: 'Competitive advantage', type: 'textarea' },
] as const

export default function BusinessPlanPage() {
  const qc = useQueryClient()
  const { data: plan, isLoading } = useQuery({
    queryKey: ['business-plan'],
    queryFn:  () => api.get<ApiSuccess<BusinessPlan | null>>('/business-plans/me').then(r => r.data.data),
  })

  const existing = plan?.planData as PlanData | undefined

  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<PlanData>({
    values: existing ?? {},
  })

  const save = useMutation({
    mutationFn: (d: PlanData) => api.post('/business-plans', { planData: d }),
    onSuccess:  () => { toast.success('Business plan saved'); qc.invalidateQueries({ queryKey: ['business-plan'] }) },
    onError:    () => toast.error('Could not save'),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-56 rounded-2xl" />
      <Skeleton className="h-96 rounded-[20px]" />
    </div>
  )

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1100px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Build</div>
        <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
          Business Plan
        </h1>
        <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
          Complete your in-app business plan.
        </p>
      </div>

      <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-5">
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">Plan details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map(f =>
              f.type === 'input' ? (
                <Input key={f.key} label={f.label} {...register(f.key)} />
              ) : (
                <div key={f.key} className="md:col-span-2">
                  <Textarea label={f.label} rows={3} {...register(f.key)} />
                </div>
              )
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || save.isPending}
            disabled={!isDirty && !!plan} icon={<Briefcase size={15} />}>
            {plan ? 'Save changes' : 'Save business plan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
