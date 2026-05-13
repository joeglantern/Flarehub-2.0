# Flarehub Frontend — Design and Build Plan

## Design Philosophy

Built like a small, intentional team spent months on it. Every margin deliberate. Every interaction considered. Not a template. Not a UI kit clone. A place entrepreneurs actually want to open every day.

Influences: Attio's data density, Linear's navigation clarity, Mercury's whitespace discipline, Stripe's table confidence.

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Vite | 5.x | Build tool |
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| React Router | 6.x | Routing |
| TanStack Query | 5.x | Server state, caching, refetching |
| Zustand | 4.x | Client state (auth, UI state) |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Form validation schemas |
| Tailwind CSS | 3.x | Styling |
| Radix UI | latest | Headless accessible primitives |
| Phosphor Icons | 2.x | Iconography (only icon library used) |
| Recharts | 2.x | Analytics charts |
| Framer Motion | 11.x | Micro-animations |
| @supabase/supabase-js | 2.x | Auth (login, signup, session) |
| Axios | 1.x | HTTP client |

---

## Design System

### Typography

```
Display / Hero headings:   Bricolage Grotesque  (Google Fonts)
All other text:            Inter                (Google Fonts)
Monospace (IDs, code):     JetBrains Mono       (Google Fonts)
```

Bricolage Grotesque has the personality that sets the platform apart — slightly quirky geometry on certain letterforms, but completely legible. Used only for large headings (h1, h2, feature titles). Everything else is Inter.

### Type Scale

```
xs:    12px / 16px line-height  — captions, labels
sm:    13px / 20px              — secondary text, metadata
base:  14px / 22px              — body default
md:    15px / 24px              — slightly elevated body
lg:    18px / 28px              — section intros
xl:    22px / 30px              — page subtitles
2xl:   28px / 36px              — page titles
3xl:   36px / 44px              — feature headings (Bricolage)
4xl:   48px / 56px              — hero (Bricolage)
```

### Colors

No gradients. No purple. No teal. No AI palette.

```css
/* Backgrounds */
--bg-base:      #f7f6f3;   /* warm paper white — the canvas */
--bg-surface:   #ffffff;   /* cards, panels */
--bg-elevated:  #f0ede8;   /* hover states, subtle fills */
--bg-inset:     #e8e4de;   /* input backgrounds */

/* Borders */
--border:       #e2ddd7;   /* default border */
--border-strong:#c8c2ba;   /* emphasized border */

/* Text */
--text-primary:   #1a1916; /* warm near-black */
--text-secondary: #6b6560; /* supporting text */
--text-muted:     #a39e98; /* placeholder, disabled */
--text-inverse:   #ffffff;

/* Brand — deep forest green */
--green-50:   #edf7f1;
--green-100:  #d0ecdb;
--green-500:  #1d6f42;   /* primary action */
--green-600:  #185e38;   /* hover */
--green-700:  #12472b;   /* pressed */
--green-900:  #0a2e1c;

/* Accent — terracotta (for contrast, CTAs, highlights) */
--terra-50:   #fdf2ed;
--terra-100:  #f9ddd1;
--terra-500:  #c4522a;   /* accent */
--terra-600:  #a8441f;   /* hover */

/* Semantic */
--success:  #1d6f42;
--warning:  #b5720e;
--error:    #b91c1c;
--info:     #1d4ed8;

/* Status badge fills (muted) */
--badge-approved:    #edf7f1 / #1d6f42;
--badge-pending:     #fef9ec / #b5720e;
--badge-rejected:    #fef2f2 / #b91c1c;
--badge-review:      #eff6ff / #1d4ed8;
```

### Spacing

4px base unit. Generous whitespace — never cramped.

