export type UserRole = 'entrepreneur' | 'mentor' | 'admin' | 'super_admin'
export type Gender = 'Male' | 'Female' | 'Other' | 'Unknown'
export type BusinessStage = 'Idea' | 'Prototype' | 'MVP' | 'Revenue'
export type ProgramStatus = 'Active' | 'Inactive'
export type ApplicationStatus = 'Pending' | 'UnderReview' | 'Approved' | 'Rejected'
export type EvidenceStatus = 'pending' | 'verified' | 'rejected'
export type DocumentStatus = 'Pending' | 'Reviewed' | 'NeedsRevision' | 'Approved'
export type DocumentCategory = 'milestone' | 'survey' | 'smart_goals' | 'market_research' | 'customer_feedback'
export type SubmissionStatus = 'Draft' | 'Submitted' | 'UnderReview' | 'Approved' | 'NeedsRevision'
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled'
export type MeetingType = 'Virtual' | 'InPerson'
export type MentorApplicationStatus = 'pending' | 'approved' | 'rejected'

export type NotificationType =
  | 'application_approved' | 'application_rejected' | 'application_under_review'
  | 'mentor_assigned' | 'mentor_unassigned'
  | 'meeting_scheduled' | 'meeting_cancelled'
  | 'evidence_verified' | 'evidence_rejected'
  | 'smart_goal_commented' | 'market_research_commented' | 'milestone_plan_commented'
  | 'submission_reviewed' | 'new_program' | 'new_message'
  | 'mentor_application_approved' | 'mentor_application_rejected'
