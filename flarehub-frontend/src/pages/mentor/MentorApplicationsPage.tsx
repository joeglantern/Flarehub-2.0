import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, UserCircle } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import type { ApiSuccess, MentorshipApplication } from '@/types/api'

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected'

const TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All',      value: 'all' },
  { label: 'Pending',  value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
]

const STATUS_BADGE: Record<string, { variant: 'default' | 'approved' | 'mentor' | 'rejected'; label: string }> = {
  pending:  { variant: 'default',   label: 'Pending' },
  accepted: { variant: 'approved',  label: 'Accepted' },
  rejected: { variant: 'rejected',  label: 'Declined' },
}

export default function MentorApplicationsPage() {
  const [filter, setFilter]     = useState<FilterStatus>('all')
  const [confirm, setConfirm]   = useState<{ id: number; status: 'accepted' | 'rejected'; name: string } | null>(null)
  const qc                      = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['mentor', 'mentorship-applications', filter],
    queryFn:  () =>
      api.get<ApiSuccess<MentorshipApplication[]>>('/mentor/mentorship-applications', {
        params: filter !== 'all' ? { status: filter } : {},
      }).then(r => r.data.data),
  })

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      api.patch(`/mentor/mentorship-applications/${id}`, { status }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'accepted' ? 'Application accepted' : 'Application declined')
      qc.invalidateQueries({ queryKey: ['mentor', 'mentorship-applications'] })
      setConfirm(null)
    },
    onError: () => toast.error('Could not update application'),
  })

  return (
    <>
      <PageHeader
        title="Mentorship Applications"
        subtitle="Entrepreneurs who have applied to be your mentee through your invite links."
      />

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-[var(--color-elev)] rounded-xl w-fit mb-5">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === t.value
                ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={90} />)}
        </div>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<UserCircle size={24} />}
            heading="No applications yet"
            body={filter === 'all'
              ? 'Share your invite link and entrepreneurs will appear here once they apply.'
              : `No ${filter} applications.`}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map(app => {
            const e       = app.entrepreneur
            const prog    = app.programMentor?.program
            const sb      = STATUS_BADGE[app.status] ?? STATUS_BADGE.pending
            const isPending = app.status === 'pending'
            return (
              <Card key={app.id} padding="none">
                <div className="px-5 py-4 flex items-start gap-4">
                  <Avatar
                    firstName={e?.firstName ?? '?'}
                    lastName={e?.lastName ?? ''}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {e ? `${e.firstName} ${e.lastName}` : 'Unknown'}
                      </p>
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                      {prog && (
                        <Badge variant="default">{prog.name}</Badge>
                      )}
                    </div>
                    {e?.businessName && (
                      <p className="text-xs text-[var(--color-ink-faint)]">
                        {e.businessName}{e.businessStage ? ` · ${e.businessStage}` : ''}{e.county ? ` · ${e.county}` : ''}
                      </p>
                    )}
                    {app.message && (
                      <p className="text-xs text-[var(--color-ink-soft)] mt-2 italic">
                        "{app.message}"
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                      {app.respondedAt && ` · Responded ${new Date(app.respondedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isPending && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirm({ id: app.id, status: 'rejected', name: e ? `${e.firstName} ${e.lastName}` : 'this applicant' })}
                      >
                        <XCircle size={14} />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setConfirm({ id: app.id, status: 'accepted', name: e ? `${e.firstName} ${e.lastName}` : 'this applicant' })}
                      >
                        <CheckCircle size={14} />
                        Accept
                      </Button>
                    </div>
                  )}
                  {!isPending && (
                    <div className="shrink-0 text-[var(--color-ink-faint)]">
                      {app.status === 'accepted'
                        ? <CheckCircle size={20} className="text-[var(--color-forest-500)]" />
                        : <XCircle size={20} className="text-[var(--color-error)]" />}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && respond.mutate({ id: confirm.id, status: confirm.status })}
        loading={respond.isPending}
        title={confirm?.status === 'accepted' ? 'Accept application' : 'Decline application'}
        description={
          confirm?.status === 'accepted'
            ? `Accept ${confirm?.name} as your mentee? They'll be notified right away.`
            : `Decline ${confirm?.name}'s application? This cannot be undone.`
        }
        confirmLabel={confirm?.status === 'accepted' ? 'Accept' : 'Decline'}
        danger={confirm?.status === 'rejected'}
      />
    </>
  )
}
