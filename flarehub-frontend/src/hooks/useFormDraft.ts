import { useRef, useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FormResponse } from '@/types/applicationForm'

interface Options {
  draftId: number | null          // existing application ID (if draft was already created)
  programId: number
  onDraftCreated?: (id: number) => void
}

export function useFormDraft({ draftId: initialDraftId, programId, onDraftCreated }: Options) {
  const draftIdRef     = useRef<number | null>(initialDraftId)
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSaving, setIsSaving]   = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState(false)

  // Create draft (POST with isDraft: true) — upserts
  const createDraft = useMutation({
    mutationFn: (responses: FormResponse) =>
      api.post<{ data: { id: number } }>('/applications', {
        programId,
        isDraft:   true,
        responses,
      }).then(r => r.data.data.id),
  })

  // Update existing draft (PATCH /applications/:id/draft)
  const updateDraft = useMutation({
    mutationFn: ({ id, responses }: { id: number; responses: FormResponse }) =>
      api.patch(`/applications/${id}/draft`, { responses }),
  })

  const save = useCallback(async (responses: FormResponse) => {
    setIsSaving(true)
    setSaveError(false)
    try {
      if (draftIdRef.current) {
        await updateDraft.mutateAsync({ id: draftIdRef.current, responses })
      } else {
        const id = await createDraft.mutateAsync(responses)
        draftIdRef.current = id
        onDraftCreated?.(id)
      }
      setLastSaved(new Date())
    } catch {
      setSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save — call this on every change
  const scheduleSave = useCallback((responses: FormResponse) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(responses), 5000)
  }, [save])

  // Flush immediately (e.g. on section change)
  const flush = useCallback((responses: FormResponse) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    return save(responses)
  }, [save])

  return { scheduleSave, flush, isSaving, lastSaved, saveError, draftId: draftIdRef }
}
