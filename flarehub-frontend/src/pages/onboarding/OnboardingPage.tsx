import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, ArrowRight } from '@phosphor-icons/react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { IllustrationOnboarding } from '@/components/illustrations/IllustrationOnboarding'
import { IllustrationBusiness }   from '@/components/illustrations/IllustrationBusiness'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'
import type { User, BusinessStage } from '@/types/api'

const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  phone:     z.string().min(10, 'Enter a valid phone number'),
  county:    z.string().min(1, 'County is required'),
  gender:    z.enum(['Male', 'Female', 'Other']),
})

const step2Schema = z.object({
  businessName:        z.string().min(1, 'Business name is required'),
  businessStage:       z.enum(['Idea', 'Prototype', 'MVP', 'Revenue']),
  businessDescription: z.string().min(20, 'Tell us a bit more (at least 20 characters)'),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>

const genders = ['Male', 'Female', 'Other'] as const
const stages: { value: BusinessStage; label: string; description: string }[] = [
  { value: 'Idea',      label: 'Idea',      description: 'Still developing the concept' },
  { value: 'Prototype', label: 'Prototype', description: 'Built something testable' },
  { value: 'MVP',       label: 'MVP',        description: 'Serving first customers' },
  { value: 'Revenue',   label: 'Revenue',    description: 'Generating consistent income' },
]

// ─── Step meta ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    label:  'About you',
    title:  'First, tell us who you are.',
    sub:    'This helps mentors and coordinators know you personally.',
    illustration: <IllustrationOnboarding />,
    bg:     'bg-[var(--color-green-50)]',
    accent: 'text-[var(--color-green-600)]',
  },
  {
    number: 2,
    label:  'Your business',
    title:  'Now, about your business.',
    sub:    'Every great venture starts somewhere. Show us where yours is.',
    illustration: <IllustrationBusiness />,
    bg:     'bg-[var(--color-terra-50)]',
    accent: 'text-[var(--color-terra-500)]',
  },
]

