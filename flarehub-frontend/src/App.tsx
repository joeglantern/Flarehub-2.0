import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useAuthInit } from '@/hooks/useAuth'

// Auth
const LoginPage    = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage   = lazy(() => import('@/pages/auth/SignupPage'))
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallbackPage'))
const Onboarding   = lazy(() => import('@/pages/onboarding/OnboardingPage'))

// Entrepreneur
const Dashboard        = lazy(() => import('@/pages/entrepreneur/DashboardPage'))
const Programs         = lazy(() => import('@/pages/entrepreneur/ProgramsPage'))
const ProgramDetail    = lazy(() => import('@/pages/entrepreneur/ProgramDetailPage'))
const MyApplications   = lazy(() => import('@/pages/entrepreneur/MyApplicationsPage'))
const ApplyPage        = lazy(() => import('@/pages/entrepreneur/ApplyPage'))
const SmartGoals       = lazy(() => import('@/pages/entrepreneur/SmartGoalsPage'))
const MilestonePlan    = lazy(() => import('@/pages/entrepreneur/MilestonePlanPage'))
const MarketResearch   = lazy(() => import('@/pages/entrepreneur/MarketResearchPage'))
const Evidence         = lazy(() => import('@/pages/entrepreneur/EvidencePage'))
const Documents        = lazy(() => import('@/pages/entrepreneur/DocumentsPage'))
const Templates        = lazy(() => import('@/pages/entrepreneur/TemplatesPage'))
const BusinessPlan     = lazy(() => import('@/pages/entrepreneur/BusinessPlanPage'))
const Messages              = lazy(() => import('@/pages/entrepreneur/MessagesPage'))
const MentorshipApply       = lazy(() => import('@/pages/entrepreneur/MentorshipApplyPage'))
const MentorshipApplications = lazy(() => import('@/pages/entrepreneur/MentorshipApplicationsPage'))
const SparkBot              = lazy(() => import('@/pages/entrepreneur/SparkBotPage'))
const Notifications    = lazy(() => import('@/pages/entrepreneur/NotificationsPage'))
const Announcements    = lazy(() => import('@/pages/entrepreneur/AnnouncementsPage'))
const Profile          = lazy(() => import('@/pages/entrepreneur/ProfilePage'))

// Mentor
const MentorDashboard  = lazy(() => import('@/pages/mentor/MentorDashboardPage'))
const Mentees          = lazy(() => import('@/pages/mentor/MenteesPage'))
const MenteeDetail     = lazy(() => import('@/pages/mentor/MenteeDetailPage'))
const Meetings         = lazy(() => import('@/pages/mentor/MeetingsPage'))
const MentorInviteLinks = lazy(() => import('@/pages/mentor/MentorInviteLinksPage'))
const MentorApplications = lazy(() => import('@/pages/mentor/MentorApplicationsPage'))

// Admin
const FormBuilderPage  = lazy(() => import('@/pages/admin/FormBuilderPage'))
const AdminDashboard   = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminUsers       = lazy(() => import('@/pages/admin/UsersPage'))
const AdminUserDetail  = lazy(() => import('@/pages/admin/UserDetailPage'))
const AdminPrograms    = lazy(() => import('@/pages/admin/ProgramsAdminPage'))
const AdminApps        = lazy(() => import('@/pages/admin/ApplicationsPage'))
const AdminEvidence    = lazy(() => import('@/pages/admin/EvidenceReviewPage'))
const AdminSubmissions = lazy(() => import('@/pages/admin/SubmissionsPage'))
const AdminMentors     = lazy(() => import('@/pages/admin/MentorManagementPage'))
const AdminAnalytics   = lazy(() => import('@/pages/admin/AnalyticsPage'))
const AdminAnnouncements = lazy(() => import('@/pages/admin/AnnouncementsPage'))
const AdminActivityLog = lazy(() => import('@/pages/admin/ActivityLogPage'))
const AdminSettings    = lazy(() => import('@/pages/admin/SettingsPage'))
const AdminDocuments   = lazy(() => import('@/pages/admin/DocumentsAdminPage'))
const AdminReports     = lazy(() => import('@/pages/admin/ReportsPage'))
const AdminImport      = lazy(() => import('@/pages/admin/ImportUsersPage'))

