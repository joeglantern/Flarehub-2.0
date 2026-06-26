import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Gear, Globe, EnvelopeSimple, ClockCounterClockwise, Users, BellSimple } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from '@/store/ui.store'
import type { ApiSuccess } from '@/types/api'

interface SettingDef {
  key:         string
  label:       string
  description: string
  placeholder: string
  type?:       'text' | 'number' | 'email'
}

interface SettingGroup {
  title:    string
  icon:     React.ReactNode
  settings: SettingDef[]
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'Platform',
    icon:  <Globe size={15} />,
    settings: [
      {
        key:         'platform_name',
        label:       'Platform name',
        description: 'Shown in emails, notifications, and the browser tab.',
        placeholder: 'Afosihub',
      },
      {
        key:         'support_email',
        label:       'Support email',
        description: 'Where users send support requests.',
        placeholder: 'support@afosihub.com',
        type:        'email',
      },
    ],
  },
  {
    title: 'Applications',
    icon:  <Users size={15} />,
    settings: [
      {
        key:         'max_applications_per_user',
        label:       'Max applications per user',
        description: 'How many programs a single user can apply to at once.',
        placeholder: '3',
        type:        'number',
      },
      {
        key:         'application_review_days',
        label:       'Review period (days)',
        description: 'Target number of days to review an application after submission.',
        placeholder: '14',
        type:        'number',
      },
    ],
  },
  {
    title: 'Notifications',
    icon:  <EnvelopeSimple size={15} />,
    settings: [
      {
        key:         'deadline_reminder_days',
        label:       'Deadline reminder (days before)',
        description: 'Send a reminder notification this many days before a program deadline.',
        placeholder: '7',
        type:        'number',
      },
    ],
  },
  {
    title: 'Evidence & Submissions',
    icon:  <ClockCounterClockwise size={15} />,
    settings: [
      {
        key:         'evidence_review_days',
        label:       'Evidence review SLA (days)',
        description: 'Target days to review uploaded evidence before it flags as overdue.',
        placeholder: '5',
        type:        'number',
      },
      {
        key:         'max_evidence_size_mb',
        label:       'Max evidence file size (MB)',
        description: 'Maximum file size allowed for evidence uploads.',
        placeholder: '20',
        type:        'number',
      },
    ],
  },
]

const ALL_KEYS = SETTING_GROUPS.flatMap(g => g.settings.map(s => s.key))

const DEFAULTS: Record<string, string> = {
  platform_name:              'Afosihub',
  support_email:              'support@afosihub.com',
  max_applications_per_user:  '3',
  application_review_days:    '14',
  deadline_reminder_days:     '7',
  evidence_review_days:       '5',
  max_evidence_size_mb:       '20',
}

function PushTestSection() {
  const testPush = useMutation({
    mutationFn: () => api.post('/push/test').then(r => r.data),
    onSuccess:  () => toast.success('Test push notification sent'),
    onError:    () => toast.error('Push notification failed — check server logs'),
  })

  return (
    <div className="bg-white rounded-[20px] border border-[var(--color-line)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--color-line)] flex items-center gap-2 bg-[var(--color-elev)]">
        <BellSimple size={15} className="text-[var(--color-ink-faint)]" />
        <p className="text-sm font-semibold text-[var(--color-ink)]">Push Notifications</p>
      </div>
      <div className="px-5 py-4 flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-ink)]">Send test notification</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 leading-relaxed">
            Sends a test push notification to your account to verify the delivery pipeline is working.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<BellSimple size={13} />}
          loading={testPush.isPending}
          onClick={() => testPush.mutate()}
        >
          Send test
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn:  () => api.get<ApiSuccess<Record<string, string>>>('/admin/settings').then(r => r.data.data),
  })

  const formValues: Record<string, string> = {}
  for (const key of ALL_KEYS) {
    formValues[key] = data?.[key] ?? DEFAULTS[key] ?? ''
  }

  const { register, handleSubmit, formState: { isDirty, isSubmitting } } = useForm<Record<string, string>>({
    values: formValues,
  })

  const save = useMutation({
    mutationFn: (d: Record<string, string>) => api.patch('/admin/settings', d).then(r => r.data),
    onSuccess: () => {
      toast.success('Settings saved')
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: () => toast.error('Could not save settings — super admin permission required'),
  })

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Platform-wide configuration. Changes take effect immediately."
      />

      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={120} />)}
        </div>
      ) : (
        <>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-5 max-w-2xl">
          {SETTING_GROUPS.map(group => (
            <div
              key={group.title}
              className="bg-white rounded-[20px] border border-[var(--color-line)] overflow-hidden"
            >
              {/* Group header */}
              <div className="px-5 py-3.5 border-b border-[var(--color-line)] flex items-center gap-2 bg-[var(--color-elev)]">
                <span className="text-[var(--color-ink-faint)]">{group.icon}</span>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{group.title}</p>
              </div>

              {/* Settings rows */}
              <div className="divide-y divide-[var(--color-line)]">
                {group.settings.map(s => (
                  <div key={s.key} className="px-5 py-4 flex items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)]">{s.label}</p>
                      <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="w-52 shrink-0">
                      <Input
                        type={s.type ?? 'text'}
                        placeholder={s.placeholder}
                        {...register(s.key)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[var(--color-ink-faint)] flex items-center gap-1.5">
              <Gear size={12} />
              Saving requires super admin permission
            </p>
            <Button
              type="submit"
              loading={isSubmitting || save.isPending}
              disabled={!isDirty}
            >
              Save settings
            </Button>
          </div>
        </form>

        <PushTestSection />
        </>
      )}
    </>
  )
}