```
1   = 4px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

### Border Radius

```
sm:   4px  — inputs, small badges
md:   8px  — cards, buttons, panels (default)
lg:   12px — modals, dropdowns
xl:   16px — large feature cards
full: 9999px — pill badges, avatars
```

### Shadows

Extremely subtle. No dramatic shadows.

```
sm:  0 1px 2px rgba(0,0,0,0.06)
md:  0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
lg:  0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)
```

### Motion

```
fast:    100ms ease-out   — hover color changes
default: 150ms ease-out   — most transitions
slow:    200ms ease-out   — panel slides, modal open
```

No bounce. No spring physics on data UI. Subtle fade + slight translate on mount.

---

## File Structure

```
flarehub-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── lib/
│   │   ├── api.ts              — axios instance, interceptors, base URL
│   │   ├── supabase.ts         — supabase client (auth only)
│   │   ├── queryClient.ts      — TanStack Query client config
│   │   └── ws.ts               — WebSocket singleton + reconnect logic
│   │
│   ├── store/
│   │   ├── auth.store.ts       — user session, role, isMentor
│   │   └── ui.store.ts         — sidebar open, active panel, toast queue
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWebSocket.ts
│   │   ├── useNotifications.ts
│   │   └── useDebounce.ts
│   │
│   ├── types/
│   │   ├── api.ts              — all API response types (mirrors backend)
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── ui/                 — design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── Separator.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    — root layout wrapper
│   │   │   ├── Sidebar.tsx     — main navigation
│   │   │   ├── TopBar.tsx      — breadcrumb + notifications + avatar
│   │   │   ├── MobileNav.tsx   — bottom nav on mobile
│   │   │   └── PageHeader.tsx  — consistent page title + actions slot
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   ├── OnboardingShell.tsx
│   │   │   ├── StepPersonal.tsx
│   │   │   ├── StepBusiness.tsx
│   │   │   └── StepProgress.tsx
│   │   │
│   │   ├── programs/
│   │   │   ├── ProgramCard.tsx
│   │   │   ├── ProgramDetail.tsx
│   │   │   └── ProgramStatusBadge.tsx
│   │   │
│   │   ├── applications/
│   │   │   ├── ApplicationCard.tsx
│   │   │   ├── ApplicationStatusBadge.tsx
│   │   │   ├── ApplyModal.tsx
│   │   │   └── ApplicationScorePanel.tsx
│   │   │
│   │   ├── submissions/
│   │   │   ├── SmartGoalForm.tsx
│   │   │   ├── MilestonePlanForm.tsx
│   │   │   ├── MilestoneItem.tsx
│   │   │   └── MarketResearchForm.tsx
│   │   │
│   │   ├── evidence/
│   │   │   ├── EvidenceUploader.tsx
│   │   │   ├── EvidenceCard.tsx
│   │   │   └── EvidenceStatusBadge.tsx
│   │   │
│   │   ├── documents/
│   │   │   ├── DocumentUploader.tsx
│   │   │   └── DocumentCard.tsx
│   │   │
│   │   ├── messages/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── MessageThread.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationPanel.tsx
│   │   │   └── NotificationItem.tsx
│   │   │
│   │   ├── mentor/
│   │   │   ├── MenteeCard.tsx
│   │   │   ├── MenteeProfilePanel.tsx
│   │   │   ├── MeetingCard.tsx
│   │   │   ├── ScheduleMeetingModal.tsx
│   │   │   └── NoteEditor.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── UserTable.tsx
│   │   │   ├── ApplicationTable.tsx
│   │   │   ├── EvidenceReviewCard.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── AnalyticsChart.tsx
│   │   │   └── AnnouncementForm.tsx
│   │   │
│   │   └── shared/
│   │       ├── FileUploadZone.tsx  — drag + drop, signed URL flow
│   │       ├── ProfileAvatar.tsx
│   │       ├── SearchInput.tsx
│   │       ├── FilterBar.tsx
│   │       └── ConfirmModal.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── AuthCallbackPage.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   └── OnboardingPage.tsx
│   │   │
│   │   ├── entrepreneur/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProgramsPage.tsx
│   │   │   ├── ProgramDetailPage.tsx
│   │   │   ├── MyApplicationsPage.tsx
│   │   │   ├── SmartGoalsPage.tsx
│   │   │   ├── MilestonePlanPage.tsx
│   │   │   ├── MarketResearchPage.tsx
│   │   │   ├── EvidencePage.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   ├── TemplatesPage.tsx
│   │   │   ├── BusinessPlanPage.tsx
│   │   │   ├── MessagesPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   │
│   │   ├── mentor/
│   │   │   ├── MentorDashboardPage.tsx
│   │   │   ├── MenteesPage.tsx
│   │   │   ├── MenteeDetailPage.tsx
│   │   │   ├── MeetingsPage.tsx
│   │   │   └── MentorMessagesPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── AdminDashboardPage.tsx
│   │       ├── UsersPage.tsx
│   │       ├── UserDetailPage.tsx
│   │       ├── ProgramsAdminPage.tsx
│   │       ├── ApplicationsPage.tsx
│   │       ├── EvidenceReviewPage.tsx
│   │       ├── SubmissionsPage.tsx
│   │       ├── MentorManagementPage.tsx
│   │       ├── AnalyticsPage.tsx
│   │       ├── AnnouncementsPage.tsx
│   │       ├── SettingsPage.tsx
│   │       └── ActivityLogPage.tsx
│   │
│   └── api/
│       ├── auth.api.ts
│       ├── users.api.ts
│       ├── programs.api.ts
│       ├── applications.api.ts
│       ├── submissions.api.ts
│       ├── evidence.api.ts
│       ├── documents.api.ts
│       ├── templates.api.ts
│       ├── businessPlan.api.ts
│       ├── mentor.api.ts
│       ├── messages.api.ts
│       ├── notifications.api.ts
│       ├── announcements.api.ts
│       ├── reports.api.ts
│       └── admin.api.ts
│
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Pages and What Each Does

