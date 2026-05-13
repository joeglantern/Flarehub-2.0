import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiSuccess } from '@/types/api'
import type { Program } from '@/types/api'
import { useApplicationForm, useSaveApplicationForm } from '@/hooks/useApplicationForm'
import { FormBuilder } from '@/components/form-builder/FormBuilder'
import type { FormSchema } from '@/types/applicationForm'
import { toast } from '@/store/ui.store'
import { Spinner } from '@/components/ui/Spinner'
import { WarningCircle } from '@phosphor-icons/react'

export default function FormBuilderPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const programQuery = useQuery({
    queryKey: ['program', id],
    queryFn:  () =>
      api.get<ApiSuccess<Program>>(`/programs/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const formQuery = useApplicationForm(id!)
  const saveMutation = useSaveApplicationForm(id!)

  const isLoading = programQuery.isLoading || formQuery.isLoading
  const isError   = programQuery.isError   || formQuery.isError

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <Spinner size="md" className="text-[var(--color-forest-500)]" />
      </div>
    )
  }

  if (isError || !programQuery.data) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <WarningCircle size={36} className="text-[var(--color-error)]" />
          <p className="text-sm text-[var(--color-ink-mute)]">Failed to load program</p>
          <button
            onClick={() => navigate('/admin/programs')}
            className="text-sm text-[var(--color-forest-500)] hover:underline"
          >
            Back to programs
          </button>
        </div>
      </div>
    )
  }

  async function handleSave(schema: FormSchema) {
    try {
      await saveMutation.mutateAsync(schema)
      toast.success('Form saved — the application form has been updated.')
    } catch {
      toast.error('Save failed — could not save the form. Please try again.')
    }
  }

  return (
    <FormBuilder
      initialSchema={formQuery.data ?? null}
      programName={programQuery.data.name}
      isSaving={saveMutation.isPending}
      saveError={saveMutation.isError ? 'Save failed' : null}
      onSave={handleSave}
      onBack={() => navigate('/admin/programs')}
    />
  )
}
