import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClockCounterClockwise } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { timeAgo } from '@/lib/utils'
import type { ApiPaginated } from '@/types/api'

interface AdminLog {
  id: number
  action: string
  targetType?: string
  createdAt: string
  admin: { firstName: string; lastName: string; email: string }
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity-log', page],
    queryFn:  () => api.get<ApiPaginated<AdminLog>>('/admin/activity-log', { params: { page, limit: 25 } }).then(r => r.data),
  })

  return (
    <>
      <PageHeader title="Activity Log" subtitle="All admin actions across the platform." />
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} />)}</div>
      ) : !data?.data.length ? (
        <EmptyState icon={<ClockCounterClockwise size={28} />} heading="No activity yet" body="Admin actions will appear here." />
      ) : (
        <>
          <Card padding="none" className="overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-elev)]">
                  {['Admin', 'Action', 'Target', 'When'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map(log => (
                  <tr key={log.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-elev)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-ink)]">{log.admin.firstName} {log.admin.lastName}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">{log.admin.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-mute)] font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.targetType && <Badge variant="default">{log.targetType}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">{timeAgo(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={25} onChange={setPage} />
        </>
      )}
    </>
  )
}