### Auth Pages

**LoginPage** — email + password via Supabase Auth. After sign in, calls `POST /auth/sync-user` to ensure user row exists, then redirects based on `role` and `profileComplete`.

**SignupPage** — email + password registration via Supabase. On success, calls `POST /auth/sync-user` and pushes to onboarding.

**AuthCallbackPage** — handles Supabase OAuth callback redirect.

---

### Onboarding

**OnboardingPage** — 2-step flow for users with `profileComplete: false`.

Step 1: First name, last name, phone, county, gender  
Step 2: Business name, business stage (pill selector), business description

On complete, calls `PATCH /users/me`. Backend sets `profileComplete: true` automatically when all fields are filled. Redirects to dashboard.

---

### Entrepreneur Pages

**DashboardPage**
The main hub. Shows:
- Greeting with first name (not "Welcome back, User!")
- Active program they applied to and its status
- Submission progress bar: Smart Goals / Milestone Plan / Market Research
- Recent evidence uploads
- Upcoming mentor meeting card
- Unread announcements strip at top
- Quick actions: Upload evidence, Message mentor, View templates

**ProgramsPage**
Card grid of all active programs. Each card: name, deadline, grant amount, tags, application count. "Apply" button opens `ApplyModal`. No redundant text. Program tag pills use Phosphor icons.

**ProgramDetailPage**
Full detail: description, eligibility requirements, deadline countdown, grant amount, tags. Application status if already applied. Apply CTA if not.

**MyApplicationsPage**
Timeline-style list of all applications. Status badge + program name + date. Clicking expands to show any admin score if available.

**SmartGoalsPage**
Split pane: left has the form (6 fields), right shows a persistent preview of what they've written. If admin has commented, shows it in a highlighted aside. First save creates, subsequent saves update (handled by the backend upsert-like pattern via POST then PATCH).

**MilestonePlanPage**
The most complex form. Shows:
- Top fields: business name, grant amount, implementation period, stage
- 5 milestone accordions — each expandable with: title, timeline, budget, goal, tasks, evidence, metrics (tag input)
All 5 milestones are always visible in collapsed state with completion indicators.

**MarketResearchPage**
Multi-section form broken into logical groups:
- Survey basics (date, sample size, duration, objective)
- Demographics (age, gender, location)
- Findings (challenges, awareness, interest, willingness to pay, price range)
- Insights (opportunities, risks, next steps as tag input)

