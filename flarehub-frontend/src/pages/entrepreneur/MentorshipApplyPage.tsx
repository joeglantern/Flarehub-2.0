import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Flame, ArrowLeft, CheckCircle, Warning, Envelope } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import type { ApiSuccess, MentorApplyInfo } from '@/types/api'

export default function MentorshipApplyPage() {
  const { token }   = useParams<{ token: string }>()
  const navigate    = useNavigate()
  const { user }    = useAuthStore()
  const [message, setMessage] = useState('')
  const [applied, setApplied] = useState(false)

  const { data: info, isLoading, error } = useQuery({
    queryKey: ['mentorship-apply', token],
    queryFn:  () =>
      api.get<ApiSuccess<MentorApplyInfo>>(`/mentorship/apply/${token}`)
        .then(r => r.data.data),
    enabled: !!token,
    retry: false,
  })

  const apply = useMutation({
    mutationFn: () =>
      api.post(`/mentorship/apply/${token}`, { message: message.trim() || undefined }),
    onSuccess: () => {
      setApplied(true)
      toast.success('Application submitted!')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      toast.error(msg ?? 'Could not submit application')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <Spinner size="lg" className="text-[var(--color-green-500)]" />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] p-4">
        <div className="max-w-md w-full text-center">
          <Warning size={48} className="text-[var(--color-terra-500)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Link not found</h1>
          <p className="text-sm text-[var(--color-ink-faint)] mb-6">
            This invite link may have expired or been deactivated. Ask your mentor for a new link.
          </p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (applied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle size={56} className="text-[var(--color-forest-500)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Application sent!</h1>
          <p className="text-sm text-[var(--color-ink-faint)] mb-6">
            <strong>{info.mentor.firstName} {info.mentor.lastName}</strong> will review your application for{' '}
            <strong>{info.program.name}</strong> and get back to you.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => navigate('/mentorship/applications')}>
              View my applications
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const mentor = info.mentor
  const program = info.program

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col">
      {/* Minimal nav */}
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-3 flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-xl bg-[var(--color-ink)] flex items-center justify-center shadow-sm shrink-0">
          <Flame size={16} weight="fill" className="text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-terra-500)] rounded-full" />
        </div>
        <span className="font-bold text-[var(--color-ink)]">Afosihub</span>
        <div className="flex-1" />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-12">
        <div className="w-full max-w-lg flex flex-col gap-6">
          {/* Program badge */}
          <div className="text-center">
            <Badge variant="default" className="mb-2">{program.name}</Badge>
            <h1 className="text-2xl font-bold text-[var(--color-ink)]">Apply for mentorship</h1>
            <p className="text-sm text-[var(--color-ink-faint)] mt-1">
              You're applying to be mentored by{' '}
              <strong className="text-[var(--color-ink)]">{mentor.firstName} {mentor.lastName}</strong>
            </p>
          </div>

          {/* Mentor card */}
          <div className="border border-[var(--color-line)] rounded-2xl p-5 bg-[var(--color-surface)] flex gap-4 items-start">
            <Avatar firstName={mentor.firstName} lastName={mentor.lastName} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--color-ink)]">{mentor.firstName} {mentor.lastName}</p>
              {mentor.county && (
                <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{mentor.county}</p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <Envelope size={12} className="text-[var(--color-ink-faint)]" />
                <span className="text-xs text-[var(--color-ink-faint)] truncate">{mentor.email}</span>
              </div>
            </div>
          </div>

          {/* Program info */}
          {program.description && (
            <div className="border border-[var(--color-line)] rounded-2xl p-5 bg-[var(--color-surface)]">
              <p className="text-xs font-mono text-[var(--color-ink-faint)] uppercase mb-2">About the program</p>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{program.description}</p>
              {program.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {program.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-elev)] text-[var(--color-ink-soft)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Optional message */}
          <div className="border border-[var(--color-line)] rounded-2xl p-5 bg-[var(--color-surface)]">
            <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
              Why do you want this mentor? <span className="text-[var(--color-ink-faint)] font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell them a bit about yourself and what you're working on..."
              className="w-full text-sm bg-[var(--color-inset)] border border-[var(--color-line)] rounded-xl px-3 py-2.5 text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-forest-500)]"
            />
            <p className="text-right text-xs text-[var(--color-ink-faint)] mt-1">{message.length}/1000</p>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 pb-12">
            {user ? (
              <Button
                loading={apply.isPending}
                onClick={() => apply.mutate()}
                className="w-full"
              >
                Submit application
              </Button>
            ) : (
              <Button onClick={() => navigate('/login')} className="w-full">
                Sign in to apply
              </Button>
            )}
            <p className="text-xs text-center text-[var(--color-ink-faint)]">
              Applying as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
