import { useQuery } from '@tanstack/react-query'
import { HandHeart, CheckCircle, XCircle, ClockCounterClockwise } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ApiSuccess, MentorshipApplication } from '@/types/api'

const STATUS_META = {
  pending:  { icon: ClockCounterClockwise, color: 'text-[var(--color-ink-faint)]', label: 'Under review', variant: 'default' as const },
  accepted: { icon: CheckCircle,           color: 'text-[var(--color-forest-500)]', label: 'Accepted',     variant: 'approved' as const },
  rejected: { icon: XCircle,               color: 'text-[var(--color-error)]',      label: 'Not accepted', variant: 'rejected' as const },
}

export default function MentorshipApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['entrepreneur', 'mentorship-applications'],
    queryFn:  () =>
      api.get<ApiSuccess<MentorshipApplication[]>>('/entrepreneur/mentorship-applications')
        .then(r => r.data.data),
  })

  return (
    <>
      <PageHeader
        title="Mentorship Applications"
        subtitle="Track the status of your mentorship applications."
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={90} />)}
        </div>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<HandHeart size={24} />}
            heading="No applications yet"
            body="When a mentor shares an invite link with you, use it to apply. Your applications will appear here."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map(app => {
            const pm      = app.programMentor
            const mentor  = pm?.mentor
            const prog    = pm?.program
            const meta    = STATUS_META[app.status] ?? STATUS_META.pending
            const Icon    = meta.icon
            return (
              <Card key={app.id} padding="none">
                <div className="px-5 py-4 flex items-start gap-4">
                  <Avatar
                    firstName={mentor?.firstName ?? '?'}
                    lastName={mentor?.lastName ?? ''}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {mentor ? `${mentor.firstName} ${mentor.lastName}` : 'Unknown mentor'}
                      </p>
                      {prog && (
                        <Badge variant="default">{prog.name}</Badge>
                      )}
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    {mentor?.county && (
                      <p className="text-xs text-[var(--color-ink-faint)]">{mentor.county}</p>
                    )}
                    {app.message && (
                      <p className="text-xs text-[var(--color-ink-soft)] mt-2 italic">
                        Your note: "{app.message}"
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                      {app.respondedAt && ` · Responded ${new Date(app.respondedAt).toLocaleDateString()}`}
                    </p>
                    {app.status === 'accepted' && (
                      <p className="text-xs text-[var(--color-forest-500)] mt-1 font-medium">
                        Your mentor has accepted you. Expect a message from them soon.
                      </p>
                    )}
                  </div>
                  <Icon size={22} className={`${meta.color} shrink-0`} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
