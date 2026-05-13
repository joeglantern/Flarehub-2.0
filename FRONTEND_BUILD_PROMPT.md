# Flarehub Frontend — Build Prompt

## Your Mission

You are building the complete production-ready frontend for Flarehub, a youth entrepreneurship program management platform. The backend is already fully built and running. Your job is to implement the frontend exactly as specified in FRONTEND_PLAN.md — no improvisation, no skipping sections, no placeholders.

## Mandatory Reference

Read this file before writing a single line of code and refer back to it constantly:

```
FRONTEND_PLAN.md  (located in the same directory as this file)
```

That document is the single source of truth. It contains:
- The complete design system (colors, typography, spacing, shadows)
- Every page and what it does
- The complete file structure
- All navigation structures per role
- API integration approach
- WebSocket integration
- Upload flow
- UI conventions that must never be violated

Do not deviate from it. If something in this prompt conflicts with the plan, the plan wins.

---

## Project Location

Create the frontend in a new folder:

```
C:\Users\liban\OneDrive\Desktop\Projects\Flarehub Rebuild\flarehub-frontend\
```

---

## Backend

The backend is already running at `http://localhost:3001`. All endpoints are documented in `BACKEND_DESIGN.md`. The API prefix is `/api/v1`. WebSocket is at `ws://localhost:3001/ws`.

Supabase project: `https://wiutvdauxvvzcpffzdve.supabase.co`  
Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdXR2ZGF1eHZ2emNwZmZ6ZHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTk2NzQsImV4cCI6MjA5MTgzNTY3NH0.p-nGyN5k64Zf6Nb2JZ5PninLgOZTB_HZluKsPjoSUsM`

---

## Phase 1 — Project Scaffold

```bash
npm create vite@latest flarehub-frontend -- --template react-ts
cd flarehub-frontend
```

Install all dependencies:

```bash
npm install react-router-dom @tanstack/react-query @tanstack/react-query-devtools
npm install zustand axios
npm install react-hook-form @hookform/resolvers zod
npm install @supabase/supabase-js
npm install @phosphor-icons/react
npm install framer-motion
npm install recharts
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
npm install @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-checkbox
npm install @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-separator
npm install clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

---

## Phase 2 — Design System Setup

### tailwind.config.ts

Configure with the exact colors, fonts, spacing, border radius, and shadows from FRONTEND_PLAN.md. Extend the default theme — do not replace it.

Load fonts via Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### globals.css

Set CSS custom properties for all design tokens. Set `font-family: 'Inter'` on body. Set `font-family: 'Bricolage Grotesque'` on h1, h2 specifically. Never use Bricolage on anything below h2.

---

## Phase 3 — Core Infrastructure

Implement in this exact order:

1. `src/lib/supabase.ts` — Supabase client with anon key
2. `src/lib/api.ts` — Axios instance, JWT interceptor, 401 refresh + retry
3. `src/lib/queryClient.ts` — TanStack Query client (staleTime 30s, retry 1)
4. `src/lib/ws.ts` — WebSocket singleton, auto-reconnect, event emitter
5. `src/store/auth.store.ts` — Zustand: user, session, role, isMentor, isLoading
6. `src/store/ui.store.ts` — Zustand: sidebarOpen, toasts array, activeModal
7. `src/hooks/useAuth.ts` — wraps auth store, exposes login/logout/session
8. `src/hooks/useWebSocket.ts` — subscribe to WS events, invalidate queries
9. `src/hooks/useNotifications.ts` — unread count, mark read
10. `src/types/api.ts` — TypeScript types for every API response shape

---

## Phase 4 — UI Component Library

Build all components in `src/components/ui/`. Each component must:
- Accept `className` prop for extension
- Be fully typed with TypeScript
- Use the design tokens from tailwind config — never hardcode colors
- Be keyboard accessible
- Use Phosphor icons where icons are needed (never any other icon library)

Build in this order:
1. Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
2. Input (with label, error, helper text slots)
3. Textarea
4. Select (built on Radix Select)
5. Checkbox
6. Badge (variants: default, approved, pending, rejected, review, mentor, admin)
7. Avatar (with fallback initials, sizes: sm, md, lg)
8. Card (with optional header, footer, padding variants)
9. Modal (built on Radix Dialog, sizes: sm, md, lg)
10. Drawer (slides from right, for detail panels)
11. Tabs (built on Radix Tabs)
12. Tooltip (built on Radix Tooltip)
13. Dropdown (built on Radix DropdownMenu)
14. Toast (bottom-right stack, auto-dismiss, 4 types)
15. Skeleton (shimmer animation, matches component shapes)
16. Spinner (small, used for inline loading only)
17. Progress (horizontal bar, percentage)
18. Table (with sticky header, hover states, selection)
19. Pagination
20. EmptyState (icon + heading + body + optional action)
21. ErrorState (for failed fetches)
22. Separator

---

## Phase 5 — Layout Components

