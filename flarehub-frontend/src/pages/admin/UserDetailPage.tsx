import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, UserCircle, MagnifyingGlass, Check } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { NativeSelect } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import type { ApiSuccess, ApiPaginated, User, UserRole } from '@/types/api'

interface AssignedMentor {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface MentorWithCount extends User {
  menteeCount: number
}

interface FullUser extends User {
  applications:        Array<{ id: number; status: string; program: { name: string }; appliedAt: string }>
  smartGoal:           unknown
  milestonePlan:       unknown
  marketResearch:      unknown
  menteeRelationships: Array<{ mentor: AssignedMentor }>
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'mentor',       label: 'Mentor'       },
  { value: 'admin',        label: 'Admin'         },
  { value: 'super_admin',  label: 'Super Admin'   },
]

export default function UserDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc       = useQueryClient()

  const [roleOpen, setRoleOpen]         = useState(false)
  const [newRole, setNewRole]           = useState<UserRole>('entrepreneur')
  const [verifyConfirm, setVerify]      = useState(false)
  const [mentorConfirm, setMentor]      = useState(false)
  const [assignMentorOpen, setAssignMentorOpen] = useState(false)
  const [removeMentorConfirm, setRemoveMentorConfirm] = useState(false)
  const [mentorSearch, setMentorSearch] = useState('')
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)
  const debouncedSearch                 = useDebounce(mentorSearch)

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn:  () => api.get<ApiSuccess<FullUser>>(`/admin/users/${id}`).then(r => r.data.data),
  })

  const { data: mentors } = useQuery({
    queryKey: ['admin', 'mentors-list', debouncedSearch],
    queryFn:  () => api.get<ApiPaginated<MentorWithCount>>('/admin/mentors', {
      params: { limit: 50 },
    }).then(r => r.data.data),
    enabled: assignMentorOpen,
  })

  const refetch = () => qc.invalidateQueries({ queryKey: ['admin', 'user', id] })

  const verify = useMutation({
    mutationFn: (isVerified: boolean) => api.patch(`/admin/users/${id}/verify`, { isVerified }),
    onSuccess: () => { toast.success('Verification updated'); refetch(); setVerify(false) },
    onError:   () => toast.error('Update failed'),
  })

  const setMentorStatus = useMutation({
    mutationFn: (isMentor: boolean) => api.patch(`/admin/users/${id}/mentor-status`, { isMentor }),
    onSuccess: () => { toast.success('Mentor status updated'); refetch(); setMentor(false) },
    onError:   () => toast.error('Update failed'),
  })

  const changeRole = useMutation({
    mutationFn: (role: UserRole) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); refetch(); setRoleOpen(false) },
    onError:   () => toast.error('Update failed'),
  })

  const assignMentor = useMutation({
    mutationFn: (mentorId: string) =>
      api.post('/admin/mentor-assignments', { mentorId, menteeId: id }),
    onSuccess: () => {
      toast.success('Mentor assigned')
      refetch()
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setAssignMentorOpen(false)
      setSelectedMentorId(null)
      setMentorSearch('')
    },
    onError: () => toast.error('Assignment failed'),
  })

  const removeMentor = useMutation({
    mutationFn: () => {
      const mentorId = user?.menteeRelationships?.[0]?.mentor.id
      return api.delete('/admin/mentor-assignments', { data: { mentorId, menteeId: id } })
    },
    onSuccess: () => {
      toast.success('Mentor removed')
      refetch()
      qc.invalidateQueries({ queryKey: ['admin', 'mentors'] })
      setRemoveMentorConfirm(false)
    },
    onError: () => toast.error('Could not remove'),
  })

  if (isLoading) return <Skeleton height={400} />
  if (!user)     return null

  const assignedMentor = user.menteeRelationships?.[0]?.mentor ?? null

  // Filter mentor list by search
  const filteredMentors = (mentors ?? []).filter(m => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/admin/users')} className="mb-5">
        Back to users
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left col ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="xl" />
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[var(--color-ink-faint)]">{user.email}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Badge variant={statusVariant(user.role)}>{user.role}</Badge>
                {user.isMentor && <Badge variant="mentor">Mentor</Badge>}
                <Badge variant={user.isVerified ? 'approved' : 'pending'}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-line)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">County</span>
                <span className="text-[var(--color-ink)]">{user.county ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">Business</span>
                <span className="text-[var(--color-ink)]">{user.businessName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">Stage</span>
                <span className="text-[var(--color-ink)]">{user.businessStage ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-mute)]">Joined</span>
                <span className="text-[var(--color-ink)]">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </Card>

          {/* ── Mentor assignment card ─────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Assigned mentor</CardTitle></CardHeader>

            {assignedMentor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-forest-50)] border border-[var(--color-forest-100)]">
                  <Avatar firstName={assignedMentor.firstName} lastName={assignedMentor.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {assignedMentor.firstName} {assignedMentor.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)] truncate">{assignedMentor.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary" size="sm" className="flex-1"
                    onClick={() => setAssignMentorOpen(true)}
                  >
                    Change mentor
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-[var(--color-error)]"
                    onClick={() => setRemoveMentorConfirm(true)}
                    loading={removeMentor.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-elev)] border border-dashed border-[var(--color-line)]">
                  <UserCircle size={18} className="text-[var(--color-ink-faint)] shrink-0" />
                  <p className="text-sm text-[var(--color-ink-faint)]">No mentor assigned yet</p>
                </div>
                <Button
                  size="sm" className="w-full"
                  onClick={() => setAssignMentorOpen(true)}
                >
                  Assign mentor
                </Button>
              </div>
            )}
          </Card>

          {/* ── Admin actions ──────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" onClick={() => setVerify(true)} loading={verify.isPending}>
                {user.isVerified ? 'Remove verification' : 'Verify user'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setMentor(true)} loading={setMentorStatus.isPending}>
                {user.isMentor ? 'Remove mentor status' : 'Make mentor'}
              </Button>
              <Button
                variant="secondary" size="sm"
                onClick={() => { setNewRole(user.role); setRoleOpen(true) }}
              >
                Change role
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Right col ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
            {!user.applications?.length ? (
              <p className="text-sm text-[var(--color-ink-faint)]">No applications.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {user.applications.map(a => (
                  <div key={a.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-line)] last:border-0">
                    <p className="text-sm text-[var(--color-ink)]">{a.program.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-ink-faint)]">{formatDate(a.appliedAt)}</span>
                      <Badge variant={statusVariant(a.status as never)}>{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Submission status</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Smart Goals',     done: !!user.smartGoal },
                { label: 'Milestone Plan',  done: !!user.milestonePlan },
                { label: 'Market Research', done: !!user.marketResearch },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-[var(--radius-md)] bg-[var(--color-elev)]">
                  <p className="text-xs text-[var(--color-ink-mute)]">{s.label}</p>
                  <Badge variant={s.done ? 'approved' : 'pending'} className="mt-1">
                    {s.done ? 'Submitted' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Assign mentor modal ──────────────────────────────────────── */}
      <Modal
        open={assignMentorOpen}
        onClose={() => { setAssignMentorOpen(false); setSelectedMentorId(null); setMentorSearch('') }}
        title="Assign a mentor"
        description={`Pick a mentor for ${user.firstName} ${user.lastName}.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignMentorOpen(false); setSelectedMentorId(null) }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedMentorId}
              loading={assignMentor.isPending}
              onClick={() => selectedMentorId && assignMentor.mutate(selectedMentorId)}
            >
              Assign
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search mentors..."
            leftIcon={<MagnifyingGlass size={14} />}
            value={mentorSearch}
            onChange={e => setMentorSearch(e.target.value)}
          />

          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {filteredMentors.length === 0 && (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-6">No mentors found</p>
            )}
            {filteredMentors.map(mentor => {
              const isSelected = selectedMentorId === mentor.id
              const isCurrent  = assignedMentor?.id === mentor.id

              return (
                <button
                  key={mentor.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedMentorId(isSelected ? null : mentor.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all duration-[var(--duration-fast)]',
                    isSelected
                      ? 'bg-[var(--color-forest-50)] border border-[var(--color-forest-500)]'
                      : 'hover:bg-[var(--color-elev)] border border-transparent',
                    isCurrent && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Avatar firstName={mentor.firstName} lastName={mentor.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {mentor.firstName} {mentor.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)] truncate">{mentor.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent && (
                      <span className="text-xs text-[var(--color-ink-faint)]">Current</span>
                    )}
                    <span className="text-xs text-[var(--color-ink-faint)]">
                      {(mentor as MentorWithCount).menteeCount} mentee{(mentor as MentorWithCount).menteeCount !== 1 ? 's' : ''}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-forest-500)] flex items-center justify-center shrink-0">
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

      {/* ── Remove mentor confirm ────────────────────────────────────── */}
      <ConfirmModal
        open={removeMentorConfirm}
        onClose={() => setRemoveMentorConfirm(false)}
        onConfirm={() => removeMentor.mutate()}
        title="Remove mentor assignment"
        description={`Remove ${assignedMentor?.firstName} ${assignedMentor?.lastName} as ${user.firstName}'s mentor?`}
        confirmLabel="Remove"
        danger
        loading={removeMentor.isPending}
      />

      {/* ── Change role modal ────────────────────────────────────────── */}
      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Change user role"
        description={`Current role: ${user.role}. Choose a new role carefully.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button loading={changeRole.isPending} onClick={() => changeRole.mutate(newRole)} disabled={newRole === user.role}>
              Update role
            </Button>
          </>
        }
      >
        <NativeSelect label="New role" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </NativeSelect>
      </Modal>

      {/* ── Verify confirm ───────────────────────────────────────────── */}
      <ConfirmModal
        open={verifyConfirm}
        onClose={() => setVerify(false)}
        onConfirm={() => verify.mutate(!user.isVerified)}
        title={user.isVerified ? 'Remove verification' : 'Verify user'}
        description={user.isVerified
          ? `Remove verified status from ${user.firstName}?`
          : `Mark ${user.firstName} as a verified user?`}
        confirmLabel={user.isVerified ? 'Remove' : 'Verify'}
        danger={user.isVerified}
        loading={verify.isPending}
      />

      {/* ── Mentor status confirm ────────────────────────────────────── */}
      <ConfirmModal
        open={mentorConfirm}
        onClose={() => setMentor(false)}
        onConfirm={() => setMentorStatus.mutate(!user.isMentor)}
        title={user.isMentor ? 'Remove mentor status' : 'Make mentor'}
        description={user.isMentor
          ? `Remove mentor access from ${user.firstName}? They will lose access to the mentor dashboard.`
          : `Give ${user.firstName} mentor access? They will be able to manage mentees.`}
        confirmLabel={user.isMentor ? 'Remove' : 'Make mentor'}
        danger={user.isMentor}
        loading={setMentorStatus.isPending}
      />
    </>
  )
}
