import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Eye, EyeSlash } from '@phosphor-icons/react'
import { supabase, primeToken } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { User } from '@/types/api'

export default function UpdatePasswordPage() {
  const navigate      = useNavigate()
  const { setUser }   = useAuthStore()
  const [ready, setReady]         = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Supabase processes the #access_token hash and fires PASSWORD_RECOVERY.
  // Expired/invalid links arrive as #error=...&error_description=... instead.
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (hash.get('error')) {
      const description = hash.get('error_description')
      setLinkError(
        hash.get('error_code') === 'otp_expired'
          ? 'This link has expired.'
          : description?.replace(/\+/g, ' ') ?? 'This link is invalid.',
      )
      return
    }

    let verified = false
    const markReady = () => { verified = true; setReady(true); setLinkError(null) }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (session?.access_token) primeToken(session.access_token)
        markReady()
      }
    })
    // Also check if already signed in via the hash
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady()
    })

    // If nothing verified after 10s, the link was likely consumed or malformed
    const timer = setTimeout(() => {
      if (!verified) setLinkError('We could not verify this link.')
    }, 10_000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError(updateError.message); setLoading(false); return }

    try {
      const res = await api.post<{ success: true; data: User & { isNewUser: boolean } }>('/auth/sync-user')
      const user = res.data.data
      setUser(user)
      navigate(user.profileComplete ? '/dashboard' : '/onboarding', { replace: true })
    } catch {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-2xl bg-[var(--color-ink)] flex items-center justify-center shadow-sm">
            <Flame size={18} weight="fill" className="text-white" />
          </div>
          <span className="font-semibold text-[18px] tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Afosihub
          </span>
        </div>

        <div className="card p-7">
          <h1 className="text-[22px] font-bold text-[var(--color-ink)] mb-1">Set your password</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            Choose a new password to access your Afosihub account.
          </p>

          {!ready && linkError ? (
            <div className="py-2">
              <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/8 px-3 py-2.5 rounded-lg mb-4">
                {linkError}
              </p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                Password reset links can only be used once and expire quickly.{' '}
                <a href="/forgot-password" className="text-[var(--color-ink)] font-medium hover:underline">
                  Request a new link
                </a>
              </p>
            </div>
          ) : !ready ? (
            <div className="flex items-center justify-center py-6 gap-2 text-[var(--color-ink-faint)]">
              <Spinner size="sm" />
              <span className="text-sm">Verifying your link…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5 uppercase tracking-wide">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                    {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5 uppercase tracking-wide">
                  Confirm password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              {error && (
                <p className="text-xs text-[var(--color-error)] bg-[var(--color-error)]/8 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                Set password & sign in
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--color-ink-faint)] mt-5">
          Already have a password?{' '}
          <a href="/login" className="text-[var(--color-ink)] font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}