export default function App() {
  useAuthInit()

  return (
    <>
      <Suspense fallback={null}>
        <ErrorBoundary>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/signup"         element={<SignupPage />} />
          <Route path="/auth/callback"  element={<AuthCallback />} />
          <Route path="/onboarding"     element={<Onboarding />} />

          {/* Mentorship apply — standalone layout, requires auth */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mentorship/apply/:token" element={<MentorshipApply />} />
          </Route>

          {/* Full-screen admin tools (no AppShell) */}
          <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
            <Route path="/admin/programs/:id/form-builder" element={<FormBuilderPage />} />
          </Route>

          {/* Protected — all roles */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>

              {/* Entrepreneur */}
              <Route path="/dashboard"                   element={<Dashboard />} />
              <Route path="/programs"                    element={<Programs />} />
              <Route path="/programs/:id"                element={<ProgramDetail />} />
              <Route path="/programs/:id/apply"          element={<ApplyPage />} />
              <Route path="/applications"                element={<MyApplications />} />
              <Route path="/submissions/smart-goals"     element={<SmartGoals />} />
              <Route path="/submissions/milestones"      element={<MilestonePlan />} />
              <Route path="/submissions/market-research" element={<MarketResearch />} />
              <Route path="/evidence"                    element={<Evidence />} />
              <Route path="/documents"                   element={<Documents />} />
              <Route path="/templates"                   element={<Templates />} />
              <Route path="/business-plan"               element={<BusinessPlan />} />
              <Route path="/messages"                         element={<Messages />} />
              <Route path="/messages/:contactId"              element={<Messages />} />
              <Route path="/mentorship/applications"          element={<MentorshipApplications />} />
              <Route path="/sparkbot"                    element={<SparkBot />} />
              <Route path="/notifications"               element={<Notifications />} />
              <Route path="/announcements"               element={<Announcements />} />
              <Route path="/profile"                     element={<Profile />} />

              {/* Mentor */}
              <Route path="/mentor"                element={<MentorDashboard />} />
              <Route path="/mentor/mentees"        element={<Mentees />} />
              <Route path="/mentor/mentees/:id"    element={<MenteeDetail />} />
              <Route path="/mentor/meetings"       element={<Meetings />} />
              <Route path="/mentor/messages"                   element={<Messages />} />
              <Route path="/mentor/messages/:contactId"        element={<Messages />} />
              <Route path="/mentor/invite-links"               element={<MentorInviteLinks />} />
              <Route path="/mentor/applications"               element={<MentorApplications />} />

              {/* Admin */}
              <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
                <Route path="/admin"                    element={<AdminDashboard />} />
                <Route path="/admin/users"              element={<AdminUsers />} />
                <Route path="/admin/users/:id"          element={<AdminUserDetail />} />
                <Route path="/admin/programs"           element={<AdminPrograms />} />
                <Route path="/admin/applications"       element={<AdminApps />} />
                <Route path="/admin/evidence"           element={<AdminEvidence />} />
                <Route path="/admin/submissions"        element={<AdminSubmissions />} />
                <Route path="/admin/mentors"            element={<AdminMentors />} />
                <Route path="/admin/analytics"          element={<AdminAnalytics />} />
                <Route path="/admin/announcements"      element={<AdminAnnouncements />} />
                <Route path="/admin/activity-log"       element={<AdminActivityLog />} />
                <Route path="/admin/settings"           element={<AdminSettings />} />
                <Route path="/admin/documents"          element={<AdminDocuments />} />
                <Route path="/admin/reports"            element={<AdminReports />} />
                <Route path="/admin/import"             element={<AdminImport />} />
              </Route>

            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
      </Suspense>
      <ToastContainer />
    </>
  )
}
