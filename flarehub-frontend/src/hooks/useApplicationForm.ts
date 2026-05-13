import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiSuccess } from '@/types/api'
import type { FormSchema } from '@/types/applicationForm'

export function useApplicationForm(programId: number | string) {
  return useQuery({
    queryKey: ['program-form', programId],
    queryFn:  () =>
      api
        .get<ApiSuccess<FormSchema | null>>(`/programs/${programId}/form`)
        .then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveApplicationForm(programId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (schema: FormSchema | null) =>
      api
        .put<ApiSuccess<FormSchema | null>>(`/programs/${programId}/form`, schema)
        .then((r) => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(['program-form', programId], data)
      qc.invalidateQueries({ queryKey: ['programs'] })
    },
  })
}