export type TemplateType = 'milestone' | 'survey' | 'smart_goals' | 'market_research' | 'customer_feedback'
export type AnnouncementTarget = 'all' | 'entrepreneur' | 'mentor'
export type MentorshipApplicationStatus = 'pending' | 'accepted' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiPaginated<T> {
  success: true
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  gender: Gender
  phone: string | null
  county: string | null
  profilePic: string | null
  businessName: string | null
  businessStage: BusinessStage | null
  businessDescription: string | null
  businessPlanUrl: string | null
  role: UserRole
  isMentor: boolean
  isVerified: boolean
  profileComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface Program {
  id: number
  name: string
  description: string | null
  applicationDeadline: string | null
  status: ProgramStatus
  maxParticipants: number | null
  grantAmount: string | null
  eligibilityRequirements: string | null
  tags: string[]
  applicationCount?: number
  hasApplied?: boolean
  hasApplicationForm?: boolean
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: number
  userId: string
  programId: number
  status: ApplicationStatus
  isDraft: boolean
  appliedAt: string
  submittedAt?: string | null
  updatedAt: string
  responses?: import('./applicationForm').FormResponse | null
  adminComment?: string | null
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  program?: Pick<Program, 'id' | 'name'> & { hasApplicationForm?: boolean }
  programName?: string
  score?: ApplicationScore | null
}

export interface ApplicationScore {
  id: number
  applicationId: number
  adminId: string
  innovation: number
  feasibility: number
  impact: number
  teamStrength: number
  marketPotential: number
  totalScore: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SmartGoal {
  id: number
  userId: string
  goalStatement: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timebound: string
  adminComment: string | null
  commentedAt: string | null
  commentedById: string | null
  createdAt: string
  updatedAt: string
}

export interface MilestoneItem {
  number: number
  title: string
  timeline: string
  budget: string
  goal: string
  tasks: string
  evidence: string
  metrics: string[]
}

export interface MilestonePlan {
  id: number
  userId: string
  businessName: string
  grantAmount: string | null
  implementationPeriod: string | null
  stage: string | null
  milestones: MilestoneItem[]
  adminComment: string | null
  commentedAt: string | null
  commentedById: string | null
  createdAt: string
  updatedAt: string
}

export interface MarketResearch {
  id: number
  userId: string
  businessName: string
  surveyDate: string | null
  sampleSize: string | null
  surveyDuration: string | null
  surveyObjective: string | null
  ageDistribution: string | null
  genderBreakdown: string | null
  location: string | null
  otherCharacteristics: string | null
  topChallenges: string[] | null
  awareness: string | null
  interest: string | null
  avgWillingness: string | null
  priceRange: string | null
  currentSolutions: string | null
  openComments: string | null
  opportunity1: string | null
  opportunity2: string | null
  riskBarrier: string | null
  nextSteps: string[] | null
  adminComment: string | null
  commentedAt: string | null
  commentedById: string | null
  createdAt: string
  updatedAt: string
}

export interface Evidence {
  id: number
  userId: string
  programId: number | null
  milestoneNumber: number | null
  fileName: string
  storagePath: string
  fileType: string
  fileSize: number
  mimeType: string
  description: string | null
  category: string | null
  status: EvidenceStatus
  verifiedById: string | null
  verifiedAt: string | null
  notes: string | null
  uploadDate: string
  updatedAt: string
  downloadUrl?: string
}

export interface Document {
  id: number
  userId: string
  filename: string
  originalName: string
  storagePath: string
  fileSize: number
  fileType: string
  status: DocumentStatus
  documentCategory: DocumentCategory
  description: string | null
  priority: Priority
  tags: string | null
  version: string
  uploadedAt: string
  updatedAt: string
  downloadUrl?: string
}

export interface AdminTemplate {
  id: number
  title: string
  description: string | null
  filename: string
  originalName: string
  storagePath: string
  fileSize: number
  fileType: string
  templateType: TemplateType
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  downloadUrl?: string
}

export interface UserSubmission {
  id: number
  templateId: number
  userId: string
  submissionName: string
  filename: string
  originalName: string
  storagePath: string
  fileSize: number
  fileType: string
  status: SubmissionStatus
  notes: string | null
  submittedAt: string
  updatedAt: string
  downloadUrl?: string
  template?: Pick<AdminTemplate, 'id' | 'title' | 'templateType'>
}

export interface BusinessPlan {
  id: number
  userId: string
  planData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MentorMeeting {
  id: number
  mentorId: string
  menteeId: string
  meetingTime: string
  status: MeetingStatus
  meetingType: MeetingType
  link: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  mentee?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  mentor?: Pick<User, 'id' | 'firstName' | 'lastName'>
}

export interface MentorNote {
  id: number
  mentorId: string
  menteeId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: number
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  senderName?: string
  isDeleted?: boolean
}

export interface Conversation {
  contactId: string
  contactName: string
  contactProfilePic: string | null
  lastMessage: string
  lastMessageAt: string | null
  unreadCount: number
  isOnline: boolean
}

export interface Notification {
  id: number
  userId: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface Announcement {
  id: number
  title: string
  body: string
  isPinned: boolean
  isActive: boolean
  targetRole: AnnouncementTarget
  targetUserId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy?: Pick<User, 'firstName' | 'lastName'>
  targetUser?: Pick<User, 'firstName' | 'lastName'> | null
}

export interface SubmissionProgress {
  smartGoal: 'submitted' | 'not_started'
  milestonePlan: 'submitted' | 'not_started'
  marketResearch: 'submitted' | 'not_started'
}

export interface MenteeWithProgress extends User {
  assignedAt: string
  submissionProgress: SubmissionProgress
}

export interface AdminOverview {
  totalUsers: number
  totalApplications: number
  approvedApplications: number
  rejectedApplications: number
  pendingEvidence: number
  activePrograms: number
  totalPrograms: number
  newUsersThisMonth: number
  successRate: number
}

export interface SignedUploadResult {
  uploadUrl: string
  storagePath: string
  expiresIn: number
}

export interface ActivityItem {
  type: 'application' | 'submission' | 'evidence' | 'document'
  description: string
  date: string
}

export interface ProfileCheck {
  profileComplete: boolean
  role: UserRole
  isMentor: boolean
}

export interface ProgramMentor {
  id: number
  programId: number
  mentorId: string
  createdAt: string
  mentor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profilePic' | 'county'>
  program?: Pick<Program, 'id' | 'name' | 'status'>
  inviteLink?: MentorInviteLink | null
  applicationCount?: number
}

export interface MentorInviteLink {
  id: number
  token: string
  programMentorId: number
  isActive: boolean
  createdAt: string
  applicationCount?: number
}

export interface MentorshipApplication {
  id: number
  programMentorId: number
  entrepreneurId: string
  inviteLinkId: number | null
  status: MentorshipApplicationStatus
  message: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  entrepreneur?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profilePic' | 'businessName' | 'businessStage' | 'county'>
  programMentor?: {
    id: number
    mentor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profilePic' | 'county'>
    program?: Pick<Program, 'id' | 'name'>
  }
}

export interface MentorApplication {
  id: number
  userId: string
  expertise: string[]
  yearsExperience: number
  currentRole: string
  currentCompany: string | null
  linkedIn: string | null
  motivation: string
  availability: string
  status: MentorApplicationStatus
  adminNotes: string | null
  reviewedById: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profilePic' | 'county'>
}

export interface MentorApplyInfo {
  mentor: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profilePic' | 'county'>
  program: Pick<Program, 'id' | 'name' | 'description' | 'status' | 'tags'>
  programMentorId: number
  linkId: number
}
