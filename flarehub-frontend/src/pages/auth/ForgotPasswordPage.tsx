import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { EnvelopeSimple } from '@phosphor-icons/react'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { api } from '@/lib/api'
import { toast } from '@/store/ui.store'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      setSentTo(data.email)
    } catch {
      toast.error('Could not send reset link', 'Please try again in a moment')
    }
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-green-500)]/10 flex items-center justify-center mb-6">
            <EnvelopeSimple size={24} weight="fill" className="text-[var(--color-green-500)]" />
          </div>
          <h1
            className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Check your<br />email.
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            If an account exists for <span className="font-semibold text-[var(--color-text-primary)]">{sentTo}</span>,
            we've sent a link to reset your password. The link expires after a short time.
          </p>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Didn't get it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
          >
            try again
          </button>
          .
        </p>

        <p className="text-sm text-[var(--color-text-secondary)] mt-4">
          Have a code from an admin instead?{' '}
          <Link
            to="/reset-with-code"
            className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
          >
            Enter it here
          </Link>
        </p>

        <p className="text-sm text-[var(--color-text-secondary)] mt-4">
          <Link
            to="/login"
            className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-10">
        <h1
          className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
        >
          Forgot your<br />password?
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Enter your email and we'll send you a link to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-[var(--radius-lg)] bg-[var(--color-green-500)] text-white text-sm font-semibold tracking-wide hover:bg-[var(--color-green-600)] active:bg-[var(--color-green-700)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : null}
          Send reset link
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
        Remembered it?{' '}
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