**EvidencePage**
Drag-and-drop upload zone at top. Below: a filterable grid of all uploads with status badges (pending / verified / rejected). Clicking any card shows full preview + admin notes if rejected.

**DocumentsPage**
Similar to evidence but for business plan PDFs and pitch decks. Table view with category, status, upload date. Download button generates signed URL on click.

**TemplatesPage**
Clean grid of downloadable admin templates. Each card: title, type badge, file format icon (Phosphor). Direct download link (public URLs, no signed URL needed).

**BusinessPlanPage**
The in-app business plan builder. Multi-section form that autosaves. Sections: business overview, team, products/services, market, operations, financials. Completion ring in the sidebar.

**MessagesPage**
Split layout: left panel = conversation list (contact name, last message preview, unread count badge, timestamp). Right panel = message thread. Message input at bottom with send on Enter. Real-time via WebSocket. Typing indicator appears after 500ms of inactivity.

**NotificationsPage**
Full-page list grouped by "Today", "This week", "Earlier". Each item: icon based on notification type (Phosphor), title, body, time ago. Mark all read button in top right. Clicking navigates to the relevant resource.

**ProfilePage**
Two-column layout: left = profile info form, right = activity feed (the `/users/me/activity` endpoint). Profile picture upload uses the signed URL flow. Password change handled via Supabase Auth.

---

### Mentor Pages

**MentorDashboardPage**
Summary cards: total mentees, upcoming meetings this week, meetings completed, pending notes. List of mentees with submission progress indicators.

**MenteesPage**
Table of assigned mentees. Each row: avatar, name, county, business stage, submission completion (3 colored dots), last activity. Click to open mentee detail.

**MenteeDetailPage**
Tab layout: Profile / Submissions / Evidence / Notes. Read-only view of everything the mentee has submitted. Notes tab has an inline editor for creating and editing mentor notes.

**MeetingsPage**
Calendar-adjacent list view grouped by date. Upcoming / Completed / Cancelled tabs. Schedule button opens `ScheduleMeetingModal`. Meeting cards show type badge (Virtual/InPerson), link for virtual meetings, mentee name.

---

### Admin Pages

**AdminDashboardPage**
Stats cards row: total users, total applications, approved, pending, active programs, pending evidence. Two charts below: applications by month (line chart), county distribution (horizontal bar chart). Recent activity log strip at bottom.

**UsersPage**
Full-featured table with filters: role, county, verified status, mentor status, business stage. Search bar. Export CSV button. Each row: avatar, name, email, role badge, verified badge, application count. Click to open `UserDetailPage`.

**UserDetailPage**
Full admin view. Tabs: Profile / Applications / Submissions / Evidence / Documents / Activity. Actions panel on right: change role, verify/unverify, assign/remove mentor status. 

**ApplicationsPage**
Sortable, filterable table. Columns: applicant, program, date, status. Bulk status update via checkbox select + action bar that slides up from bottom. Export CSV. Click to expand scoring panel inline.

**EvidenceReviewPage**
Card grid of pending evidence with file preview. Admin can verify or reject inline with a notes field. Keyboard shortcut: V to verify, R to reject (displayed as hints).

**SubmissionsPage**
Tabs: Smart Goals / Milestone Plans / Market Research. Table per tab with admin comment indicator. Click to open full submission in a side drawer with comment input at bottom.

**MentorManagementPage**
Two-panel: left = list of mentors with mentee count. Right = selected mentor's mentee list. Assign mentee via search + select. Remove assignment with confirm modal.

**AnalyticsPage**
Full analytics page with all 5 endpoints:
- Overview stats grid
- Monthly applications chart
- Gender distribution (donut chart)
- County distribution (horizontal bar)
- Per-program progress (accordion, one per program)

**AnnouncementsPage**
Table of all announcements with active/inactive toggle. Create button opens inline form. Pin toggle. Target role filter badge.

**SettingsPage**
Simple key-value settings editor. Only super admin can edit. Save triggers `PATCH /admin/settings`.

**ActivityLogPage**
Paginated table of all admin actions. Filter by admin, target type, date range.

---

