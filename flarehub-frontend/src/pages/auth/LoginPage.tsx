import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login }          = useAuth()
  const { user, isLoading } = useAuthStore()
  const navigate            = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Navigate once useAuthInit has synced the user after login
  useEffect(() => {
    if (isLoading || !user) return
    if (!user.profileComplete)                              { navigate('/onboarding', { replace: true }); return }
    if (user.role === 'admin' || user.role === 'super_admin') { navigate('/admin',      { replace: true }); return }
    if (user.isMentor)                                      { navigate('/mentor',     { replace: true }); return }
    navigate('/dashboard', { replace: true })
  }, [user, isLoading, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      // Navigation happens via the useEffect above once useAuthInit
      // finishes calling sync-user and sets the user in the store.
    } catch {
      toast.error('Could not sign in', 'Check your email and password')
    }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-10">
        <h1
          className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
        >
          Welcome<br />back.
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Sign in to continue to Flarehub
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthInput
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-[var(--radius-lg)] bg-[var(--color-green-500)] text-white text-sm font-semibold tracking-wide hover:bg-[var(--color-green-600)] active:bg-[var(--color-green-700)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        No account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
