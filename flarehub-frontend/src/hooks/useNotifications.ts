import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/ws'
import type { ApiPaginated, Notification } from '@/types/api'

export function useNotifications(page = 1) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', page],
    queryFn:  () =>
      api.get<ApiPaginated<Notification>>('/notifications/me', { params: { page, limit: 20 } })
        .then(r => r.data),
  })

  const unreadCount = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn:  () =>
      api.get<ApiPaginated<Notification>>('/notifications/me', { params: { isRead: false, limit: 1 } })
        .then(r => r.data.meta.total),
  })

  const markRead = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  useEffect(() => {
    const unsub = wsClient.on('notification', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })
    return () => unsub()
  }, [qc])

  return {
    notifications: query.data?.data ?? [],
    meta:          query.data?.meta,
    isLoading:     query.isLoading,
    unreadCount:   unreadCount.data ?? 0,
    markRead:      (id: number) => markRead.mutate(id),
    markAllRead:   () => markAllRead.mutate(),
  }
}