export default function OnboardingPage() {
  const [step, setStep]         = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const { setUser }             = useAuthStore()
  const navigate                = useNavigate()

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })

  const onStep1 = (data: Step1) => { setStep1Data(data); setStep(2) }

  const onStep2 = async (data: Step2) => {
    if (!step1Data) return
    try {
      const res = await api.patch<{ success: true; data: User }>('/users/me', { ...step1Data, ...data })
      setUser(res.data.data)
      navigate('/dashboard')
    } catch {
      toast.error('Could not save profile', 'Try again')
    }
  }

  const selectedStage  = form2.watch('businessStage')
  const selectedGender = form1.watch('gender')
  const meta           = STEPS[step - 1]

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — illustration ───────────────────────────────── */}
      <div
        className={cn(
          'hidden lg:flex lg:w-[44%] flex-col justify-between p-10',
          meta.bg,
          'transition-colors duration-500',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={17} weight="fill" className="text-white" />
          </div>
          <span
            className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Flarehub
          </span>
        </div>

        {/* Centre content */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Step pills */}
          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div key={s.number} className="flex items-center gap-2">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300',
                  s.number === step
                    ? 'bg-[var(--color-green-500)] text-white'
                    : s.number < step
                    ? 'bg-[var(--color-green-100)] text-[var(--color-green-700)]'
                    : 'bg-white/60 text-[var(--color-text-muted)]',
                )}>
                  {s.number < step && <span>✓</span>}
                  {s.label}
                </div>
                {s.number < STEPS.length && (
                  <div className="w-6 h-px bg-[var(--color-border)]" />
                )}
              </div>
            ))}
          </div>

          {/* Illustration */}
          <div className="w-52 h-52 transition-all duration-500">
            {meta.illustration}
          </div>

          {/* Context text */}
          <div>
            <h2
              className="text-xl font-semibold text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {meta.title}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
              {meta.sub}
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Step {step} of {STEPS.length}
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg-base)] overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={18} weight="fill" className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Flarehub
          </span>
        </div>

        {/* Mobile step dots */}
        <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
          {STEPS.map((s) => (
            <div key={s.number} className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              s.number === step ? 'w-8 bg-[var(--color-terra-500)]' :
              s.number < step   ? 'w-4 bg-[var(--color-green-500)]' :
                                  'w-4 bg-[var(--color-bg-inset)]',
            )} />
          ))}
        </div>

        <div className="w-full max-w-md">
          <div className="bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8">

            {/* ── Step 1 ─────────────────────────────────────────────── */}
            {step === 1 && (
              <>
                <h1 className="text-xl text-[var(--color-text-primary)] mb-1">Tell us about yourself</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  This helps mentors and program coordinators know who you are.
                </p>

                <form onSubmit={form1.handleSubmit(onStep1)} noValidate className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="First name"
                      required
                      error={form1.formState.errors.firstName?.message}
                      {...form1.register('firstName')}
                    />
                    <Input
                      label="Last name"
                      required
                      error={form1.formState.errors.lastName?.message}
                      {...form1.register('lastName')}
                    />
                  </div>

                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="0712 345 678"
                    required
                    error={form1.formState.errors.phone?.message}
                    {...form1.register('phone')}
                  />

                  <Input
                    label="County"
                    placeholder="e.g. Nairobi"
                    required
                    error={form1.formState.errors.county?.message}
                    {...form1.register('county')}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] leading-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)]" />
                      Gender
                    </label>
                    <div className="flex gap-2">
                      {genders.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => form1.setValue('gender', g)}
                          className={cn(
                            'flex-1 py-2 text-sm rounded-[var(--radius-md)] border transition-colors',
                            selectedGender === g
                              ? 'bg-[var(--color-green-50)] border-[var(--color-green-500)] text-[var(--color-green-600)] font-medium'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {form1.formState.errors.gender && (
                      <p className="text-xs text-[var(--color-error)]">{form1.formState.errors.gender.message}</p>
                    )}
                  </div>

                  <Button type="submit" iconRight={<ArrowRight size={15} />} className="w-full mt-1">
                    Continue
                  </Button>
                </form>
              </>
            )}

            {/* ── Step 2 ─────────────────────────────────────────────── */}
            {step === 2 && (
              <>
                <h1 className="text-xl text-[var(--color-text-primary)] mb-1">About your business</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  Every great business starts somewhere. Where is yours right now?
                </p>

                <form onSubmit={form2.handleSubmit(onStep2)} noValidate className="flex flex-col gap-4">
                  <Input
                    label="Business name"
                    placeholder="e.g. GreenBin Solutions"
                    required
                    error={form2.formState.errors.businessName?.message}
                    {...form2.register('businessName')}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] leading-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)]" />
                      Current stage
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {stages.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => form2.setValue('businessStage', s.value)}
                          className={cn(
                            'p-3 text-left rounded-[var(--radius-md)] border transition-colors',
                            selectedStage === s.value
                              ? 'bg-[var(--color-green-50)] border-[var(--color-green-500)]'
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                          )}
                        >
                          <p className={cn(
                            'text-sm font-medium',
                            selectedStage === s.value ? 'text-[var(--color-green-600)]' : 'text-[var(--color-text-primary)]',
                          )}>
                            {s.label}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.description}</p>
                        </button>
                      ))}
                    </div>
                    {form2.formState.errors.businessStage && (
                      <p className="text-xs text-[var(--color-error)]">{form2.formState.errors.businessStage.message}</p>
                    )}
                  </div>

                  <Textarea
                    label="What does your business do?"
                    required
                    rows={3}
                    placeholder="Describe your product or service, your customers, and the problem you solve..."
                    error={form2.formState.errors.businessDescription?.message}
                    {...form2.register('businessDescription')}
                  />

                  <div className="flex gap-3 mt-1">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" loading={form2.formState.isSubmitting} className="flex-1">
                      Finish setup
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
