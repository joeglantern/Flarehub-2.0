import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MegaphoneSimple, Trash, User as UserIcon } from '@phosphor-icons/react'
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
import type { ApiSuccess, ApiPaginated, Announcement, User } from '@/types/api'

const schema = z.object({
  title:        z.string().min(1, 'Required'),
  body:         z.string().min(1, 'Required'),
  isPinned:     z.boolean().optional(),
  targetRole:   z.enum(['all', 'entrepreneur', 'mentor']).optional(),
  targetUserId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function UserSearch({ onSelect }: { onSelect: (u: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null) => void }) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null>(null)
  const timer                   = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [search, setSearch]     = useState('')

  const { data, isFetching } = useQuery({
    queryKey: ['user-search', search],
    queryFn:  () => api.get<ApiPaginated<User>>('/admin/users', { params: { search, limit: 8 } }).then(r => r.data.data),
    enabled:  search.length >= 2,
  })

  const handleInput = (v: string) => {
    setQuery(v)
    setOpen(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSearch(v), 300)
  }

  const pick = (u: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>) => {
    setSelected(u)
    setQuery(`${u.firstName} ${u.lastName}`)
    setOpen(false)
    onSelect(u)
  }

  const clear = () => {
    setSelected(null)
    setQuery('')
    setSearch('')
    onSelect(null)
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Search by name or email..."
            className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-inset)] text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-forest-500)] focus:bg-[var(--color-surface)]"
          />
          {isFetching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--color-ink-faint)] uppercase">searching...</span>
          )}
        </div>
        {selected && (
          <button type="button" onClick={clear} className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-[13px] text-[var(--color-ink-mute)] hover:bg-[var(--color-inset)]">
            Clear
          </button>
        )}
      </div>

      {open && data && data.length > 0 && !selected && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden">
          {data.map(u => (
            <button
              key={u.id}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-inset)] text-left"
              onClick={() => pick(u)}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-forest-50)] flex items-center justify-center flex-shrink-0">
                <UserIcon size={13} className="text-[var(--color-forest-600)]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--color-ink)] truncate">{u.firstName} {u.lastName}</div>
                <div className="text-[11px] text-[var(--color-ink-mute)] truncate">{u.email}</div>
              </div>
              <span className="ml-auto text-[10px] font-mono uppercase text-[var(--color-ink-faint)]">{u.role}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-forest-50)] border border-[var(--color-forest-100)]">
          <UserIcon size={13} className="text-[var(--color-forest-600)]" />
          <span className="text-[13px] text-[var(--color-forest-700)] font-medium">{selected.firstName} {selected.lastName}</span>
          <span className="text-[11px] text-[var(--color-forest-500)]">{selected.email}</span>
        </div>
      )}
    </div>
  )
}

export default function AnnouncementsPage() {
  const [open, setOpen]               = useState(false)
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn:  () => api.get<ApiSuccess<Announcement[]>>('/announcements').then(r => r.data.data),
  })

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { targetRole: 'all', isPinned: false },
  })

  const targetRole = watch('targetRole')
  const isIndividual = targetRole === 'individual' as string

  useEffect(() => {
    if (!isIndividual) setTargetUserId(undefined)
  }, [isIndividual])

  const create = useMutation({
    mutationFn: (d: FormData) => {
      const payload: Record<string, unknown> = { title: d.title, body: d.body, isPinned: d.isPinned }
      if (isIndividual && targetUserId) {
        payload.targetUserId = targetUserId
      } else {
        payload.targetRole = d.targetRole
      }
      return api.post('/admin/announcements', payload).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Announcement posted')
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      reset(); setOpen(false); setTargetUserId(undefined)
    },
    onError: () => toast.error('Could not post announcement'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/announcements/${id}`),
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-announcements'] }) },
  })

  const audienceLabel = (a: Announcement) => {
    if (a.targetUserId && a.targetUser) return `${a.targetUser.firstName} ${a.targetUser.lastName}`
    if (a.targetUserId) return 'Individual'
    return a.targetRole
  }

  return (
    <>
      <PageHeader title="Announcements"
        actions={<Button size="sm" icon={<Plus size={14} />} onClick={() => setOpen(true)}>New</Button>}
      />
      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={<MegaphoneSimple size={28} />} heading="No announcements"
          body="Post an announcement to reach users."
          action={{ label: 'New announcement', onClick: () => setOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map(a => (
            <Card key={a.id} padding="sm" className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{a.title}</p>
                  <Badge variant="default">{audienceLabel(a)}</Badge>
                  {a.isPinned && <Badge variant="approved">Pinned</Badge>}
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

      <Modal open={open} onClose={() => { setOpen(false); reset(); setTargetUserId(undefined) }}
        title="New announcement" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setOpen(false); reset(); setTargetUserId(undefined) }}>Cancel</Button>
            <Button form="ann-form" type="submit" loading={isSubmitting || create.isPending}
              disabled={isIndividual && !targetUserId}>
              Post
            </Button>
          </>
        }>
        <form id="ann-form" onSubmit={handleSubmit(d => create.mutate(d))} className="flex flex-col gap-4">
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Message" required rows={4} error={errors.body?.message} {...register('body')} />
          <NativeSelect label="Audience" {...register('targetRole')}>
            <option value="all">All users</option>
            <option value="entrepreneur">Entrepreneurs only</option>
            <option value="mentor">Mentors only</option>
            <option value="individual">Specific person</option>
          </NativeSelect>
          {isIndividual && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-1.5">
                Select user
              </label>
              <UserSearch onSelect={u => setTargetUserId(u?.id)} />
            </div>
          )}
        </form>
      </Modal>
    </>
  )
}
