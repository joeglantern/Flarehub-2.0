import type {
  Notification,
  Message,
  MentorMeeting,
  ApplicationStatus,
  EvidenceStatus,
  SubmissionStatus,
} from '@prisma/client';

export interface AdminOverviewStats {
  totalUsers:           number;
  totalApplications:    number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingEvidence:      number;
  activePrograms:       number;
  totalPrograms:        number;
  newUsersThisMonth:    number;
  successRate:          number;
}

export type ServerEvent =
  | { type: 'connected';                  data: { unreadNotifications: number } }
  | { type: 'notification';               data: Notification }
  | { type: 'new_message';                data: Message & { senderName: string } }
  | { type: 'message_edited';             data: { id: number; content: string; senderId: string; receiverId: string } }
  | { type: 'message_deleted';            data: { id: number; senderId: string; receiverId: string } }
  | { type: 'typing';                     data: { fromUserId: string; conversationId: string } }
  | { type: 'application_status_changed'; data: { applicationId: number; programName: string; status: ApplicationStatus } }
  | { type: 'evidence_reviewed';          data: { evidenceId: number; status: EvidenceStatus; notes?: string } }
  | { type: 'mentor_assigned';            data: { mentorId: string; mentorName: string } }
  | { type: 'mentor_unassigned';          data: { mentorId: string } }
  | { type: 'meeting_scheduled';          data: MentorMeeting & { mentorName: string } }
  | { type: 'meeting_cancelled';          data: { meetingId: number; mentorName: string } }
  | { type: 'smart_goal_commented';       data: { comment: string; commentedAt: string } }
  | { type: 'submission_commented';       data: { submissionType: 'milestone_plan' | 'market_research'; comment: string; commentedAt: string } }
  | { type: 'submission_reviewed';        data: { submissionId: number; status: SubmissionStatus; notes?: string } }
  | { type: 'new_program';               data: { programId: number; programName: string } }
  | { type: 'new_announcement';          data: { id: number; title: string; body: string; isPinned: boolean } }
  | { type: 'admin_stats_update';         data: AdminOverviewStats }
  | { type: 'user_online';                data: { userId: string } }
  | { type: 'user_offline';               data: { userId: string } }
  | { type: 'messages_read';              data: { conversationId: string; readBy: string } }
  | { type: 'pong' }
  | { type: 'error';                      data: { code: string; message: string } };

export type ClientEvent =
  | { type: 'ping' }
  | { type: 'message_send';  data: { receiverId: string; content: string } }
  | { type: 'typing';        data: { receiverId: string } }
  | { type: 'mark_read';     data: { type: 'notification' | 'message'; id: number } }
  | { type: 'mark_all_read'; data: { type: 'notification' | 'message'; contactId?: string } };
