import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Circle, Plus, PencilSimple, Trash, FileText, Upload } from '@phosphor-icons/react'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { toast } from '@/store/ui.store'
import { timeAgo } from '@/lib/utils'
import type { ApiSuccess } from '@/types/api'

interface MenteeProfile {
  profile:        { id: string; firstName: string; lastName: string; email: string; county: string | null; businessName: string | null; businessStage: string | null }
  smartGoal:      { goalStatement: string; specific: string; measurable: string; achievable: string; relevant: string; timebound: string; adminComment: string | null } | null
  milestonePlan:  { businessName: string; milestones: unknown } | null
  marketResearch: { businessName: string; surveyObjective: string | null } | null
  evidence:       Array<{ id: number; fileName: string; status: string }>
  notes:          Array<{ id: number; content: string; createdAt: string; updatedAt: string }>
}

export default function MenteeDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [newNote, setNewNote]           = useState('')
  const [editingId, setEditingId]       = useState<number | null>(null)
  const [editContent, setEditContent]   = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mentee', id],
    queryFn:  () => api.get<ApiSuccess<MenteeProfile>>(`/mentor/mentees/${id}`).then(r => r.data.data),
  })

  const createNote = useMutation({
    mutationFn: () => api.post('/mentor/notes', { menteeId: id, content: newNote }),
    onSuccess: () => {
      toast.success('Note added')
      setNewNote('')
      qc.invalidateQueries({ queryKey: ['mentee', id] })
    },
    onError: () => toast.error('Could not save note'),
  })

  const updateNote = useMutation({
    mutationFn: ({ noteId, content }: { noteId: number; content: string }) =>
      api.patch(`/mentor/notes/${noteId}`, { content }),
    onSuccess: () => {
      toast.success('Note updated')
      setEditingId(null)
      qc.invalidateQueries({ queryKey: ['mentee', id] })
    },
    onError: () => toast.error('Could not update note'),
  })

  const deleteNote = useMutation({
    mutationFn: (noteId: number) => api.delete(`/mentor/notes/${noteId}`),
    onSuccess: () => {
      toast.success('Note deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['mentee', id] })
    },
    onError: () => toast.error('Could not delete note'),
  })

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32 rounded-xl" />
      <Skeleton className="h-28 rounded-[20px]" />
      <Skeleton className="h-[400px] rounded-[20px]" />
    </div>
  )
  if (!data) return null

  const { profile, smartGoal, milestonePlan, marketResearch, evidence, notes } = data

  const submissionsArr = [
    { label: 'SMART Goals',      done: !!smartGoal,       content: smartGoal },
    { label: 'Milestone Plan',   done: !!milestonePlan,   content: milestonePlan },
    { label: 'Market Research',  done: !!marketResearch,  content: marketResearch },
  ]
  const submittedCount = submissionsArr.filter(s => s.done).length

  return (
    <div className="space-y-6 page-enter">

      {/* Back button */}
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}
        onClick={() => navigate('/mentor/mentees')}>
        Back to mentees
      </Button>

      {/* ── Profile header ─────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar firstName={profile.firstName} lastName={profile.lastName} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-[28px] font-bold text-[var(--color-ink)] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-[13px] text-[var(--color-ink-mute)] mt-0.5">{profile.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {profile.county       && <Badge variant="default">{profile.county}</Badge>}
              {profile.businessName && <Badge variant="default">{profile.businessName}</Badge>}
              {profile.businessStage && <Badge variant="mentor">{profile.businessStage}</Badge>}
            </div>
          </div>

          {/* Submission progress summary */}
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">Progress</p>
            <p className="text-[28px] font-bold text-[var(--color-ink)] leading-tight mt-0.5"
              style={{ fontFamily: 'var(--font-display)' }}>
              {submittedCount}<span className="text-[16px] text-[var(--color-ink-faint)]">/3</span>
            </p>
            <div className="flex gap-1 mt-1.5 justify-end">
              {submissionsArr.map(s => (
                <div key={s.label}
                  className={`w-6 h-1.5 rounded-full transition-all ${s.done ? 'bg-[var(--color-forest-500)]' : 'bg-[var(--color-inset)]'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({submittedCount}/3)
          </TabsTrigger>
          <TabsTrigger value="evidence">
            Evidence ({evidence.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Submissions ─────────────────────────────────────────────── */}
        <TabsContent value="submissions" className="mt-5 space-y-3">
          {submissionsArr.map(({ label, done, content }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                {done
                  ? <CheckCircle size={17} weight="fill" className="text-[var(--color-forest-500)] shrink-0" />
                  : <Circle      size={17}               className="text-[var(--color-ink-faint)] shrink-0" />}
                <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">{label}</h3>
                {done && (
                  <span className="ml-auto text-[10px] font-mono font-semibold text-[var(--color-forest-600)] bg-[var(--color-forest-50)] border border-[var(--color-forest-100)] px-2 py-0.5 rounded-full">
                    Submitted
                  </span>
                )}
              </div>
              {done && content ? (
                <div className="space-y-2 pl-7">
                  {Object.entries(content as Record<string, string | null>)
                    .filter(([k]) => !['businessName'].includes(k))
                    .map(([k, v]) => v && (
                      <p key={k} className="text-[13px] text-[var(--color-ink-mute)] leading-relaxed">
                        <strong className="text-[var(--color-ink)] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}{v}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--color-ink-faint)] pl-7">Not submitted yet.</p>
              )}
            </div>
          ))}
        </TabsContent>

        {/* ── Evidence ────────────────────────────────────────────────── */}
        <TabsContent value="evidence" className="mt-5">
          {!evidence.length ? (
            <div className="card p-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-elev)] flex items-center justify-center mb-3">
                <Upload size={20} className="text-[var(--color-ink-faint)]" />
              </div>
              <p className="text-[13px] font-medium text-[var(--color-ink-mute)]">No evidence uploaded yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {evidence.map(e => (
                <div key={e.id} className="card px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={15} className="text-[var(--color-ink-mute)] shrink-0" />
                    <p className="text-[13px] text-[var(--color-ink)] truncate">{e.fileName}</p>
                  </div>
                  <Badge variant={e.status === 'verified' ? 'approved' : e.status === 'rejected' ? 'rejected' : 'pending'}>
                    {e.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Notes ───────────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-5 space-y-4">
          {/* New note input */}
          <div className="card p-5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Add a note</p>
            <Textarea
              placeholder="Write something about this mentee's progress..."
              rows={3}
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <Button
                size="sm"
                icon={<Plus size={14} />}
                disabled={!newNote.trim()}
                loading={createNote.isPending}
                onClick={() => newNote.trim() && createNote.mutate()}
              >
                Save note
              </Button>
            </div>
          </div>

          {/* Existing notes */}
          {!notes.length ? (
            <p className="text-[13px] text-[var(--color-ink-faint)] text-center py-4">No notes yet. Add one above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map(n => (
                <div key={n.id} className="card p-4 group">
                  {editingId === n.id ? (
                    <>
                      <Textarea
                        rows={3}
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                      />
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" loading={updateNote.isPending}
                          onClick={() => updateNote.mutate({ noteId: n.id, content: editContent })}>
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <p className="flex-1 text-[13px] text-[var(--color-ink)] leading-relaxed">{n.content}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setEditingId(n.id); setEditContent(n.content) }}
                          className="p-1.5 rounded-lg text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-elev)] transition-colors"
                          aria-label="Edit note"
                        >
                          <PencilSimple size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(n.id)}
                          className="p-1.5 rounded-lg text-[var(--color-ink-faint)] hover:text-[var(--color-error)] hover:bg-[var(--color-elev)] transition-colors"
                          aria-label="Delete note"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--color-ink-faint)] mt-2">{timeAgo(n.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteNote.mutate(deleteTarget)}
        title="Delete note"
        description="This note will be permanently deleted."
        confirmLabel="Delete"
        danger
        loading={deleteNote.isPending}
      />
    </div>
  )
}
