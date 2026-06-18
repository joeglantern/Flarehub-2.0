import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UsersFour, MagnifyingGlass, Trash, Check, Binoculars,
  CheckCircle, XCircle, ClockCountdown, LinkedinLogo,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import type { ApiPaginated, ApiSuccess, User, Program, ProgramMentor, MentorApplication, MentorApplicationStatus } from '@/types/api'

interface MentorWithCount extends User {
  menteeCount: number
}

interface MenteeRow extends User {
  assignedAt: string
}

type RightTab  = 'mentees' | 'programs'
type PageTab   = 'active' | 'applications'
type AppStatus = MentorApplicationStatus

export default function MentorManagementPage() {
  const [pageTab, setPageTab]                 = useState<PageTab>('active')
  const [appStatus, setAppStatus]             = useState<AppStatus>('pending')
  const [selectedMentor, setSelectedMentor]   = useState<MentorWithCount | null>(null)
  const [rightTab, setRightTab]               = useState<RightTab>('mentees')
  const [assignMenteeOpen, setAssignMenteeOpen]   = useState(false)
  const [assignProgramOpen, setAssignProgramOpen] = useState(false)
  const [removeTarget, setRemoveTarget]       = useState<{ mentorId: string; menteeId: string; name: string } | null>(null)
  const [removePmTarget, setRemovePmTarget]   = useState<{ programId: number; mentorId: string; name: string } | null>(null)
  const [menteeSearch, setMenteeSearch]       = useState('')
  const [selectedMenteeId, setSelectedMenteeId]   = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  // Application modals
  const [approveTarget, setApproveTarget]     = useState<MentorApplication | null>(null)
  const [rejectTarget, setRejectTarget]       = useState<MentorApplication | null>(null)
  const [approveProgramId, setApproveProgramId] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes]         = useState('')
  const debounced = useDebounce(menteeSearch)
  const qc        = useQueryClient()

  // ── Mentor list ──────────────────────────────────────────────────────────
  const { data: mentors, isLoading } = useQuery({
    queryKey: ['admin', 'mentors'],
    queryFn:  () => api.get<ApiPaginated<MentorWithCount>>('/admin/mentors', { params: { limit: 50 } }).then(r => r.data),
  })

  const { data: mentees, isLoading: menteesLoading } = useQuery({
    queryKey: ['admin', 'mentor-mentees', selectedMentor?.id],
    queryFn:  () =>
      api.get<ApiPaginated<MenteeRow>>(`/admin/mentors/${selectedMentor!.id}/mentees`, { params: { limit: 50 } })
        .then(r => r.data),
    enabled: !!selectedMentor && rightTab === 'mentees',
  })

  const { data: mentorPrograms, isLoading: programsLoading } = useQuery({
    queryKey: ['admin', 'mentor-programs', selectedMentor?.id],
    queryFn:  () =>
      api.get<ApiSuccess<ProgramMentor[]>>(`/admin/mentors/${selectedMentor!.id}/programs`)
        .then(r => r.data),
    enabled: !!selectedMentor && rightTab === 'programs',
  })

  const { data: allEntrepreneurs } = useQuery({
    queryKey: ['admin', 'users', 'entrepreneurs', debounced],
    queryFn:  () =>
      api.get<ApiPaginated<User>>('/admin/users', {
        params: { role: 'entrepreneur', search: debounced || undefined, limit: 20 },
      }).then(r => r.data),
    enabled: assignMenteeOpen,
  })

  const { data: allPrograms } = useQuery({
    queryKey: ['admin', 'programs-list'],
    queryFn:  () => api.get<ApiPaginated<Program>>('/programs', { params: { limit: 50 } }).then(r => r.data),
    enabled: assignProgramOpen || !!approveTarget,
  })

  // ── Applications ─────────────────────────────────────────────────────────
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['admin', 'mentor-applications', appStatus],
    queryFn:  () =>
      api.get<ApiPaginated<MentorApplication>>('/admin/mentor-applications', {
        params: { status: appStatus, limit: 50 },
      }).then(r => r.data),
    enabled: pageTab === 'applications',
  })

  const { data: pendingCount } = useQuery({
    queryKey: ['admin', 'mentor-applications-count'],
    queryFn:  () =>
      api.get<ApiPaginated<MentorApplication>>('/admin/mentor-applications', {
        params: { status: 'pending', limit: 1 },
      }).then(r => r.data.meta.total),
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const assign = useMutation({
    mutationFn: ({ mentorId, menteeId }: { mentorId: string; menteeId: string }) =>
      api.post('/admin/mentor-assignments', { mentorId, menteeId }),
    onSuccess: () => {
      toast.success('Mentee assigned')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-mentees'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setAssignMenteeOpen(false); setSelectedMenteeId(null); setMenteeSearch('')
    },
    onError: () => toast.error('Assignment failed'),
  })

  const remove = useMutation({
    mutationFn: ({ mentorId, menteeId }: { mentorId: string; menteeId: string }) =>
      api.delete('/admin/mentor-assignments', { data: { mentorId, menteeId } }),
    onSuccess: () => {
      toast.success('Assignment removed')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-mentees'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setRemoveTarget(null)
    },
    onError: () => toast.error('Could not remove'),
  })

  const assignProgram = useMutation({
    mutationFn: ({ mentorId, programId }: { mentorId: string; programId: number }) =>
      api.post(`/admin/programs/${programId}/mentors`, { mentorId }),
    onSuccess: () => {
      toast.success('Mentor assigned to program')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-programs'] })
      setAssignProgramOpen(false); setSelectedProgramId(null)
    },
    onError: () => toast.error('Could not assign to program'),
  })

  const removeProgram = useMutation({
    mutationFn: ({ mentorId, programId }: { mentorId: string; programId: number }) =>
      api.delete(`/admin/programs/${programId}/mentors/${mentorId}`),
    onSuccess: () => {
      toast.success('Removed from program')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-programs'] })
      setRemovePmTarget(null)
    },
    onError: () => toast.error('Could not remove'),
  })

  const approveMut = useMutation({
    mutationFn: ({ id, programId }: { id: number; programId?: number }) =>
      api.patch(`/admin/mentor-applications/${id}/approve`, { programId }),
    onSuccess: () => {
      toast.success('Application approved', 'Mentor notified by email')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-applications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-applications-count'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setApproveTarget(null); setApproveProgramId(null)
    },
    onError: () => toast.error('Could not approve'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      api.patch(`/admin/mentor-applications/${id}/reject`, { notes }),
    onSuccess: () => {
      toast.success('Application rejected', 'Applicant notified by email')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-applications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-applications-count'] })
      setRejectTarget(null); setRejectNotes('')
    },
    onError: () => toast.error('Could not reject'),
  })

  const assignedMenteeIds  = new Set(mentees?.data.map(m => m.id) ?? [])
  const assignedProgramIds = new Set(mentorPrograms?.data.map(p => p.programId) ?? [])

  const selectMentor = (m: MentorWithCount) => { setSelectedMentor(m); setRightTab('mentees') }

  const APP_STATUS_TABS: { value: AppStatus; label: string }[] = [
    { value: 'pending',  label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <>
      <PageHeader title="Mentor Management" subtitle="Manage mentors, assignments, and applications." />

      {/* Page-level tabs */}
      <div className="flex gap-1 mb-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-1 w-fit">
        <button
          onClick={() => setPageTab('active')}
          className={cn(
            'px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
            pageTab === 'active'
              ? 'bg-[var(--color-ink)] text-white'
              : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)]',
          )}
        >
          Active Mentors
        </button>
        <button
          onClick={() => setPageTab('applications')}
          className={cn(
            'px-4 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors flex items-center gap-2',
            pageTab === 'applications'
              ? 'bg-[var(--color-ink)] text-white'
              : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)]',
          )}
        >
          Applications
          {!!pendingCount && (
            <span className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded-full',
              pageTab === 'applications' ? 'bg-white/20' : 'bg-[var(--color-terra-500)] text-white',
            )}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Active Mentors ─────────────────────────────────────────────── */}
      {pageTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <Card padding="none">
            <div className="px-4 py-3 border-b border-[var(--color-line)]">
              <CardTitle>Mentors</CardTitle>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} />)}
              </div>
            ) : !mentors?.data.length ? (
              <div className="p-4">
                <EmptyState icon={<UsersFour size={24} />} heading="No mentors yet"
                  body="Approve mentor applications to see mentors here." />
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {mentors.data.map(mentor => (
                  <button key={mentor.id} onClick={() => selectMentor(mentor)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-elev)] transition-colors ${
                      selectedMentor?.id === mentor.id ? 'bg-[var(--color-elev)]' : ''
                    }`}
                  >
                    <Avatar firstName={mentor.firstName} lastName={mentor.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">{mentor.firstName} {mentor.lastName}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">{mentor.email}</p>
                    </div>
                    <Badge variant="mentor">{mentor.menteeCount}</Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card padding="none">
            <div className="px-4 py-3 border-b border-[var(--color-line)]">
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{selectedMentor ? selectedMentor.firstName : 'Select a mentor'}</CardTitle>
                {selectedMentor && (
                  <div className="flex gap-2">
                    {rightTab === 'mentees'  && <Button size="sm" onClick={() => setAssignMenteeOpen(true)}>Assign mentee</Button>}
                    {rightTab === 'programs' && <Button size="sm" onClick={() => setAssignProgramOpen(true)}>Add to program</Button>}
                  </div>
                )}
              </div>
              {selectedMentor && (
                <div className="flex gap-1">
                  {(['mentees', 'programs'] as RightTab[]).map(tab => (
                    <button key={tab} onClick={() => setRightTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                        rightTab === tab ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)]'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!selectedMentor ? (
              <div className="p-4"><EmptyState icon={<UsersFour size={24} />} heading="No mentor selected" body="Click a mentor on the left to see their details." /></div>
            ) : rightTab === 'mentees' ? (
              menteesLoading ? (
                <div className="p-4 flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} />)}</div>
              ) : !mentees?.data.length ? (
                <div className="p-4"><EmptyState icon={<UsersFour size={24} />} heading="No mentees assigned" body="Use the assign button to connect this mentor with an entrepreneur." /></div>
              ) : (
                <div className="divide-y divide-[var(--color-line)]">
                  {mentees.data.map(mentee => (
                    <div key={mentee.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-elev)] group transition-colors">
                      <Avatar firstName={mentee.firstName} lastName={mentee.lastName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink)] truncate">{mentee.firstName} {mentee.lastName}</p>
                        <p className="text-xs text-[var(--color-ink-faint)]">{mentee.county ?? mentee.email}</p>
                      </div>
                      {mentee.businessStage && <Badge variant="default">{mentee.businessStage}</Badge>}
                      <button
                        onClick={() => setRemoveTarget({ mentorId: selectedMentor.id, menteeId: mentee.id, name: `${mentee.firstName} ${mentee.lastName}` })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-inset)] text-[var(--color-error)]"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              programsLoading ? (
                <div className="p-4 flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} />)}</div>
              ) : !mentorPrograms?.data.length ? (
                <div className="p-4"><EmptyState icon={<Binoculars size={24} />} heading="No programs assigned" body="Use the 'Add to program' button to link this mentor to a program." /></div>
              ) : (
                <div className="divide-y divide-[var(--color-line)]">
                  {mentorPrograms.data.map(pm => (
                    <div key={pm.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-elev)] group transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-elev)] flex items-center justify-center shrink-0">
                        <Binoculars size={14} className="text-[var(--color-ink-soft)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink)] truncate">{pm.program?.name ?? `Program #${pm.programId}`}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={pm.program?.status === 'Active' ? 'active' : 'inactive'}>{pm.program?.status}</Badge>
                          {pm.inviteLink && (
                            <span className="text-xs text-[var(--color-ink-faint)]">· {pm.applicationCount ?? 0} application{(pm.applicationCount ?? 0) !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setRemovePmTarget({ mentorId: selectedMentor.id, programId: pm.programId, name: pm.program?.name ?? `Program #${pm.programId}` })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-inset)] text-[var(--color-error)]"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </div>
      )}

      {/* ── Applications ──────────────────────────────────────────────── */}
      {pageTab === 'applications' && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center gap-2">
            {APP_STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setAppStatus(tab.value)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  appStatus === tab.value ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {appsLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={88} />)}
            </div>
          ) : !applications?.data.length ? (
            <div className="p-6">
              <EmptyState
                icon={appStatus === 'pending' ? <ClockCountdown size={24} /> : appStatus === 'approved' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                heading={`No ${appStatus} applications`}
                body={appStatus === 'pending' ? 'New mentor applications will appear here.' : `No ${appStatus} applications yet.`}
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {applications.data.map(app => (
                <div key={app.id} className="px-5 py-4 hover:bg-[var(--color-elev)] transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar firstName={app.user?.firstName ?? ''} lastName={app.user?.lastName ?? ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {app.user?.firstName} {app.user?.lastName}
                        </p>
                        <p className="text-xs text-[var(--color-ink-faint)]">{app.user?.email}</p>
                        {app.linkedIn && (
                          <a href={app.linkedIn} target="_blank" rel="noopener noreferrer"
                            className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                            <LinkedinLogo size={14} />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-ink-soft)] mb-1.5">
                        {app.currentRole}{app.currentCompany ? ` · ${app.currentCompany}` : ''} &nbsp;·&nbsp; {app.yearsExperience} yr{app.yearsExperience !== 1 ? 's' : ''} exp &nbsp;·&nbsp; {app.availability}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {app.expertise.map(e => (
                          <span key={e} className="px-2 py-0.5 bg-[var(--color-elev)] border border-[var(--color-line)] rounded-full text-[10px] text-[var(--color-ink-soft)]">{e}</span>
                        ))}
                      </div>
                      <p className="text-xs text-[var(--color-ink-faint)] line-clamp-2 leading-relaxed">{app.motivation}</p>
                      {app.status === 'rejected' && app.adminNotes && (
                        <p className="text-xs text-[var(--color-error)] mt-1">Notes: {app.adminNotes}</p>
                      )}
                    </div>

                    {appStatus === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="secondary" onClick={() => { setRejectTarget(app); setRejectNotes('') }}>
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => setApproveTarget(app)}>
                          Approve
                        </Button>
                      </div>
                    )}

                    {appStatus === 'approved' && (
                      <span className="shrink-0 flex items-center gap-1 text-xs text-[var(--color-green-600)] font-medium">
                        <CheckCircle size={14} weight="fill" /> Approved
                      </span>
                    )}

                    {appStatus === 'rejected' && (
                      <span className="shrink-0 flex items-center gap-1 text-xs text-[var(--color-error)] font-medium">
                        <XCircle size={14} weight="fill" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Assign mentee modal ──────────────────────────────────────────── */}
      <Modal
        open={assignMenteeOpen}
        onClose={() => { setAssignMenteeOpen(false); setSelectedMenteeId(null); setMenteeSearch('') }}
        title="Assign a mentee"
        description={`Select an entrepreneur to assign to ${selectedMentor?.firstName}.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignMenteeOpen(false); setSelectedMenteeId(null) }}>Cancel</Button>
            <Button
              disabled={!selectedMenteeId}
              loading={assign.isPending}
              onClick={() => selectedMenteeId && assign.mutate({ mentorId: selectedMentor!.id, menteeId: selectedMenteeId })}
            >Assign</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search entrepreneurs..."
            leftIcon={<MagnifyingGlass size={14} />}
            value={menteeSearch}
            onChange={e => setMenteeSearch(e.target.value)}
          />
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {!allEntrepreneurs?.data.length && (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-6">No entrepreneurs found</p>
            )}
            {allEntrepreneurs?.data.map(u => {
              const isSelected = selectedMenteeId === u.id
              const isAssigned = assignedMenteeIds.has(u.id)
              return (
                <button key={u.id} type="button" disabled={isAssigned}
                  onClick={() => setSelectedMenteeId(isSelected ? null : u.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all',
                    isSelected ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]' : 'hover:bg-[var(--color-elev)] border border-transparent',
                    isAssigned && 'opacity-40 cursor-not-allowed',
                  )}>
                  <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-[var(--color-ink-faint)] truncate">{u.email}</p>
                  </div>
                  {isAssigned && <span className="text-xs text-[var(--color-ink-faint)]">Already assigned</span>}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-forest-500)] flex items-center justify-center">
                      <Check size={11} weight="bold" className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Modal>

      {/* ── Assign program modal ────────────────────────────────────────── */}
      <Modal
        open={assignProgramOpen}
        onClose={() => { setAssignProgramOpen(false); setSelectedProgramId(null) }}
        title="Add mentor to program"
        description={`Select a program to assign ${selectedMentor?.firstName} to.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignProgramOpen(false); setSelectedProgramId(null) }}>Cancel</Button>
            <Button
              disabled={!selectedProgramId}
              loading={assignProgram.isPending}
              onClick={() => selectedProgramId && assignProgram.mutate({ mentorId: selectedMentor!.id, programId: selectedProgramId })}
            >Add to program</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {!allPrograms?.data.length && <p className="text-sm text-[var(--color-ink-faint)] text-center py-6">No programs found</p>}
          {allPrograms?.data.map(p => {
            const isSelected = selectedProgramId === p.id
            const isAssigned = assignedProgramIds.has(p.id)
            return (
              <button key={p.id} type="button" disabled={isAssigned}
                onClick={() => setSelectedProgramId(isSelected ? null : p.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all',
                  isSelected ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]' : 'hover:bg-[var(--color-elev)] border border-transparent',
                  isAssigned && 'opacity-40 cursor-not-allowed',
                )}>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-elev)] flex items-center justify-center shrink-0">
                  <Binoculars size={14} className="text-[var(--color-ink-soft)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.name}</p>
                  <Badge variant={p.status === 'Active' ? 'active' : 'inactive'}>{p.status}</Badge>
                </div>
                {isAssigned && <span className="text-xs text-[var(--color-ink-faint)]">Already assigned</span>}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[var(--color-forest-500)] flex items-center justify-center shrink-0">
                    <Check size={11} weight="bold" className="text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* ── Approve application modal ───────────────────────────────────── */}
      <Modal
        open={!!approveTarget}
        onClose={() => { setApproveTarget(null); setApproveProgramId(null) }}
        title="Approve mentor application"
        description={`Approve ${approveTarget?.user?.firstName} ${approveTarget?.user?.lastName} as a Flarehub mentor. They will be notified by email.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setApproveTarget(null); setApproveProgramId(null) }}>Cancel</Button>
            <Button
              loading={approveMut.isPending}
              onClick={() => approveTarget && approveMut.mutate({ id: approveTarget.id, programId: approveProgramId ?? undefined })}
            >Approve</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[var(--color-ink-soft)]">Optionally assign them to a program right away:</p>
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => setApproveProgramId(null)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-left transition-all text-sm border',
                approveProgramId === null ? 'bg-[var(--color-forest-50)] border-[var(--color-forest-500)] text-[var(--color-forest-600)]' : 'border-transparent hover:bg-[var(--color-elev)] text-[var(--color-ink-soft)]',
              )}
            >
              No program assignment yet
            </button>
            {allPrograms?.data.map(p => (
              <button key={p.id} type="button"
                onClick={() => setApproveProgramId(approveProgramId === p.id ? null : p.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-left transition-all border',
                  approveProgramId === p.id ? 'bg-[var(--color-forest-50)] border-[var(--color-forest-500)]' : 'border-transparent hover:bg-[var(--color-elev)]',
                )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">{p.name}</p>
                </div>
                {approveProgramId === p.id && (
                  <div className="w-4 h-4 rounded-full bg-[var(--color-forest-500)] flex items-center justify-center shrink-0">
                    <Check size={9} weight="bold" className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Reject application modal ────────────────────────────────────── */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectNotes('') }}
        title="Reject application"
        description={`Reject ${rejectTarget?.user?.firstName}'s mentor application. They will be notified by email.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectNotes('') }}>Cancel</Button>
            <Button
              variant="danger"
              loading={rejectMut.isPending}
              onClick={() => rejectTarget && rejectMut.mutate({ id: rejectTarget.id, notes: rejectNotes || undefined })}
            >Reject</Button>
          </>
        }
      >
        <Textarea
          label="Notes for the applicant (optional)"
          rows={3}
          placeholder="Let them know why or what they could improve..."
          value={rejectNotes}
          onChange={e => setRejectNotes(e.target.value)}
        />
      </Modal>

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && remove.mutate({ mentorId: removeTarget.mentorId, menteeId: removeTarget.menteeId })}
        title="Remove mentee"
        description={`Remove ${removeTarget?.name} from ${selectedMentor?.firstName}'s mentees?`}
        confirmLabel="Remove"
        danger
        loading={remove.isPending}
      />

      <ConfirmModal
        open={!!removePmTarget}
        onClose={() => setRemovePmTarget(null)}
        onConfirm={() => removePmTarget && removeProgram.mutate({ mentorId: removePmTarget.mentorId, programId: removePmTarget.programId })}
        title="Remove from program"
        description={`Remove ${selectedMentor?.firstName} from "${removePmTarget?.name}"? Their invite link will also be deleted.`}
        confirmLabel="Remove"
        danger
        loading={removeProgram.isPending}
      />
    </>
  )
}
