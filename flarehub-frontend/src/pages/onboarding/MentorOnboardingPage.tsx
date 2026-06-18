import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, ArrowRight, Check } from '@phosphor-icons/react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { IllustrationMentor }  from '@/components/illustrations/IllustrationMentor'
import { IllustrationOnboarding } from '@/components/illustrations/IllustrationOnboarding'
import { IllustrationSuccess } from '@/components/illustrations/IllustrationSuccess'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/ui.store'
import type { User } from '@/types/api'

const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  phone:     z.string().min(10, 'Enter a valid phone number'),
  county:    z.string().min(1, 'County is required'),
  gender:    z.enum(['Male', 'Female', 'Other']),
})

const step2Schema = z.object({
  expertise:       z.array(z.string()).min(1, 'Select at least one area'),
  yearsExperience: z.number({ invalid_type_error: 'Required' }).int().min(0).max(50),
  currentRole:     z.string().min(1, 'Current role is required'),
  currentCompany:  z.string().optional(),
  linkedIn:        z.string().optional(),
})

const step3Schema = z.object({
  availability: z.string().min(1, 'Select your availability'),
  motivation:   z.string().min(20, 'Tell us a bit more (at least 20 characters)'),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

const genders = ['Male', 'Female', 'Other'] as const

const EXPERTISE_OPTIONS = [
  'Legal & Law',
  'Finance & Accounting',
  'Entrepreneurship',
  'Green Economy',
  'Digital & Technology',
  'Marketing & Sales',
  'Agriculture',
  'Youth Development',
  'Project Management',
  'Human Resources',
  'Education & Training',
  'Climate & Environment',
]

const AVAILABILITY_OPTIONS = [
  '1-2 hours/week',
  '2-4 hours/week',
  '4-8 hours/week',
  '8+ hours/week',
]

const STEPS = [
  {
    number: 1,
    label:  'About you',
    title:  'First, tell us who you are.',
    sub:    'This helps the Flarehub team and entrepreneurs know you personally.',
    illustration: <IllustrationOnboarding />,
    bg:     'bg-[var(--color-green-50)]',
  },
  {
    number: 2,
    label:  'Your expertise',
    title:  'What do you bring to the table?',
    sub:    'Tell us about your professional background and areas of expertise.',
    illustration: <IllustrationMentor />,
    bg:     'bg-[var(--color-terra-50)]',
  },
  {
    number: 3,
    label:  'Preferences',
    title:  'How would you like to mentor?',
    sub:    'Help us understand your availability and why you want to mentor.',
    illustration: <IllustrationSuccess />,
    bg:     'bg-[var(--color-green-50)]',
  },
]

export default function MentorOnboardingPage() {
  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const [step2Data, setStep2Data] = useState<Step2 | null>(null)
  const { setUser }               = useAuthStore()
  const navigate                  = useNavigate()

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { expertise: [] } })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) })

  const onStep1 = (data: Step1) => { setStep1Data(data); setStep(2) }
  const onStep2 = (data: Step2) => { setStep2Data(data); setStep(3) }

  const onStep3 = async (data: Step3) => {
    if (!step1Data || !step2Data) return
    try {
      const userRes = await api.patch<{ success: true; data: User }>('/users/me', step1Data)
      setUser(userRes.data.data)

      await api.post('/mentor-applications', {
        ...step2Data,
        ...data,
      })

      sessionStorage.removeItem('fh:signup_role')
      navigate('/mentor-pending')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error('Could not submit application', msg)
    }
  }

  const selectedGender     = form1.watch('gender')
  const selectedExpertise  = form2.watch('expertise') ?? []
  const selectedAvailability = form3.watch('availability')
  const meta               = STEPS[step - 1]

  const toggleExpertise = (area: string) => {
    const current = form2.getValues('expertise') ?? []
    if (current.includes(area)) {
      form2.setValue('expertise', current.filter(e => e !== area), { shouldValidate: true })
    } else {
      form2.setValue('expertise', [...current, area], { shouldValidate: true })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className={cn('hidden lg:flex lg:w-[44%] flex-col justify-between p-10 transition-colors duration-500', meta.bg)}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={17} weight="fill" className="text-white" />
          </div>
          <span className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Flarehub
          </span>
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
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
                {s.number < STEPS.length && <div className="w-6 h-px bg-[var(--color-border)]" />}
              </div>
            ))}
          </div>

          <div className="w-52 h-52 transition-all duration-500">{meta.illustration}</div>

          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {meta.title}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">{meta.sub}</p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center">Step {step} of {STEPS.length}</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg-base)] overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-[var(--color-green-500)] rounded-[var(--radius-md)] flex items-center justify-center">
            <Flame size={18} weight="fill" className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Flarehub</span>
        </div>

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

            {/* ── Step 1: Personal ──────────────────────────────────── */}
            {step === 1 && (
              <>
                <h1 className="text-xl text-[var(--color-text-primary)] mb-1">Tell us about yourself</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Your personal details for your mentor profile.</p>

                <form onSubmit={form1.handleSubmit(onStep1)} noValidate className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" required error={form1.formState.errors.firstName?.message} {...form1.register('firstName')} />
                    <Input label="Last name"  required error={form1.formState.errors.lastName?.message}  {...form1.register('lastName')} />
                  </div>
                  <Input label="Phone number" type="tel" placeholder="0712 345 678" required error={form1.formState.errors.phone?.message} {...form1.register('phone')} />
                  <Input label="County" placeholder="e.g. Nairobi" required error={form1.formState.errors.county?.message} {...form1.register('county')} />

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] leading-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)]" />
                      Gender
                    </label>
                    <div className="flex gap-2">
                      {genders.map((g) => (
                        <button key={g} type="button" onClick={() => form1.setValue('gender', g)}
                          className={cn('flex-1 py-2 text-sm rounded-[var(--radius-md)] border transition-colors',
                            selectedGender === g
                              ? 'bg-[var(--color-green-50)] border-[var(--color-green-500)] text-[var(--color-green-600)] font-medium'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
                          )}>
                          {g}
                        </button>
                      ))}
                    </div>
                    {form1.formState.errors.gender && (
                      <p className="text-xs text-[var(--color-error)]">{form1.formState.errors.gender.message}</p>
                    )}
                  </div>

                  <Button type="submit" iconRight={<ArrowRight size={15} />} className="w-full mt-1">Continue</Button>
                </form>
              </>
            )}

            {/* ── Step 2: Professional ─────────────────────────────── */}
            {step === 2 && (
              <>
                <h1 className="text-xl text-[var(--color-text-primary)] mb-1">Your expertise</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Tell us about your professional background.</p>

                <form onSubmit={form2.handleSubmit(onStep2)} noValidate className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] leading-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)]" />
                      Areas of expertise <span className="text-[var(--color-text-muted)] font-normal ml-1">— select all that apply</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERTISE_OPTIONS.map((area) => {
                        const active = selectedExpertise.includes(area)
                        return (
                          <button key={area} type="button" onClick={() => toggleExpertise(area)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                              active
                                ? 'bg-[var(--color-green-500)] border-[var(--color-green-500)] text-white'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-green-400)]',
                            )}>
                            {active && <Check size={10} weight="bold" className="inline mr-1" />}
                            {area}
                          </button>
                        )
                      })}
                    </div>
                    {form2.formState.errors.expertise && (
                      <p className="text-xs text-[var(--color-error)]">{form2.formState.errors.expertise.message}</p>
                    )}
                  </div>

                  <Input
                    label="Years of professional experience"
                    type="number"
                    placeholder="e.g. 5"
                    required
                    error={form2.formState.errors.yearsExperience?.message}
                    {...form2.register('yearsExperience', { valueAsNumber: true })}
                  />
                  <Input label="Current role / title" placeholder="e.g. Senior Advocate" required error={form2.formState.errors.currentRole?.message} {...form2.register('currentRole')} />
                  <Input label="Organisation / Company" placeholder="e.g. Bowmans Law" error={form2.formState.errors.currentCompany?.message} {...form2.register('currentCompany')} />
                  <Input label="LinkedIn profile URL" placeholder="https://linkedin.com/in/..." error={form2.formState.errors.linkedIn?.message} {...form2.register('linkedIn')} />

                  <div className="flex gap-3 mt-1">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button type="submit" iconRight={<ArrowRight size={15} />} className="flex-1">Continue</Button>
                  </div>
                </form>
              </>
            )}

            {/* ── Step 3: Preferences ──────────────────────────────── */}
            {step === 3 && (
              <>
                <h1 className="text-xl text-[var(--color-text-primary)] mb-1">Mentoring preferences</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">Help us understand your availability and motivation.</p>

                <form onSubmit={form3.handleSubmit(onStep3)} noValidate className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] leading-none">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-terra-500)]" />
                      Weekly availability
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <button key={opt} type="button" onClick={() => form3.setValue('availability', opt, { shouldValidate: true })}
                          className={cn(
                            'p-3 text-sm rounded-[var(--radius-md)] border transition-colors text-left',
                            selectedAvailability === opt
                              ? 'bg-[var(--color-green-50)] border-[var(--color-green-500)] text-[var(--color-green-600)] font-medium'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
                          )}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {form3.formState.errors.availability && (
                      <p className="text-xs text-[var(--color-error)]">{form3.formState.errors.availability.message}</p>
                    )}
                  </div>

                  <Textarea
                    label="Why do you want to be a Flarehub mentor?"
                    required
                    rows={4}
                    placeholder="Tell us what motivates you to mentor entrepreneurs and what you hope to contribute..."
                    error={form3.formState.errors.motivation?.message}
                    {...form3.register('motivation')}
                  />

                  <div className="flex gap-3 mt-1">
                    <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                    <Button type="submit" loading={form3.formState.isSubmitting} className="flex-1">Submit application</Button>
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