## Navigation Structure

### Entrepreneur Sidebar
```
Overview         (House icon)
Programs         (Binoculars icon)
My Applications  (FileText icon)
Submissions
  Smart Goals    (Target icon)
  Milestone Plan (Stairs icon)
  Market Research(ChartBar icon)
Evidence         (Camera icon)
Documents        (FolderOpen icon)
Templates        (DownloadSimple icon)
Business Plan    (Briefcase icon)
---
Messages         (ChatCircle icon) + unread badge
Notifications    (Bell icon) + unread badge
---
Profile          (User icon)
```

### Mentor Sidebar
```
Dashboard        (House icon)
My Mentees       (Users icon)
Meetings         (CalendarBlank icon)
Messages         (ChatCircle icon)
---
Profile          (User icon)
```

### Admin Sidebar
```
Dashboard        (ChartPieSlice icon)
Users            (UsersThree icon)
Programs         (Binoculars icon)
Applications     (ClipboardText icon)
Evidence Review  (SealCheck icon)
Submissions      (FileText icon)
Mentor Mgmt      (UsersFour icon)
Analytics        (TrendUp icon)
Announcements    (MegaphoneSimple icon)
Activity Log     (ClockCounterClockwise icon)
Settings         (Gear icon)
```

---

## API Integration

Every API call goes through `src/lib/api.ts` — an Axios instance that:
- Sets `baseURL` from `VITE_API_URL` env var
- Attaches the Supabase JWT on every request via a request interceptor
- On 401, refreshes the Supabase session and retries once
- On failure, throws a normalized `ApiError` that the UI can handle uniformly

All data fetching uses TanStack Query hooks co-located in `src/api/*.api.ts` files. Each file exports typed query/mutation hooks.

---

## WebSocket Integration

`src/lib/ws.ts` manages a single WebSocket connection:
- Connects after login at `ws://[host]/ws?token=<jwt>`
- Auto-reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Sends `ping` every 25 seconds to keep alive
- Emits typed events to subscribers via a simple event emitter pattern

`src/hooks/useWebSocket.ts` subscribes to specific event types. Each feature subscribes to the events it cares about and invalidates the relevant TanStack Query cache keys.

Events handled:
| Event | Action |
|---|---|
| `notification` | Increment notification badge, show toast |
| `new_message` | Update conversation list, append to thread |
| `application_status_changed` | Invalidate applications query, show toast |
| `evidence_reviewed` | Invalidate evidence query, show toast |
| `mentor_assigned` | Invalidate user query, show toast |
| `meeting_scheduled` | Invalidate meetings query, show toast |
| `meeting_cancelled` | Invalidate meetings query, show toast |
| `smart_goal_commented` | Invalidate smart goal query, show comment badge |
| `submission_reviewed` | Invalidate submissions query, show toast |
| `new_program` | Invalidate programs query, show banner |
| `new_announcement` | Show announcement banner |

---

## File Upload Flow

All uploads use the signed URL pattern (no file bytes touch the backend):

1. User selects file in `FileUploadZone`
2. Frontend validates file type and size client-side
3. Calls `POST /storage/signed-upload-url` with bucket, filename, mimeType, fileSize
4. Backend validates and returns `{ uploadUrl, storagePath, expiresIn }`
5. Frontend PUTs the file directly to Supabase Storage using the signed URL
6. On success, calls the relevant registration endpoint (e.g. `POST /evidence`) with the storagePath
7. TanStack Query cache is invalidated

`FileUploadZone` handles: drag-and-drop, file type validation, size validation, progress display, error states.

---

## Authentication Flow

1. User signs up / logs in via Supabase Auth (Supabase handles the JWT)
2. On session, call `GET /auth/profile-check`
3. If `profileComplete: false`, redirect to `/onboarding`
4. If `profileComplete: true`, redirect to role-based dashboard:
   - `entrepreneur` or `mentor` with `isMentor: true` → `/dashboard` (different layout)
   - `admin` / `super_admin` → `/admin`
5. Supabase session auto-refreshes. On expiry, `api.ts` interceptor handles the retry.

