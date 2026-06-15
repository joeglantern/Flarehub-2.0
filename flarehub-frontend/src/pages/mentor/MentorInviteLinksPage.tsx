import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Link as LinkIcon, Copy, Check, QrCode, Trash, ToggleLeft, ToggleRight, Plus } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/store/ui.store'
import type { ApiSuccess, ProgramMentor } from '@/types/api'

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

function inviteUrl(token: string) {
  return `${APP_URL}/mentorship/apply/${token}`
}

export default function MentorInviteLinksPage() {
  const [qrTarget, setQrTarget]       = useState<{ url: string; name: string } | null>(null)
  const [copied, setCopied]           = useState<number | null>(null)
  const qc                            = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['mentor', 'programs'],
    queryFn:  () => api.get<ApiSuccess<ProgramMentor[]>>('/mentor/programs').then(r => r.data.data),
  })

  const generate = useMutation({
    mutationFn: (programMentorId: number) =>
      api.post('/mentor/invite-links', { programMentorId }),
    onSuccess: () => {
      toast.success('Invite link generated')
      qc.invalidateQueries({ queryKey: ['mentor', 'programs'] })
    },
    onError: () => toast.error('Could not generate link'),
  })

  const toggle = useMutation({
    mutationFn: (id: number) => api.patch(`/mentor/invite-links/${id}/toggle`),
    onSuccess: () => {
      toast.success('Link updated')
      qc.invalidateQueries({ queryKey: ['mentor', 'programs'] })
    },
    onError: () => toast.error('Could not update link'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/mentor/invite-links/${id}`),
    onSuccess: () => {
      toast.success('Link deleted')
      qc.invalidateQueries({ queryKey: ['mentor', 'programs'] })
    },
    onError: () => toast.error('Could not delete link'),
  })

  const copyUrl = async (url: string, linkId: number) => {
    await navigator.clipboard.writeText(url)
    setCopied(linkId)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <PageHeader
        title="Invite Links"
        subtitle="Share a link (or QR code) with entrepreneurs to let them apply for mentorship under your programs."
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={<LinkIcon size={24} />}
            heading="No program assignments yet"
            body="An admin needs to assign you to a program before you can generate invite links."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map(pm => {
            const link = pm.inviteLink
            const url  = link ? inviteUrl(link.token) : null
            return (
              <Card key={pm.id} padding="none">
                <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {pm.program?.name ?? `Program #${pm.programId}`}
                      </p>
                      <Badge variant={pm.program?.status === 'Active' ? 'active' : 'inactive'}>
                        {pm.program?.status}
                      </Badge>
                    </div>

                    {link && url ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="flex-1 min-w-0 truncate text-xs bg-[var(--color-inset)] px-3 py-1.5 rounded-lg text-[var(--color-ink-soft)] font-mono border border-[var(--color-line)]">
                            {url}
                          </code>
                          <button
                            onClick={() => copyUrl(url, link.id)}
                            className="shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-elev)] transition-colors"
                          >
                            {copied === link.id ? <Check size={13} className="text-[var(--color-forest-500)]" /> : <Copy size={13} />}
                            {copied === link.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                          <span>{link.applicationCount ?? 0} application{(link.applicationCount ?? 0) !== 1 ? 's' : ''} received</span>
                          <span>·</span>
                          <Badge variant={link.isActive ? 'active' : 'inactive'}>
                            {link.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-ink-faint)] mt-1">No invite link yet</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {link ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => url && setQrTarget({ url, name: pm.program?.name ?? 'Program' })}
                          title="Show QR code"
                        >
                          <QrCode size={15} />
                          QR Code
                        </Button>
                        <button
                          onClick={() => toggle.mutate(link.id)}
                          disabled={toggle.isPending}
                          title={link.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-elev)] text-[var(--color-ink-soft)] transition-colors"
                        >
                          {link.isActive
                            ? <ToggleRight size={20} className="text-[var(--color-forest-500)]" />
                            : <ToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => remove.mutate(link.id)}
                          disabled={remove.isPending}
                          title="Delete link"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-inset)] text-[var(--color-error)] transition-colors"
                        >
                          <Trash size={15} />
                        </button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        loading={generate.isPending}
                        onClick={() => generate.mutate(pm.id)}
                      >
                        <Plus size={14} />
                        Generate link
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* QR Code modal */}
      <Modal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title={`QR Code — ${qrTarget?.name}`}
        description="Let entrepreneurs scan this to apply for mentorship with you."
        size="sm"
        footer={
          <Button onClick={() => setQrTarget(null)}>Done</Button>
        }
      >
        {qrTarget && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-[var(--color-line)]">
              <QRCodeSVG
                value={qrTarget.url}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-[var(--color-ink-faint)] text-center break-all max-w-xs">
              {qrTarget.url}
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
