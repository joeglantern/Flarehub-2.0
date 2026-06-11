import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, Phone, Buildings, SealCheck, PencilSimple,
  LockSimple, ClockCounterClockwise, Bell,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/lib/push'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { ProfileAvatar } from '@/components/shared/ProfileAvatar'
import { toast } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { timeAgo, formatDate, cn } from '@/lib/utils'
import type { ApiSuccess, User, ActivityItem } from '@/types/api'

const profileSchema = z.object({
  firstName:           z.string().min(1, 'Required'),
  lastName:            z.string().min(1, 'Required'),
  phone:               z.string().optional(),
  county:              z.string().optional(),
  gender:              z.enum(['Male', 'Female', 'Other', 'Unknown']).optional(),
  businessName:        z.string().optional(),
  businessStage:       z.enum(['Idea', 'Prototype', 'MVP', 'Revenue']).optional(),
  businessDescription: z.string().optional(),
})

const passwordSchema = z.object({
  password:        z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

type ProfileForm  = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const activityColor: Record<string, string> = {
  application: 'bg-[var(--color-forest-500)]',
  submission:  'bg-[var(--color-info)]',
  evidence:    'bg-[var(--color-terra-500)]',
  document:    'bg-[var(--color-sun)]',
}

export default function ProfilePage() {
  const { setUser }                 = useAuthStore()
  const qc                          = useQueryClient()
  const [editOpen, setEditOpen]     = useState(false)
  const [pwdOpen, setPwdOpen]       = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => api.get<ApiSuccess<User>>('/users/me').then(r => r.data.data),
  })

  const { data: activity } = useQuery({
    queryKey: ['activity'],
    queryFn:  () => api.get<ApiSuccess<ActivityItem[]>>('/users/me/activity').then(r => r.data.data),
  })

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      firstName:           profile.firstName,
      lastName:            profile.lastName,
      phone:               profile.phone ?? '',
      county:              profile.county ?? '',
      gender:              (profile.gender as ProfileForm['gender']) ?? 'Unknown',
      businessName:        profile.businessName ?? '',
      businessStage:       (profile.businessStage as ProfileForm['businessStage']) ?? undefined,
      businessDescription: profile.businessDescription ?? '',
    } : undefined,
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const saveProfile = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch<ApiSuccess<User>>('/users/me', data).then(r => r.data.data),
    onSuccess: (updated) => {
      toast.success('Profile saved')
      setUser(updated)
      qc.invalidateQueries({ queryKey: ['profile'] })
      setEditOpen(false)
    },
    onError: () => toast.error('Could not save profile'),
  })

  const changePassword = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Password changed'); setPwdOpen(false); passwordForm.reset() },
    onError:   () => toast.error('Could not change password'),
  })

  useEffect(() => { isPushSubscribed().then(setPushEnabled) }, [])

  const togglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
        toast.success('Push notifications disabled')
      } else {
        const ok = await subscribeToPush()
        if (ok) { setPushEnabled(true); toast.success('Push notifications enabled') }
        else     toast.error('Could not enable push notifications')
      }
    } finally { setPushLoading(false) }
  }

  if (isLoading) return <Skeleton className="h-96 rounded-[20px]" />
  if (!profile)  return null

  const isEnt = profile.role === 'entrepreneur'

  return (
    <div className="page-enter px-4 lg:px-7 py-6 lg:py-8 max-w-4xl mx-auto space-y-5 pb-24 lg:pb-8">

      {/* Cover + profile card */}
      <div className="card overflow-hidden">
        {/* Cover band */}
        <div className="relative h-32 bg-[var(--color-forest-50)] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 128" preserveAspectRatio="xMidYMid slice" fill="none">
            <circle cx="680" cy="64"  r="100" fill="#d0ecdb" opacity="0.4"/>
            <circle cx="680" cy="64"  r="68"  fill="#1d6f42" opacity="0.08"/>
            <path d="M0 96 Q160 72 320 88 Q480 104 640 76 Q720 62 800 74 L800 128 L0 128 Z" fill="#1d6f42" opacity="0.07"/>
            <circle cx="80"  cy="32" r="4" fill="#c4522a" opacity="0.3"/>
            <circle cx="360" cy="24" r="5" fill="#d0ecdb" opacity="0.6"/>
          </svg>
        </div>

        {/* Profile details */}
        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <ProfileAvatar
              src={profile.profilePic}
              firstName={profile.firstName}
              lastName={profile.lastName}
              size="xl"
              editable
              className="ring-4 ring-white"
            />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Button variant="secondary" size="sm" icon={<LockSimple size={13} />} onClick={() => setPwdOpen(true)}>
                Password
              </Button>
              <Button variant="secondary" size="sm" icon={<Bell size={13} />} disabled={pushLoading} onClick={togglePush}>
                {pushEnabled ? 'Disable push' : 'Enable push'}
              </Button>
              <Button size="sm" icon={<PencilSimple size={13} />} onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
            </div>
          </div>

          {/* Name + badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[28px] font-bold text-[var(--color-ink)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.isVerified && (
                <SealCheck size={22} weight="fill" className="text-[var(--color-forest-500)]" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={profile.isMentor ? 'mentor' : profile.role === 'admin' || profile.role === 'super_admin' ? 'admin' : 'default'}>
                {profile.isMentor ? 'Mentor' : profile.role.replace('_', ' ')}
              </Badge>
              {profile.businessStage && <Badge variant="review">{profile.businessStage}</Badge>}
              {!profile.isVerified && <Badge variant="pending">Pending verification</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--color-ink-mute)]">
              {profile.businessName && (
                <span className="flex items-center gap-1.5"><Buildings size={14} />{profile.businessName}</span>
              )}
              {profile.county && (
                <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.county}</span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5"><Phone size={14} />{profile.phone}</span>
              )}
              <span className="text-[11px] font-mono">Joined {formatDate(profile.createdAt)}</span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex gap-0 mt-5 pt-5 border-t border-[var(--color-line)]">
            {[
              { label: 'Email',   value: profile.email },
              { label: 'Role',    value: profile.isMentor ? 'Mentor' : profile.role.replace('_', ' ') },
              { label: 'Profile', value: profile.profileComplete ? 'Complete' : 'Incomplete' },
            ].map((s, i) => (
              <div key={i} className={cn('flex-1 text-center px-4', i > 0 && 'border-l border-[var(--color-line)]')}>
                <p className="text-[11px] font-mono uppercase text-[var(--color-ink-faint)] mb-0.5">{s.label}</p>
                <p className="text-[13px] font-semibold text-[var(--color-ink)] truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* About */}
        <div className="card p-5">
          <p className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)] mb-3">About</p>
          {isEnt ? (
            profile.businessDescription ? (
              <p className="text-[13px] text-[var(--color-ink-mute)] leading-relaxed">{profile.businessDescription}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] text-[var(--color-ink-faint)] italic">No business description yet.</p>
                <button onClick={() => setEditOpen(true)}
                  className="text-[12px] font-semibold text-[var(--color-forest-600)] hover:text-[var(--color-forest-700)] transition-colors">
                  Add one →
                </button>
              </div>
            )
          ) : (
            <p className="text-[13px] text-[var(--color-ink-faint)] italic">
              {profile.role === 'mentor' ? 'Mentor account' : profile.role.replace('_', ' ')}
            </p>
          )}
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClockCounterClockwise size={14} className="text-[var(--color-ink-faint)]" />
            <p className="font-mono text-[10px] uppercase text-[var(--color-ink-faint)]">Activity</p>
          </div>
          {!activity?.length ? (
            <p className="text-[13px] text-[var(--color-ink-faint)]">No recent activity.</p>
          ) : (
            <div className="space-y-0">
              {activity.slice(0, 12).map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-[var(--color-line)] last:border-0">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', activityColor[item.type] ?? 'bg-[var(--color-ink-faint)]')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--color-ink)] leading-snug">{item.description}</p>
                    <p className="text-[11px] font-mono text-[var(--color-ink-faint)] mt-0.5">{timeAgo(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button loading={saveProfile.isPending} disabled={!profileForm.formState.isDirty}
              onClick={profileForm.handleSubmit(d => saveProfile.mutate(d))}>
              Save changes
            </Button>
          </>
        }>
        <form className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First name" required error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')} />
            <Input label="Last name" required error={profileForm.formState.errors.lastName?.message} {...profileForm.register('lastName')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Phone" type="tel" {...profileForm.register('phone')} />
            <Input label="County" {...profileForm.register('county')} />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-[var(--color-ink-mute)] block mb-1.5">Gender</label>
            <select {...profileForm.register('gender')}
              className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] text-[var(--color-ink)]">
              <option value="Unknown">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {isEnt && (
            <>
              <div>
                <label className="text-[11px] font-mono uppercase text-[var(--color-ink-mute)] block mb-1.5">Business stage</label>
                <select {...profileForm.register('businessStage')}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-[var(--color-line)] bg-white focus:outline-none focus:border-[var(--color-forest-500)] text-[var(--color-ink)]">
                  <option value="">Select stage…</option>
                  <option value="Idea">Idea</option>
                  <option value="Prototype">Prototype</option>
                  <option value="MVP">MVP</option>
                  <option value="Revenue">Revenue</option>
                </select>
              </div>
              <Input label="Business name" {...profileForm.register('businessName')} />
              <Textarea label="Business description" rows={3}
                placeholder="Describe your product or service, your customers, and the problem you solve…"
                {...profileForm.register('businessDescription')} />
            </>
          )}
        </form>
      </Modal>

      {/* Password modal */}
      <Modal open={pwdOpen} onClose={() => { setPwdOpen(false); passwordForm.reset() }}
        title="Change password" description="Your new password must be at least 8 characters." size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwdOpen(false)}>Cancel</Button>
            <Button loading={changePassword.isPending}
              onClick={passwordForm.handleSubmit(d => changePassword.mutate(d))}>
              Update password
            </Button>
          </>
        }>
        <div className="flex flex-col gap-4">
          <Input label="New password" type="password" required
            error={passwordForm.formState.errors.password?.message} {...passwordForm.register('password')} />
          <Input label="Confirm password" type="password" required
            error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
        </div>
      </Modal>
    </div>
  )
}
