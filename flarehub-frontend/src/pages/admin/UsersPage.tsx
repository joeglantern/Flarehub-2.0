import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, UsersThree, DownloadSimple } from '@phosphor-icons/react'
import { toast } from '@/store/ui.store'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, User } from '@/types/api'

export default function UsersPage() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const debounced               = useDebounce(search)
  const navigate                = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, debounced],
    queryFn:  () => api.get<ApiPaginated<User>>('/admin/users', {
      params: { page, limit: 20, search: debounced || undefined },
    }).then(r => r.data),
  })

  const exportCSV = async () => {
    setExportLoading(true)
    try {
      const response = await api.get('/admin/users/export', {
        responseType: 'blob',
        params: { search: search || undefined },
      })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'users.csv'
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      toast.error('Could not export CSV')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={data ? `${data.meta.total} registered` : ''}
        actions={
          <Button variant="secondary" size="sm" icon={<DownloadSimple size={14} />} loading={exportLoading} onClick={exportCSV}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-5">
        <Input
          placeholder="Search by name or email..."
          leftIcon={<MagnifyingGlass size={15} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={56} />)}
        </div>
      ) : !data?.data.length ? (
        <EmptyState icon={<UsersThree size={28} />} heading="No users found" body="Try a different search." />
      ) : (
        <>
          <Card padding="none" className="overflow-x-auto overflow-y-hidden mb-5">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-elev)]">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)]">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)]">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)] hidden md:table-cell">County</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)] hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-mute)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-elev)] cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-[var(--color-ink-faint)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(user.role)}>{user.role}</Badge>
                      {user.isMentor && <Badge variant="mentor" className="ml-1">Mentor</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-mute)] hidden md:table-cell">{user.county ?? '-'}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)] hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isVerified ? 'approved' : 'pending'}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
            total={data.meta.total} limit={20} onChange={setPage} />
        </>
      )}
    </>
  )
}
