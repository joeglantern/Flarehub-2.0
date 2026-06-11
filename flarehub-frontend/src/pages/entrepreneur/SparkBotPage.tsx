import { useNavigate } from 'react-router-dom'
import { IllustrationDashboard } from '@/components/illustrations/IllustrationDashboard'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from '@phosphor-icons/react'

export default function SparkBotPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 pb-24 lg:pb-12">
      <div className="w-48 h-48 mb-8 opacity-90">
        <IllustrationDashboard />
      </div>

      <div className="text-center max-w-md">
        <span className="inline-block font-mono text-[11px] uppercase tracking-widest text-[var(--color-forest-600)] bg-[var(--color-forest-50)] px-3 py-1 rounded-full mb-4">
          Coming Soon
        </span>
        <h1
          className="text-[28px] font-bold text-[var(--color-ink)] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          SparkBot AI
        </h1>
        <p className="text-[14px] text-[var(--color-ink-mute)] mt-3 leading-relaxed">
          Your personal AI business assistant. SparkBot will help you refine your goals,
          review your submissions, and give you actionable insights on your progress.
        </p>
        <p className="text-[12px] text-[var(--color-ink-faint)] mt-2">
          Check back soon — we&apos;re working on it.
        </p>

        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowLeft size={14} />}
          className="mt-6"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
