import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FilePdf, MagnifyingGlass, DownloadSimple, User, Binoculars } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess, Program } from '@/types/api'
import type { User as UserType } from '@/types/api'

async function downloadPdf(url: string, filename: string) {
  try {
    const response = await api.get(url, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast.error('Could not download report')
  }
}

function ProgramReports() {
  const [downloading, setDownloading] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'programs'],
    queryFn:  () => api.get<ApiPaginated<Program>>('/programs', {
      params: { limit: 50 },
    }).then(r => r.data),
  })

  const handleDownload = async (program: Program) => {
    setDownloading(program.id)
    await downloadPdf(`/reports/program/${program.id}`, `program-${program.id}-report.pdf`)
    setDownloading(null)
  }

  return (
    <div className="bg-white rounded-[20px] border border-[var(--color-line)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-line)] flex items-center gap-2 bg-[var(--color-elev)]">
        <Binoculars size={15} className="text-[var(--color-ink-faint)]" />
        <p className="text-sm font-semibold text-[var(--color-ink)]">Program Reports</p>
        <span className="ml-auto text-xs text-[var(--color-ink-faint)]">PDF · comprehensive analytics per program</span>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} />)}
        </div>
      ) : !data?.data.length ? (
        <div className="p-10 text-center text-sm text-[var(--color-ink-faint)]">No programs found.</div>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {data.data.map(program => (
            <div key={program.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-elev)] transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-elev)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-inset)] transition-colors">
                <FilePdf size={16} className="text-[var(--color-ink-mute)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{program.name}</p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                  {program.applicationCount ?? 0} applications
                  {program.applicationDeadline && ` · Deadline ${formatDate(program.applicationDeadline)}`}
                </p>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                program.status === 'active'
                  ? 'border-[var(--color-forest-200)] text-[var(--color-forest-700)] bg-[var(--color-forest-50)]'
                  : 'border-[var(--color-line)] text-[var(--color-ink-faint)]'
              }`}>
                {program.status}
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<DownloadSimple size={13} />}
                loading={downloading === program.id}
                onClick={() => handleDownload(program)}
              >
                Download PDF
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UserReports() {
  const [search, setSearch]           = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const debounced                     = useDebounce(search)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'users', debounced],
    queryFn:  () => api.get<ApiPaginated<UserType>>('/admin/users', {
      params: { page: 1, limit: 20, search: debounced || undefined },
    }).then(r => r.data),
    enabled: debounced.length >= 2 || debounced.length === 0,
  })

  const handleDownload = async (user: UserType) => {
    setDownloading(user.id)
    await downloadPdf(
      `/reports/entrepreneur/${user.id}`,
      `user-${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}-report.pdf`,
    )
    setDownloading(null)
  }

  return (
    <div className="bg-white rounded-[20px] border border-[var(--color-line)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-line)] flex items-center gap-2 bg-[var(--color-elev)]">
        <User size={15} className="text-[var(--color-ink-faint)]" />
        <p className="text-sm font-semibold text-[var(--color-ink)]">Entrepreneur Reports</p>
        <span className="ml-auto text-xs text-[var(--color-ink-faint)]">PDF · per-user progress & submissions</span>
      </div>

      <div className="px-5 py-3 border-b border-[var(--color-line)]">
        <Input
          placeholder="Search by name or email…"
          leftIcon={<MagnifyingGlass size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
          fullWidth={false}
        />
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} />)}
        </div>
      ) : !data?.data.length ? (
        <div className="p-10 text-center text-sm text-[var(--color-ink-faint)]">
          {search ? 'No users match your search.' : 'Start typing to search users.'}
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line)]">
          {data.data.map(user => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-elev)] transition-colors">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[var(--color-ink-faint)]">{user.email}</p>
              </div>
              <span className="text-[11px] font-mono text-[var(--color-ink-faint)] hidden sm:block">{user.role}</span>
              <Button
                variant="secondary"
                size="sm"
                icon={<DownloadSimple size={13} />}
                loading={downloading === user.id}
                onClick={() => handleDownload(user)}
              >
                Download PDF
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Download PDF reports for programs and individual entrepreneurs."
      />

      <div className="space-y-6 max-w-4xl">
        <ProgramReports />
        <UserReports />
      </div>
    </>
  )
}
