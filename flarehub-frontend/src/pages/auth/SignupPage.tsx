import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/store/ui.store'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const { signup }  = useAuth()
  const navigate    = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data.email, data.password)
      toast.success('Account created', 'Check your email to confirm your address')
      navigate('/onboarding')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast.error('Could not create account', message)
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
          Let's get<br />started.
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Create your Flarehub account — it's free
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Same as above"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-[var(--radius-lg)] bg-[var(--color-green-500)] text-white text-sm font-semibold tracking-wide hover:bg-[var(--color-green-600)] active:bg-[var(--color-green-700)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          Create account
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <p className="text-center text-sm text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
