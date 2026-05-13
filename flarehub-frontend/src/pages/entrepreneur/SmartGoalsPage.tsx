import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Target, ChatText, CheckCircle } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { RingChart } from '@/components/ui/RingChart'
import { toast } from '@/store/ui.store'
import { formatDateTime } from '@/lib/utils'
import type { ApiSuccess, SmartGoal } from '@/types/api'

const schema = z.object({
  goalStatement: z.string().min(1, 'Required'),
  specific:      z.string().min(1, 'Required'),
  measurable:    z.string().min(1, 'Required'),
  achievable:    z.string().min(1, 'Required'),
  relevant:      z.string().min(1, 'Required'),
  timebound:     z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

const SMART_FIELDS: { key: keyof FormData; label: string; placeholder: string; letter: string; color: string }[] = [
  { key: 'goalStatement', label: 'Goal statement',  placeholder: 'What is the overall goal?',                    letter: '🎯', color: 'var(--color-forest-500)' },
  { key: 'specific',      label: 'Specific',        placeholder: 'What exactly will you achieve?',               letter: 'S',  color: 'var(--color-forest-500)' },
  { key: 'measurable',    label: 'Measurable',      placeholder: 'How will you measure progress?',               letter: 'M',  color: 'var(--color-terra-500)' },
  { key: 'achievable',    label: 'Achievable',      placeholder: 'Is this goal realistic given your resources?', letter: 'A',  color: 'var(--color-sun)' },
  { key: 'relevant',      label: 'Relevant',        placeholder: 'Why does this goal matter to your business?',  letter: 'R',  color: 'var(--color-forest-700)' },
  { key: 'timebound',     label: 'Time-bound',      placeholder: 'What is your deadline or timeline?',           letter: 'T',  color: 'var(--color-ink-soft)' },
]

export default function SmartGoalsPage() {
  const qc = useQueryClient()

  const { data: goal, isLoading } = useQuery({
    queryKey: ['smart-goal'],
    queryFn:  () => api.get<ApiSuccess<SmartGoal | null>>('/submissions/smart-goals/me').then(r => r.data.data),
  })

  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: goal ? {
      goalStatement: goal.goalStatement,
      specific:      goal.specific,
      measurable:    goal.measurable,
      achievable:    goal.achievable,
      relevant:      goal.relevant,
      timebound:     goal.timebound,
    } : undefined,
  })

  const watchedValues = watch()
  const filledCount = SMART_FIELDS.filter(f => f.key !== 'goalStatement' && !!watchedValues[f.key]).length
  const pct = Math.round((filledCount / 5) * 100)

  const save = useMutation({
    mutationFn: (data: FormData) => goal
      ? api.patch('/submissions/smart-goals/me', data).then(r => r.data)
      : api.post('/submissions/smart-goals', data).then(r => r.data),
    onSuccess: () => {
      toast.success('SMART Goals saved')
      qc.invalidateQueries({ queryKey: ['smart-goal'] })
    },
    onError: () => toast.error('Could not save', 'Try again'),
  })

  if (isLoading) return (
    <div className="px-4 lg:px-7 py-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-12 w-56 rounded-2xl mb-4" />
      <Skeleton className="h-96 rounded-[20px]" />
    </div>
  )

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[1100px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Build</div>
          <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
            SMART Goals
          </h1>
          <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
            Define specific, measurable goals for your business.
          </p>
        </div>

        {/* Ring progress */}
        <div className="flex items-center gap-4">
          <RingChart
            value={goal ? 100 : pct}
            size={72}
            stroke={7}
            color={goal ? 'var(--color-forest-500)' : 'var(--color-terra-500)'}
            label={goal ? <CheckCircle size={20} className="text-[var(--color-forest-500)]" /> : `${pct}%`}
          />
          <div>
            <div className="text-[13px] font-semibold text-[var(--color-ink)]">
              {goal ? 'Submitted' : 'In progress'}
            </div>
            <div className="text-[11px] text-[var(--color-ink-mute)]">
              {goal ? 'Last saved · ' + formatDateTime(goal.updatedAt) : `${filledCount}/5 fields filled`}
            </div>
          </div>
        </div>
      </div>

      {/* Admin comment */}
      {goal?.adminComment && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-terra-50)] border border-[var(--color-terra-100)]">
          <ChatText size={16} weight="fill" className="text-[var(--color-terra-500)] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-mono uppercase text-[var(--color-terra-600)] mb-1">
              Admin comment {goal.commentedAt ? `· ${formatDateTime(goal.commentedAt)}` : ''}
            </p>
            <p className="text-sm text-[var(--color-ink)]">{goal.adminComment}</p>
          </div>
        </div>
      )}

      {/* SMART rings summary if submitted */}
      {goal && (
        <div className="card p-5">
          <div className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-4">SMART breakdown</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {['Specific', 'Measurable', 'Achievable', 'Relevant', 'Time-bound'].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <RingChart
                  value={100}
                  size={56}
                  stroke={6}
                  color={['var(--color-forest-500)', 'var(--color-terra-500)', 'var(--color-sun)', 'var(--color-forest-700)', 'var(--color-ink-soft)'][i]}
                  label={<span className="text-[10px] font-bold">{label[0]}</span>}
                />
                <span className="text-[10px] font-mono uppercase text-[var(--color-ink-mute)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
        {SMART_FIELDS.map(f => (
          <div key={f.key} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-elev)] flex items-center justify-center text-[15px] font-bold shrink-0"
                style={{ color: f.color }}>
                {f.letter}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--color-ink)]">{f.label}</div>
                <div className="text-[11px] text-[var(--color-ink-mute)]">{f.placeholder}</div>
              </div>
              {watchedValues[f.key] && f.key !== 'goalStatement' && (
                <CheckCircle size={16} weight="fill" className="text-[var(--color-forest-500)] ml-auto" />
              )}
            </div>
            <Textarea
              placeholder={f.placeholder}
              rows={3}
              error={errors[f.key]?.message}
              {...register(f.key)}
            />
          </div>
        ))}

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSubmitting || save.isPending}
            disabled={!isDirty && !!goal}
            icon={<Target size={15} />}
          >
            {goal ? 'Save changes' : 'Submit goals'}
          </Button>
        </div>
      </form>
    </div>
  )
}
