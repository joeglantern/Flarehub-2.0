import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UsersFour, MagnifyingGlass, Trash, Check, Binoculars } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import { useDebounce } from '@/hooks/useDebounce'
import type { ApiPaginated, ApiSuccess, User, Program, ProgramMentor } from '@/types/api'

interface MentorWithCount extends User {
  menteeCount: number
}

interface MenteeRow extends User {
  assignedAt: string
}

type RightTab = 'mentees' | 'programs'

export default function MentorManagementPage() {
  const [selectedMentor, setSelectedMentor]   = useState<MentorWithCount | null>(null)
  const [rightTab, setRightTab]               = useState<RightTab>('mentees')
  const [assignMenteeOpen, setAssignMenteeOpen] = useState(false)
  const [assignProgramOpen, setAssignProgramOpen] = useState(false)
  const [removeTarget, setRemoveTarget]       = useState<{ mentorId: string; menteeId: string; name: string } | null>(null)
  const [removePmTarget, setRemovePmTarget]   = useState<{ programId: number; mentorId: string; name: string } | null>(null)
  const [menteeSearch, setMenteeSearch]       = useState('')
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null)
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const debounced                             = useDebounce(menteeSearch)
  const qc                                   = useQueryClient()

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
    enabled: assignProgramOpen,
  })

  const assign = useMutation({
    mutationFn: ({ mentorId, menteeId }: { mentorId: string; menteeId: string }) =>
      api.post('/admin/mentor-assignments', { mentorId, menteeId }),
    onSuccess: () => {
      toast.success('Mentee assigned')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-mentees'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setAssignMenteeOpen(false)
      setSelectedMenteeId(null)
      setMenteeSearch('')
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
      setAssignProgramOpen(false)
      setSelectedProgramId(null)
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

  const assignedMenteeIds    = new Set(mentees?.data.map(m => m.id) ?? [])
  const assignedProgramIds   = new Set(mentorPrograms?.data.map(p => p.programId) ?? [])

  const selectMentor = (m: MentorWithCount) => {
    setSelectedMentor(m)
    setRightTab('mentees')
  }

  return (
    <>
      <PageHeader title="Mentor Management" subtitle="Assign mentors to entrepreneurs and programs." />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: Mentor list */}
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
                body="Mark users as mentors in User Management." />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {mentors.data.map(mentor => (
                <button
                  key={mentor.id}
                  onClick={() => selectMentor(mentor)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-elev)] transition-colors ${
                    selectedMentor?.id === mentor.id ? 'bg-[var(--color-elev)]' : ''
                  }`}
                >
                  <Avatar firstName={mentor.firstName} lastName={mentor.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {mentor.firstName} {mentor.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">{mentor.email}</p>
                  </div>
                  <Badge variant="mentor">{mentor.menteeCount}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right panel */}
        <Card padding="none">
          {/* Header + tabs */}
          <div className="px-4 py-3 border-b border-[var(--color-line)]">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>
                {selectedMentor ? selectedMentor.firstName : 'Select a mentor'}
              </CardTitle>
              {selectedMentor && (
                <div className="flex gap-2">
                  {rightTab === 'mentees' && (
                    <Button size="sm" onClick={() => setAssignMenteeOpen(true)}>Assign mentee</Button>
                  )}
                  {rightTab === 'programs' && (
                    <Button size="sm" onClick={() => setAssignProgramOpen(true)}>Add to program</Button>
                  )}
                </div>
              )}
            </div>
            {selectedMentor && (
              <div className="flex gap-1">
                {(['mentees', 'programs'] as RightTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                      rightTab === tab
                        ? 'bg-[var(--color-ink)] text-white'
                        : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab content */}
          {!selectedMentor ? (
            <div className="p-4">
              <EmptyState icon={<UsersFour size={24} />} heading="No mentor selected"
                body="Click a mentor on the left to see their details." />
            </div>
          ) : rightTab === 'mentees' ? (
            menteesLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} />)}
              </div>
            ) : !mentees?.data.length ? (
              <div className="p-4">
                <EmptyState icon={<UsersFour size={24} />} heading="No mentees assigned"
                  body="Use the assign button to connect this mentor with an entrepreneur." />
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {mentees.data.map(mentee => (
                  <div key={mentee.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-elev)] group transition-colors">
                    <Avatar firstName={mentee.firstName} lastName={mentee.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                        {mentee.firstName} {mentee.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-ink-faint)]">{mentee.county ?? mentee.email}</p>
                    </div>
                    {mentee.businessStage && <Badge variant="default">{mentee.businessStage}</Badge>}
                    <button
                      onClick={() => setRemoveTarget({
                        mentorId: selectedMentor.id,
                        menteeId: mentee.id,
                        name: `${mentee.firstName} ${mentee.lastName}`,
                      })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-inset)] text-[var(--color-error)]"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Programs tab */
            programsLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={52} />)}
              </div>
            ) : !mentorPrograms?.data.length ? (
              <div className="p-4">
                <EmptyState icon={<Binoculars size={24} />} heading="No programs assigned"
                  body="Use the 'Add to program' button to link this mentor to a program." />
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {mentorPrograms.data.map(pm => (
                  <div key={pm.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-elev)] group transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-elev)] flex items-center justify-center shrink-0">
                      <Binoculars size={14} className="text-[var(--color-ink-soft)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                        {pm.program?.name ?? `Program #${pm.programId}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={pm.program?.status === 'Active' ? 'active' : 'inactive'}>
                          {pm.program?.status}
                        </Badge>
                        {pm.inviteLink && (
                          <span className="text-xs text-[var(--color-ink-faint)]">
                            · {pm.applicationCount ?? 0} application{(pm.applicationCount ?? 0) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setRemovePmTarget({
                        mentorId: selectedMentor.id,
                        programId: pm.programId,
                        name: pm.program?.name ?? `Program #${pm.programId}`,
                      })}
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

      {/* Assign mentee modal */}
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
            >
              Assign
            </Button>
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
                <button
                  key={u.id}
                  type="button"
                  disabled={isAssigned}
                  onClick={() => setSelectedMenteeId(isSelected ? null : u.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all',
                    isSelected
                      ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]'
                      : 'hover:bg-[var(--color-elev)] border border-transparent',
                    isAssigned && 'opacity-40 cursor-not-allowed',
                  )}
                >
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

      {/* Assign program modal */}
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
              onClick={() => selectedProgramId && assignProgram.mutate({
                mentorId: selectedMentor!.id,
                programId: selectedProgramId,
              })}
            >
              Add to program
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {!allPrograms?.data.length && (
            <p className="text-sm text-[var(--color-ink-faint)] text-center py-6">No programs found</p>
          )}
          {allPrograms?.data.map(p => {
            const isSelected  = selectedProgramId === p.id
            const isAssigned  = assignedProgramIds.has(p.id)
            return (
              <button
                key={p.id}
                type="button"
                disabled={isAssigned}
                onClick={() => setSelectedProgramId(isSelected ? null : p.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all',
                  isSelected
                    ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]'
                    : 'hover:bg-[var(--color-elev)] border border-transparent',
                  isAssigned && 'opacity-40 cursor-not-allowed',
                )}
              >
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
