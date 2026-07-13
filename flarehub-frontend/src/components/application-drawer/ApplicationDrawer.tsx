import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, User, CalendarBlank, Star, ChatText, CheckCircle, Clock, XCircle, Hourglass,
} from '@phosphor-icons/react'
import { api } from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types/api'
import type { FormSchema, FormResponse } from '@/types/applicationForm'
import { useApplicationForm } from '@/hooks/useApplicationForm'
import { Badge, statusVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { ResponseViewer, ResponseViewerSkeleton, ResponseViewerEmpty } from './ResponseViewer'
import { toast } from '@/store/ui.store'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  app:     Application | null
  onClose: () => void
}

export function ApplicationDrawer({ app, onClose }: Props) {
  return (
    <Dialog.Root open={!!app} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40" />
        {app && <DrawerContent app={app} onClose={onClose} />}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Inner content (only mounted when app is not null) ────────────────────────

function DrawerContent({ app }: { app: Application; onClose: () => void }) {
  const qc = useQueryClient()
  const [comment, setComment] = useState(app.adminComment ?? '')

  // Sync comment when app changes
  useEffect(() => {
    setComment(app.adminComment ?? '')
  }, [app.id, app.adminComment])

  // Fetch form schema (only if this program has a form)
  const formQuery = useApplicationForm(
    app.program?.hasApplicationForm ? app.programId : 'skip',
  )

  const schema    = formQuery.data as FormSchema | null | undefined
  const responses = app.responses as FormResponse | null | undefined

  // ── Status change ──────────────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      api.patch(`/applications/${app.id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
    },
    onError: () => toast.error('Update failed'),
  })

  // ── Comment save ──────────────────────────────────────────────────────
  const saveComment = useMutation({
    mutationFn: () =>
      api.patch(`/applications/${app.id}/comment`, { adminComment: comment }),
    onSuccess: () => {
      toast.success('Comment saved')
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
    },
    onError: () => toast.error('Could not save comment'),
  })

  const totalScore = app.score
    ? app.score.innovation + app.score.feasibility + app.score.impact +
      app.score.teamStrength + app.score.marketPotential
    : null

  const NEXT_STATUSES: ApplicationStatus[] = ['Pending', 'UnderReview', 'Approved', 'Rejected'].filter(
    (s) => s !== app.status,
  ) as ApplicationStatus[]

  return (
    <Dialog.Content
      aria-describedby={undefined}
      className={cn(
        'fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col',
        'bg-[var(--color-bg-surface)] shadow-[var(--shadow-lg)] border-l border-[var(--color-border)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-200',
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--color-border)]">
        <div className="min-w-0">
          <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <User size={16} weight="duotone" className="text-[var(--color-text-muted)] shrink-0" />
            {app.user?.firstName} {app.user?.lastName}
          </Dialog.Title>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)] truncate">{app.user?.email}</p>
        </div>
        <Dialog.Close asChild>
          <button
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </Dialog.Close>
      </div>

      {/* ── Meta strip ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 px-5 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] text-xs">
        <Badge variant={statusVariant(app.status)}>{app.status}</Badge>

        <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
          <CalendarBlank size={12} />
          Applied {formatDate(app.appliedAt)}
        </span>

        {app.program && (
          <span className="font-medium text-[var(--color-text-secondary)]">
            {app.program.name}
          </span>
        )}

        {totalScore !== null && (
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            <Star size={12} weight="fill" />
            {totalScore}/50
          </span>
        )}

        {app.isDraft && (
          <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
            <Clock size={12} />
            Draft
          </span>
        )}
      </div>

      {/* ── Quick status actions ─────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-muted)] mr-1">Move to:</span>
        {NEXT_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate(s)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border',
              'transition-all duration-[var(--duration-fast)]',
              s === 'Approved'
                ? 'border-[var(--color-green-100)] text-[var(--color-green-600)] hover:bg-[var(--color-green-50)]'
                : s === 'Rejected'
                ? 'border-red-100 text-red-600 hover:bg-red-50'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]',
            )}
          >
            {s === 'Approved'    && <CheckCircle size={11} weight="fill" />}
            {s === 'Rejected'    && <XCircle     size={11} weight="fill" />}
            {s === 'UnderReview' && <Hourglass   size={11} weight="fill" />}
            {s}
          </button>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="responses" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-5 shrink-0">
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="comment">Admin note</TabsTrigger>
          </TabsList>

          {/* ── Responses ───────────────────────────────────────── */}
          <TabsContent value="responses" className="flex-1 overflow-y-auto px-5 py-4">
            {!app.program?.hasApplicationForm || !responses ? (
              <ResponseViewerEmpty />
            ) : formQuery.isLoading ? (
              <ResponseViewerSkeleton />
            ) : schema ? (
              <ResponseViewer schema={schema} responses={responses} />
            ) : (
              <ResponseViewerEmpty />
            )}
          </TabsContent>

          {/* ── Admin note ──────────────────────────────────────── */}
          <TabsContent value="comment" className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <ChatText size={15} weight="duotone" className="text-[var(--color-green-500)]" />
                  Internal note
                </label>
                <p className="text-xs text-[var(--color-text-muted)]">
                  This note is only visible to admins — the applicant won't see it.
                </p>
              </div>

              <textarea
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add notes about this applicant or their application..."
                className={cn(
                  'w-full px-3.5 py-2.5 text-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white',
                  'focus:outline-none focus:border-[var(--color-green-500)] focus:bg-[#f7fdf9]',
                  'focus:shadow-[inset_3px_0_0_var(--color-green-500),0_0_0_3px_rgba(29,111,66,0.10)]',
                  'placeholder:text-[var(--color-text-muted)] resize-none',
                  'transition-[background-color,border-color,box-shadow] duration-[var(--duration-default)]',
                )}
              />

              {app.adminComment && app.adminComment !== comment && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Unsaved changes
                </p>
              )}

              <Button
                loading={saveComment.isPending}
                disabled={comment === (app.adminComment ?? '')}
                onClick={() => saveComment.mutate()}
                icon={<ChatText size={14} />}
              >
                Save note
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Dialog.Content>
  )
}
