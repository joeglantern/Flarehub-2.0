import { useQuery } from '@tanstack/react-query'
import { MegaphoneSimple, PushPin } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo, cn } from '@/lib/utils'
import type { ApiSuccess, Announcement } from '@/types/api'

export default function AnnouncementsPage() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn:  () => api.get<ApiSuccess<Announcement[]>>('/announcements').then(r => r.data.data),
  })

  const pinned  = announcements?.filter(a => a.isPinned)  ?? []
  const regular = announcements?.filter(a => !a.isPinned) ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MegaphoneSimple size={24} weight="duotone" className="text-[var(--color-forest-600)]" />
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Announcements</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && announcements?.length === 0 && (
        <div className="text-center py-16 text-[var(--color-ink-mute)]">
          <MegaphoneSimple size={40} className="mx-auto mb-3 opacity-30" />
          <p>No announcements yet.</p>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">Pinned</p>
          {pinned.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
        </div>
      )}

      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">All announcements</p>
          )}
          {regular.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <div className={cn(
      'card p-5 space-y-2',
      a.isPinned && 'border-[var(--color-forest-200)] bg-[var(--color-forest-50)]',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {a.isPinned && <PushPin size={14} weight="fill" className="text-[var(--color-forest-600)] shrink-0 mt-0.5" />}
          <h3 className="font-semibold text-[var(--color-ink)] leading-snug">{a.title}</h3>
        </div>
        <span className="text-xs text-[var(--color-ink-faint)] shrink-0 mt-0.5">{timeAgo(a.createdAt)}</span>
      </div>
      <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{a.body}</p>
      {a.createdBy && (
        <p className="text-xs text-[var(--color-ink-faint)]">
          — {a.createdBy.firstName} {a.createdBy.lastName}
        </p>
      )}
    </div>
  )
}
