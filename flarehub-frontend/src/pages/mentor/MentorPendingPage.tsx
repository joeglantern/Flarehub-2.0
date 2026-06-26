import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame, Clock, CheckCircle } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { IllustrationSuccess } from '@/components/illustrations/IllustrationSuccess'
import type { ApiSuccess, MentorApplication } from '@/types/api'

export default function MentorPendingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.isMentor) navigate('/mentor', { replace: true })
  }, [user, navigate])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['mentor-application-me'],
    queryFn:  () => api.get<ApiSuccess<MentorApplication | null>>('/mentor-applications/me').then(r => r.data.data),
  })

  const status = data?.status

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={17} weight="fill" className="text-white" />
          </div>
          <span className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Afosihub
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-40 h-40 mx-auto mb-8">
            <IllustrationSuccess />
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <span className="w-6 h-6 border-2 border-[var(--color-green-500)]/30 border-t-[var(--color-green-500)] rounded-full animate-spin" />
            </div>
          ) : status === 'approved' ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle size={20} weight="fill" className="text-[var(--color-green-500)]" />
                <span className="text-sm font-semibold text-[var(--color-green-600)] uppercase tracking-widest font-mono">Approved</span>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                You're in!
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Your mentor application has been approved. Welcome to the Afosihub mentor community.
              </p>
              <Button onClick={() => navigate('/mentor')} className="w-full">
                Go to mentor dashboard
              </Button>
            </>
          ) : status === 'rejected' ? (
            <>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Application not approved
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
                Unfortunately your mentor application was not approved at this time.
              </p>
              {data?.adminNotes && (
                <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 mb-6 text-left">
                  <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Notes from our team</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{data.adminNotes}</p>
                </div>
              )}
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest font-mono">Under review</span>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Application submitted!
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-2 leading-relaxed">
                Thank you for applying to be a Afosihub mentor. Our team will review your application and get back to you by email.
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-8">
                This usually takes 1–3 business days.
              </p>

              <Button
                variant="secondary"
                loading={isFetching}
                onClick={() => refetch()}
                className="w-full mb-3"
              >
                Check status
              </Button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Continue to dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
