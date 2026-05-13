import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UsersFour, MagnifyingGlass, Trash, Check } from '@phosphor-icons/react'
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
import type { ApiPaginated, User } from '@/types/api'

interface MentorWithCount extends User {
  menteeCount: number
}

interface MenteeRow extends User {
  assignedAt: string
}

export default function MentorManagementPage() {
  const [selectedMentor, setSelectedMentor] = useState<MentorWithCount | null>(null)
  const [assignOpen, setAssignOpen]         = useState(false)
  const [removeTarget, setRemoveTarget]     = useState<{ mentorId: string; menteeId: string; name: string } | null>(null)
  const [menteeSearch, setMenteeSearch]     = useState('')
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null)
  const debounced                           = useDebounce(menteeSearch)
  const qc                                  = useQueryClient()

  const { data: mentors, isLoading } = useQuery({
    queryKey: ['admin', 'mentors'],
    queryFn:  () => api.get<ApiPaginated<MentorWithCount>>('/admin/mentors', { params: { limit: 50 } }).then(r => r.data),
  })

  const { data: mentees, isLoading: menteesLoading } = useQuery({
    queryKey: ['admin', 'mentor-mentees', selectedMentor?.id],
    queryFn:  () =>
      api.get<ApiPaginated<MenteeRow>>(`/admin/mentors/${selectedMentor!.id}/mentees`, { params: { limit: 50 } })
        .then(r => r.data),
    enabled: !!selectedMentor,
  })

  const { data: allEntrepreneurs } = useQuery({
    queryKey: ['admin', 'users', 'entrepreneurs', debounced],
    queryFn:  () =>
      api.get<ApiPaginated<User>>('/admin/users', {
        params: { role: 'entrepreneur', search: debounced || undefined, limit: 20 },
      }).then(r => r.data),
    enabled: assignOpen,
  })

  const assign = useMutation({
    mutationFn: ({ mentorId, menteeId }: { mentorId: string; menteeId: string }) =>
      api.post('/admin/mentor-assignments', { mentorId, menteeId }),
    onSuccess: () => {
      toast.success('Mentee assigned')
      qc.invalidateQueries({ queryKey: ['admin', 'mentor-mentees'] })
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setAssignOpen(false)
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

  // IDs of mentees already assigned to the selected mentor
  const assignedMenteeIds = new Set(mentees?.data.map(m => m.id) ?? [])

  return (
    <>
      <PageHeader title="Mentor Management" subtitle="Assign mentors to entrepreneurs and manage their connections." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  onClick={() => setSelectedMentor(mentor)}
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
                  <Badge variant="mentor">{mentor.menteeCount} mentee{mentor.menteeCount !== 1 ? 's' : ''}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Mentees for selected mentor */}
        <Card padding="none">
          <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
            <CardTitle>
              {selectedMentor
                ? `${selectedMentor.firstName}'s mentees`
                : 'Select a mentor'}
            </CardTitle>
            {selectedMentor && (
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                Assign mentee
              </Button>
            )}
          </div>

          {!selectedMentor ? (
            <div className="p-4">
              <EmptyState icon={<UsersFour size={24} />} heading="No mentor selected"
                body="Click a mentor on the left to see their mentees." />
            </div>
          ) : menteesLoading ? (
            <div className="p-4 flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} />)}
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
                  {mentee.businessStage && (
                    <Badge variant="default">{mentee.businessStage}</Badge>
                  )}
                  <button
                    onClick={() => setRemoveTarget({
                      mentorId: selectedMentor.id,
                      menteeId: mentee.id,
                      name: `${mentee.firstName} ${mentee.lastName}`,
                    })}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--color-inset)] text-[var(--color-error)]"
                    aria-label="Remove assignment"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        onClose={() => { setAssignOpen(false); setSelectedMenteeId(null); setMenteeSearch('') }}
        title="Assign a mentee"
        description={`Select an entrepreneur to assign to ${selectedMentor?.firstName}.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignOpen(false); setSelectedMenteeId(null) }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedMenteeId}
              loading={assign.isPending}
              onClick={() => selectedMenteeId && assign.mutate({
                mentorId: selectedMentor!.id,
                menteeId: selectedMenteeId,
              })}
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
              const isSelected  = selectedMenteeId === u.id
              const isAssigned  = assignedMenteeIds.has(u.id)
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={isAssigned}
                  onClick={() => setSelectedMenteeId(isSelected ? null : u.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all duration-[var(--duration-fast)]',
                    isSelected
                      ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]'
                      : 'hover:bg-[var(--color-elev)] border border-transparent',
                    isAssigned && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)] truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isAssigned && (
                      <span className="text-xs text-[var(--color-ink-faint)]">Already assigned</span>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-forest-500)] flex items-center justify-center">
                        <Check size={11} weight="bold" className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && remove.mutate({ mentorId: removeTarget.mentorId, menteeId: removeTarget.menteeId })}
        title="Remove assignment"
        description={`Remove ${removeTarget?.name} from ${selectedMentor?.firstName}'s mentees?`}
        confirmLabel="Remove"
        danger
        loading={remove.isPending}
      />
    </>
  )
}
