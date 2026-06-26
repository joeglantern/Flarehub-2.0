import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Users } from '@phosphor-icons/react'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/store/ui.store'
import { cn } from '@/lib/utils'

type Role = 'entrepreneur' | 'mentor'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path:    ['confirm'],
})
type FormData = z.infer<typeof schema>

const ROLES: { value: Role; icon: React.ElementType; title: string; description: string }[] = [
  {
    value:       'entrepreneur',
    icon:        Briefcase,
    title:       'Entrepreneur',
    description: 'Apply to programs, track your business milestones, and get matched with a mentor.',
  },
  {
    value:       'mentor',
    icon:        Users,
    title:       'Mentor',
    description: 'Share your expertise, guide entrepreneurs, and contribute to Kenya\'s youth development.',
  },
]

export default function SignupPage() {
  const { signup }              = useAuth()
  const navigate                = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data.email, data.password)
      sessionStorage.setItem('fh:signup_role', selectedRole ?? 'entrepreneur')
      toast.success('Account created', 'Complete your profile to get started')
      navigate(selectedRole === 'mentor' ? '/mentor-onboarding' : '/onboarding')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast.error('Could not create account', message)
    }
  }

  return (
    <AuthLayout>
      {!showForm ? (
        <>
          <div className="mb-10">
            <h1
              className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            >
              Join Afosihub.
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              How would you like to participate?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ROLES.map(({ value, icon: Icon, title, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRoleSelect(value)}
                className={cn(
                  'w-full text-left p-5 rounded-[var(--radius-xl)] border-2 transition-all duration-200',
                  'border-[var(--color-border)] hover:border-[var(--color-green-400)] hover:bg-[var(--color-green-50)]',
                  'group',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-bg-inset)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-green-100)] transition-colors">
                    <Icon size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-green-600)] transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 my-8">
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
        </>
      ) : (
        <>
          <div className="mb-10">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h1
              className="text-4xl font-semibold text-[var(--color-text-primary)] leading-tight mb-2"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
            >
              {selectedRole === 'mentor' ? 'Apply as a mentor.' : 'Let\'s get started.'}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {selectedRole === 'mentor'
                ? 'Create your account — you\'ll complete your mentor profile next'
                : 'Create your Afosihub account — it\'s free'}
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
              {selectedRole === 'mentor' ? 'Continue to mentor profile' : 'Create account'}
            </button>
          </form>

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
        </>
      )}
    </AuthLayout>
  )
}
