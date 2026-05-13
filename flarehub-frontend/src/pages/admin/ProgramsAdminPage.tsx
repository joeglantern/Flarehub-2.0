import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Plus, PencilSimple, Trash, ListBullets } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NativeSelect } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { IllustrationPrograms } from '@/components/illustrations/IllustrationPrograms'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess, Program } from '@/types/api'

const schema = z.object({
  name:                    z.string().min(1, 'Name is required'),
  description:             z.string().optional(),
  applicationDeadline:     z.string().optional(),
  status:                  z.enum(['Active', 'Inactive']),
  maxParticipants:         z.string().optional(),
  grantAmount:             z.string().optional(),
  eligibilityRequirements: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProgramsAdminPage() {
  const [page, setPage]               = useState(1)
  const [formOpen, setFormOpen]       = useState(false)
  const [editing, setEditing]         = useState<Program | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const qc                            = useQueryClient()
  const navigate                      = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'programs', page],
    queryFn:  () => api.get<ApiPaginated<Program>>('/programs', { params: { page, limit: 10 } }).then(r => r.data),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Active' },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ status: 'Active' })
    setFormOpen(true)
  }

  const openEdit = (p: Program) => {
    setEditing(p)
    reset({
      name:                    p.name,
      description:             p.description ?? '',
      applicationDeadline:     p.applicationDeadline ? p.applicationDeadline.slice(0, 10) : '',
      status:                  p.status,
      maxParticipants:         p.maxParticipants != null ? String(p.maxParticipants) : '',
      grantAmount:             p.grantAmount ?? '',
      eligibilityRequirements: p.eligibilityRequirements ?? '',
    })
    setFormOpen(true)
  }

  const save = useMutation({
    mutationFn: (data: FormData) =>
      editing
        ? api.patch<ApiSuccess<Program>>(`/programs/${editing.id}`, data)
        : api.post<ApiSuccess<Program>>('/programs', data),
    onSuccess: () => {
      toast.success(editing ? 'Program updated' : 'Program created')
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] })
      qc.invalidateQueries({ queryKey: ['programs'] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: () => toast.error('Save failed'),
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/programs/${id}`),
    onSuccess: () => {
      toast.success('Program deleted')
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] })
      qc.invalidateQueries({ queryKey: ['programs'] })
      setDeleteTarget(null)
    },
    onError: () => toast.error('Delete failed'),
  })

  const onSubmit = handleSubmit((data: FormData) => save.mutate(data))

  return (
    <>
      <PageHeader
        title="Programs"
        subtitle={data ? `${data.meta.total} total` : ''}
        actions={
          <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
            New program
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={88} />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState illustration={<IllustrationPrograms />} heading="No programs yet" body="Create the first program to get started." />
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-5">
            {data.data.map(p => (
              <Card key={p.id} className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{p.name}</p>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    {p.hasApplicationForm ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-forest-50)] text-[var(--color-forest-600)] border border-[var(--color-forest-100)]">
                        <ListBullets size={10} weight="bold" />
                        Has form
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--color-elev)] text-[var(--color-ink-faint)] border border-[var(--color-line)]">
                        No form
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-[var(--color-ink-mute)] line-clamp-2 mb-1">{p.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-faint)]">
                    {p.applicationDeadline && <span>Deadline: {formatDate(p.applicationDeadline)}</span>}
                    {p.grantAmount && <span>Grant: {p.grantAmount}</span>}
                    {p.maxParticipants && <span>Max: {p.maxParticipants}</span>}
                    <span>{p.applicationCount ?? 0} applications</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" icon={<ListBullets size={13} />}
                    onClick={() => navigate(`/admin/programs/${p.id}/form-builder`)}>
                    {p.hasApplicationForm ? 'Edit form' : 'Build form'}
                  </Button>
                  <Button variant="ghost" size="sm" icon={<PencilSimple size={13} />}
                    onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" icon={<Trash size={13} />}
                    onClick={() => setDeleteTarget(p)}
                    className="text-[var(--color-error)]">
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={10} onChange={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit program' : 'Create program'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting || save.isPending} onClick={onSubmit}>
              {editing ? 'Save changes' : 'Create program'}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Input label="Program name" error={errors.name?.message} required {...register('name')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Application deadline" type="date" {...register('applicationDeadline')} />
            <NativeSelect label="Status" {...register('status')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Grant amount" placeholder="e.g. KES 50,000" {...register('grantAmount')} />
            <Input label="Max participants" type="number" {...register('maxParticipants')} />
          </div>
          <Textarea label="Eligibility requirements" rows={2} {...register('eligibilityRequirements')} />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && del.mutate(deleteTarget.id)}
        title="Delete program"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={del.isPending}
      />
    </>
  )
}
