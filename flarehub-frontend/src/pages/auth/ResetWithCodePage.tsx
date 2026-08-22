import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { CheckCircle } from '@phosphor-icons/react'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api'
import { toast } from '@/store/ui.store'

const schema = z.object({
  email:       z.string().email('Enter a valid email'),
  code:        z.string().length(6, 'Enter the 6-digit code'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirm:     z.string(),
}).refine(d => d.newPassword === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})
type FormData = z.infer<typeof schema>

export default function ResetWithCodePage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/reset-with-otp', {
        email:       data.email,
        code:        data.code,
        newPassword: data.newPassword,
      })
      setDone(true)
    } catch (err) {
      setError('code', { message: getErrorMessage(err) ?? 'That code is invalid or has expired' })
      toast.error('Could not reset password')
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-green-500)]/10 flex items-center justify-center mb-6">
            <CheckCircle size={24} weight="fill" className="text-[var(--color-green-500)]" />
          </div>
          <h1
            className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            Password<br />updated.
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            You can now sign in with your new password.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full h-12 rounded-[var(--radius-lg)] bg-[var(--color-green-500)] text-white text-sm font-semibold tracking-wide hover:bg-[var(--color-green-600)] active:bg-[var(--color-green-700)] transition-colors duration-[var(--duration-fast)]"
        >
          Go to sign in
        </button>
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
          Enter your<br />reset code.
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Use the 6-digit code an Afosihub admin sent you to set a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthInput
          label="6-digit code"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          maxLength={6}
          autoComplete="one-time-code"
          error={errors.code?.message}
          {...register('code')}
        />
        <AuthInput
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Repeat password"
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
          Set new password
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
        Don't have a code?{' '}
        <Link
          to="/forgot-password"
          className="font-semibold text-[var(--color-green-500)] hover:text-[var(--color-green-600)] transition-colors"
        >
          Reset via email instead
        </Link>
      </p>
    </AuthLayout>
  )
}
