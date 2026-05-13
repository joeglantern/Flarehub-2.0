import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { wsClient } from '@/lib/ws'
import { toast } from '@/store/ui.store'
import type { Notification } from '@/types/api'

export function useWebSocket() {
  const qc = useQueryClient()

  useEffect(() => {
    const unsubs = [
      wsClient.on('notification', (data) => {
        const n = data as Notification
        qc.invalidateQueries({ queryKey: ['notifications'] })
        toast.info(n.title, n.body)
      }),

      wsClient.on('application_status_changed', () => {
        qc.invalidateQueries({ queryKey: ['applications'] })
        toast.info('Application updated')
      }),

      wsClient.on('evidence_reviewed', () => {
        qc.invalidateQueries({ queryKey: ['evidence'] })
        toast.info('Evidence reviewed')
      }),

      wsClient.on('mentor_assigned', () => {
        qc.invalidateQueries({ queryKey: ['user'] })
        toast.success('Mentor assigned', 'You have been assigned a mentor')
      }),

      wsClient.on('meeting_scheduled', () => {
        qc.invalidateQueries({ queryKey: ['meetings'] })
        toast.info('New meeting scheduled')
      }),

      wsClient.on('meeting_cancelled', () => {
        qc.invalidateQueries({ queryKey: ['meetings'] })
        toast.warning('Meeting cancelled')
      }),

      wsClient.on('smart_goal_commented', () => {
        qc.invalidateQueries({ queryKey: ['smart-goal'] })
        toast.info('Admin left a comment on your SMART Goals')
      }),

      wsClient.on('submission_commented', (data) => {
        const { submissionType } = data as { submissionType: 'milestone_plan' | 'market_research' }
        if (submissionType === 'milestone_plan') {
          qc.invalidateQueries({ queryKey: ['milestone-plan'] })
          toast.info('Admin left a comment on your Milestone Plan')
        } else {
          qc.invalidateQueries({ queryKey: ['market-research'] })
          toast.info('Admin left a comment on your Market Research')
        }
      }),

      wsClient.on('new_announcement', () => {
        qc.invalidateQueries({ queryKey: ['announcements'] })
        toast.info('New announcement posted')
      }),

      wsClient.on('submission_reviewed', () => {
        qc.invalidateQueries({ queryKey: ['user-submissions'] })
        toast.info('Your submission has been reviewed')
      }),

      wsClient.on('new_message', () => {
        qc.invalidateQueries({ queryKey: ['conversations'] })
        qc.invalidateQueries({ queryKey: ['messages'] })
      }),

      wsClient.on('new_program', () => {
        qc.invalidateQueries({ queryKey: ['programs'] })
        toast.success('New program available')
      }),
    ]

    return () => unsubs.forEach((fn) => fn())
  }, [qc])
}