1. `AppShell.tsx` — root wrapper, renders sidebar + topbar + outlet
2. `Sidebar.tsx` — role-based nav (entrepreneur / mentor / admin), collapsible on tablet
3. `TopBar.tsx` — page context, notifications bell with badge, user avatar + dropdown
4. `MobileNav.tsx` — bottom navigation for mobile (5 key links per role)
5. `PageHeader.tsx` — consistent page title + subtitle + right-side actions slot

---

## Phase 6 — Auth Pages

- `LoginPage.tsx` — email + password, Supabase signIn, redirect logic
- `SignupPage.tsx` — email + password + name, Supabase signUp
- `ProtectedRoute.tsx` — checks session, role-gates pages
- `AuthCallbackPage.tsx` — handles redirect after OAuth

The auth pages must NOT use the AppShell layout. They are full-page centered layouts with the Flarehub wordmark at top, the form centered, and a subtle background.

---

## Phase 7 — Onboarding

`OnboardingPage.tsx` — 2-step form for new users.

Step indicator at top (2 dots). Step 1: personal info. Step 2: business info. On completion, calls `PATCH /users/me`. The backend sets `profileComplete: true` automatically. Redirect to dashboard.

This page must feel welcoming — not clinical. Use the terracotta accent on the step indicator and primary button. Short, encouraging copy above each step.

---

## Phase 8 — API Layer

Build all files in `src/api/`. Each file exports:
- Query hook functions (using `useQuery` / `useSuspenseQuery`)
- Mutation functions (using `useMutation`)
- The raw API function (for use outside React)

Every mutation that changes data must:
- Invalidate the relevant query cache keys on success
- Show a toast on success and on error
- Use optimistic updates where the response is predictable

---

## Phase 9 — Feature Pages

Build pages in this order:

### Entrepreneur
1. DashboardPage
2. ProgramsPage + ProgramDetailPage
3. MyApplicationsPage
4. SmartGoalsPage
5. MilestonePlanPage
6. MarketResearchPage
7. EvidencePage
8. DocumentsPage
9. TemplatesPage
10. BusinessPlanPage
11. MessagesPage (full real-time WebSocket messaging)
12. NotificationsPage
13. ProfilePage (with activity feed)

### Mentor
14. MentorDashboardPage
15. MenteesPage + MenteeDetailPage
16. MeetingsPage

### Admin
17. AdminDashboardPage
18. UsersPage + UserDetailPage
19. ApplicationsPage (with bulk actions)
20. EvidenceReviewPage
21. SubmissionsPage
22. MentorManagementPage
23. AnalyticsPage (all 5 charts)
24. AnnouncementsPage
25. ActivityLogPage
26. SettingsPage

---

## Phase 10 — Final Polish

1. Add route-based code splitting (`React.lazy`) on every page
2. Add skeleton loaders to every data-fetching page
3. Add proper empty states to every list/table
4. Add error boundaries on every route
5. Verify keyboard navigation on all modals and dropdowns
6. Test the complete upload flow for evidence, documents, templates
7. Test WebSocket reconnection (disconnect network, reconnect)
8. Verify role-based routing (entrepreneur cannot access /admin, etc.)

---

## Quality Standards — Non-Negotiable

| Standard | Requirement |
|---|---|
| Icons | Phosphor only. No other icon library. |
| Copy | No em dashes. No "Welcome back". No "Submit" buttons. Action-specific labels only. |
| Colors | Use design tokens only. Never hardcode hex values in components. |
| Fonts | Bricolage only on h1/h2. Inter everywhere else. Never mix. |
| Gradients | Zero gradients anywhere. |
| Loading | Skeleton loaders, not spinners, for page-level loading. |
| Errors | Field-level errors below inputs. Never alert boxes at top of form. |
| Empty states | Every list/table has one. Never "No data found". |
| Accessibility | Every interactive element keyboard reachable. |
| TypeScript | Strict mode. No `any`. All API responses typed. |

---

## What NOT to Do

- Do not use Material UI, Ant Design, Chakra, or any full component library
- Do not use Heroicons, Lucide, or any icon library other than Phosphor
- Do not use gradients
- Do not use the colors purple, teal, or cyan as primary or accent
- Do not write "Welcome back" anywhere in the UI
- Do not use em dashes in any UI copy
- Do not use "Submit" as a button label — ever
- Do not add animations that feel like a portfolio site (no scroll reveals, no dramatic entrances)
- Do not add a dark mode (not in scope)
- Do not use `any` in TypeScript
- Do not put business logic in components — keep it in hooks and api files

---

## Completion Criteria

The frontend is complete when:

- [ ] `npm run build` compiles with zero errors
- [ ] All 3 role-based dashboards load and display real data
- [ ] Login / signup / onboarding flow works end-to-end
- [ ] File upload works (evidence, documents, profile picture)
- [ ] Real-time messaging works via WebSocket
- [ ] Notifications update in real-time
- [ ] All admin tables have working filters, search, and pagination
- [ ] All 5 analytics charts display real data
- [ ] PDF report downloads work
- [ ] All empty states, error states, and loading states are implemented
- [ ] The app works on mobile (375px) and desktop (1440px)