---

## Routing

```
/login
/signup
/onboarding

/dashboard                    — entrepreneur home
/programs                     — program list
/programs/:id                 — program detail
/applications                 — my applications
/submissions/smart-goals
/submissions/milestones
/submissions/market-research
/evidence
/documents
/templates
/business-plan
/messages
/messages/:contactId
/notifications
/profile

/mentor                       — mentor dashboard
/mentor/mentees
/mentor/mentees/:id
/mentor/meetings
/mentor/messages

/admin                        — admin dashboard
/admin/users
/admin/users/:id
/admin/programs
/admin/applications
/admin/evidence
/admin/submissions
/admin/mentors
/admin/analytics
/admin/announcements
/admin/activity-log
/admin/settings
```

---

## UI Conventions (Non-Negotiable)

**Copy**
- No "Welcome back" — use their first name directly. "Good morning, Amina."
- No em dashes anywhere
- No "Please" in error messages — direct and calm instead
- No "Submit" buttons — use action-specific labels: "Save goals", "Send message", "Apply now"
- Status labels: "Approved" not "APPROVED", "Pending review" not "Under Review"

**Icons**
- Phosphor only — regular weight by default, bold for active nav states, fill for status icons
- Every empty state has an icon above the heading
- No icon without a label (except in dense tables where tooltips are used)

**Tables**
- Zebra striping only with `--bg-elevated` — very subtle
- Sticky header when table scrolls
- Row hover shows action buttons that slide in from right
- Bulk selection: checkbox column appears on first checkbox click

**Forms**
- Label always above input, never inside (placeholder text only for format hints)
- Error messages appear below the field, never as alerts at top
- Required fields marked with a dot, not an asterisk
- Autosave where appropriate (business plan, notes) with a "Saved" indicator

**Loading States**
- Skeleton loaders match the exact shape of the content they replace
- No spinner for inline updates — optimistic updates instead
- Full-page spinner only on initial auth check

**Empty States**
- Every empty state: Phosphor icon (large, muted green), one-line heading, one-line body, one action button
- Never just "No data found"

**Toasts**
- Bottom-right, max 3 visible, auto-dismiss in 4s
- Types: success (green left border), error (red), info (blue), warning (amber)
- Keep copy short: "Application submitted" not "Your application has been submitted successfully"

**Modals**
- Max width 480px for confirmations, 640px for forms
- Always have a keyboard shortcut to close (Escape)
- Overlay click closes non-destructive modals only

---

## Responsive Breakpoints

```
mobile:  < 768px   — bottom nav, stacked layouts
tablet:  768-1024  — condensed sidebar (icon-only)
desktop: > 1024px  — full sidebar with labels
wide:    > 1280px  — two-column layouts for forms
```

---

## Performance Rules

- Route-based code splitting (React.lazy + Suspense)
- Images served from Supabase Storage via signed URLs with 1hr TTL
- TanStack Query staleTime: 30s for most queries, 5min for static data (programs list, templates)
- Pagination on all lists, default 20 per page
- Debounce search inputs at 300ms
- Virtualization (react-virtual) only for lists exceeding 100 rows

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001/ws
VITE_SUPABASE_URL=https://wiutvdauxvvzcpffzdve.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Accessibility

- All interactive elements keyboard navigable
- Focus rings visible (never `outline: none` without a replacement)
- ARIA labels on icon-only buttons
- Color is never the only indicator of status (always paired with text or icon)
- Form errors announced to screen readers via `aria-live`

---

## What Intentionally Makes This Not Look AI-Generated

- Bricolage Grotesque headings have personality no AI template uses
- Terracotta accent instead of the default blue/purple everyone reaches for
- Warm off-white background instead of pure white or gray-100
- Copy that uses real names and direct language
- Empty states with character, not boilerplate
- Status badges with warm-tinted backgrounds, not bright saturated colors
- Tables with action buttons that reveal on hover, not always-visible icon clutter
- Sidebar with grouped nav items and visual separators, not a flat list of 12 items
- Form labels that feel like they were written by a person, not copied from a design system example

