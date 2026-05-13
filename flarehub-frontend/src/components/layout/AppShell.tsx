import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { Spinner } from '@/components/ui/Spinner'
import { useWebSocket } from '@/hooks/useWebSocket'

// Routes that manage their own padding/max-width (redesigned entrepreneur pages)
const SELF_PADDED: string[] = [
  '/dashboard',
  '/programs',
  '/applications',
  '/submissions/smart-goals',
  '/submissions/milestones',
  '/submissions/market-research',
  '/messages',
  '/mentor/messages',
  '/evidence',
  '/documents',
  '/templates',
  '/business-plan',
  '/notifications',
  '/profile',
]

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="md" className="text-[var(--color-green-500)]" />
    </div>
  )
}

export function AppShell() {
  useWebSocket()
  const { pathname } = useLocation()
  const selfPadded = SELF_PADDED.some(r => pathname === r || pathname.startsWith(r + '/'))

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-paper)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {selfPadded ? (
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          ) : (
            <div className="p-5 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
