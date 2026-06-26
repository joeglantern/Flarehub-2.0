import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, CalendarBlank } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/ui.store'
import { cn } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess, MentorMeeting, MenteeWithProgress } from '@/types/api'

const schema = z.object({
  menteeId:    z.string().uuid('Select a mentee'),
  meetingTime: z.string().min(1, 'Required'),
  meetingType: z.enum(['Virtual', 'InPerson']),
  link:        z.string().optional(),
  notes:       z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function MeetingsPage() {
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', page],
    queryFn:  () => api.get<ApiPaginated<MentorMeeting>>('/mentor/meetings', { params: { page, limit: 15 } }).then(r => r.data),
  })

  const { data: mentees } = useQuery({
    queryKey: ['mentees'],
    queryFn:  () => api.get<ApiSuccess<MenteeWithProgress[]>>('/mentor/mentees').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { meetingType: 'Virtual' },
  })

  const create = useMutation({
    mutationFn: (d: FormData) => api.post('/mentor/meetings', {
      ...d, meetingTime: new Date(d.meetingTime).toISOString(),
    }),
    onSuccess: () => {
      toast.success('Meeting scheduled')
      qc.invalidateQueries({ queryKey: ['meetings'] })
      reset(); setOpen(false)
    },
    onError: () => toast.error('Could not schedule meeting'),
  })

  return (
    <div className="space-y-6 page-enter">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)] mb-1">Mentor · Afosihub</p>
          <h1 className="text-[32px] font-bold text-[var(--color-ink)] leading-[1.05]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Meetings
          </h1>
          {data && (
            <p className="text-[14px] text-[var(--color-ink-mute)] mt-1">
              {data.meta.total} session{data.meta.total !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          Schedule meeting
        </Button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[20px]" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-forest-50)] flex items-center justify-center mb-4">
            <CalendarBlank size={24} className="text-[var(--color-forest-400)]" />
          </div>
          <p className="text-[16px] font-semibold text-[var(--color-ink)]">No meetings yet</p>
          <p className="text-[13px] text-[var(--color-ink-faint)] mt-1 mb-4">
            Schedule a session with one of your mentees.
          </p>
          <Button size="sm" icon={<Plus size={13} />} onClick={() => setOpen(true)}>
            Schedule meeting
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.data.map(m => {
              const dt      = new Date(m.meetingTime)
              const isToday = dt.toDateString() === new Date().toDateString()
              return (
                <div key={m.id}
                  className={cn(
                    'card flex items-center gap-4 p-4 transition-colors',
                    isToday ? 'bg-[var(--color-forest-50)] border-[var(--color-forest-100)]' : '',
                  )}>

                  {/* Date block */}
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0',
                    isToday ? 'bg-[var(--color-forest-500)]' : 'bg-[var(--color-elev)]',
                  )}>
                    <span className={cn('text-[9px] font-mono uppercase leading-none',
                      isToday ? 'text-white/70' : 'text-[var(--color-ink-faint)]')}>
                      {dt.toLocaleDateString('en-KE', { month: 'short' })}
                    </span>
                    <span className={cn('text-[18px] font-bold leading-tight',
                      isToday ? 'text-white' : 'text-[var(--color-ink)]')}
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {dt.getDate()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-[var(--color-ink)]">
                        {m.mentee?.firstName} {m.mentee?.lastName}
                      </p>
                      {isToday && (
                        <span className="text-[10px] font-mono font-semibold text-[var(--color-forest-600)] bg-[var(--color-forest-100)] px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[var(--color-ink-mute)] mt-0.5">
                      {dt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {dt.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>

                  {/* Badges + action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="review">{m.meetingType}</Badge>
                    <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                    {m.link && (
                      <a href={m.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">Join</Button>
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {data.meta.totalPages > 1 && (
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
              total={data.meta.total} limit={15} onChange={setPage} />
          )}
        </>
      )}

      {/* ── Schedule modal ─────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a meeting" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="meet-form" type="submit" loading={isSubmitting || create.isPending}>Schedule</Button>
          </>
        }>
        <form id="meet-form" onSubmit={handleSubmit(d => create.mutate(d))} className="flex flex-col gap-4">
          <NativeSelect label="Mentee" error={errors.menteeId?.message} {...register('menteeId')}>
            <option value="">Select mentee...</option>
            {mentees?.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
          </NativeSelect>
          <Input label="Date and time" type="datetime-local" required error={errors.meetingTime?.message} {...register('meetingTime')} />
          <Input label="Join link (optional)" type="url" placeholder="https://meet.google.com/..." {...register('link')} />
          <Input label="Notes (optional)" {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}
