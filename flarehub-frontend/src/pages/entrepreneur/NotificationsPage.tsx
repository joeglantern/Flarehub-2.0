import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Bell } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/store/ui.store'
import { timeAgo, cn } from '@/lib/utils'
import type { ApiPaginated, Notification } from '@/types/api'

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn:  () => api.get<ApiPaginated<Notification>>('/notifications/me', { params: { page, limit: 20 } }).then(r => r.data),
  })

  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all').then(r => r.data),
    onSuccess:  () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const markOne = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = data?.data.filter(n => !n.isRead).length ?? 0

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-[800px] mx-auto space-y-6 pb-24 lg:pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Connect</div>
          <h1 className="text-[34px] font-bold leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
            Notifications
          </h1>
          <p className="text-[var(--color-ink-mute)] text-[14px] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" loading={markAll.isPending}
            icon={<CheckCircle size={14} />} onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[20px]" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="card p-10 text-center dotted">
          <div className="w-14 h-14 rounded-3xl mesh-green flex items-center justify-center mx-auto mb-3">
            <Bell size={22} className="text-white" />
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">You're all caught up</div>
          <p className="text-[12px] text-[var(--color-ink-mute)] mt-1">
            No new notifications right now. We'll let you know when something happens.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {data.data.map(n => (
              <div key={n.id}
                className={cn(
                  'card px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors',
                  !n.isRead
                    ? 'bg-[var(--color-forest-50)] border-[var(--color-forest-100)]'
                    : 'hover:bg-[var(--color-elev)]',
                )}
                onClick={() => !n.isRead && markOne.mutate(n.id)}>
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2 shrink-0',
                  !n.isRead ? 'bg-[var(--color-forest-500)]' : 'bg-transparent',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--color-ink)]">{n.title}</p>
                  <p className="text-[13px] text-[var(--color-ink-mute)] mt-0.5 leading-relaxed">{n.body}</p>
                </div>
                <span className="text-[11px] text-[var(--color-ink-faint)] shrink-0 font-mono">{timeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={20} onChange={setPage} />
        </>
      )}
    </div>
  )
}
