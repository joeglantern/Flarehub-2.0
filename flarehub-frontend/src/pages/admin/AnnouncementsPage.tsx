import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MegaphoneSimple, Trash } from '@phosphor-icons/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { NativeSelect } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import type { ApiSuccess, Announcement } from '@/types/api'

const schema = z.object({
  title:      z.string().min(1, 'Required'),
  body:       z.string().min(1, 'Required'),
  isPinned:   z.boolean().optional(),
  targetRole: z.enum(['all', 'entrepreneur', 'mentor']).optional(),
})
type FormData = z.infer<typeof schema>

export default function AnnouncementsPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn:  () => api.get<ApiSuccess<Announcement[]>>('/announcements').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { targetRole: 'all', isPinned: false },
  })

  const create = useMutation({
    mutationFn: (d: FormData) => api.post('/admin/announcements', d).then(r => r.data),
    onSuccess: () => {
      toast.success('Announcement posted')
      qc.invalidateQueries({ queryKey: ['announcements'] })
      reset(); setOpen(false)
    },
    onError: () => toast.error('Could not post announcement'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/announcements/${id}`),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['announcements'] }) },
  })

  return (
    <>
      <PageHeader title="Announcements"
        actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => setOpen(true)}>New</Button>}
      />
      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<MegaphoneSimple size={28} />} heading="No announcements"
          body="Post an announcement to reach all users."
          action={{ label: 'New announcement', onClick: () => setOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map(a => (
            <Card key={a.id} padding="sm" className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{a.title}</p>
                  <Badge variant="default">{a.targetRole}</Badge>
                </div>
                <p className="text-sm text-[var(--color-ink-mute)]">{a.body}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-1">{formatDate(a.createdAt)}</p>
              </div>
              <Button variant="ghost" size="sm" icon={<Trash size={14} />}
                onClick={() => remove.mutate(a.id)} className="text-[var(--color-error)]" />
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New announcement" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button form="ann-form" type="submit" loading={isSubmitting || create.isPending}>Post</Button>
          </>
        }>
        <form id="ann-form" onSubmit={handleSubmit(d => create.mutate(d))} className="flex flex-col gap-4">
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Message" required rows={4} error={errors.body?.message} {...register('body')} />
          <NativeSelect label="Audience" {...register('targetRole')}>
            <option value="all">All users</option>
            <option value="entrepreneur">Entrepreneurs only</option>
            <option value="mentor">Mentors only</option>
          </NativeSelect>
        </form>
      </Modal>
    </>
  )
}
