import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import type { UserRole } from '@/types/api'

interface ProtectedRouteProps {
  roles?: UserRole[]
  requireMentor?: boolean
}

export function ProtectedRoute({ roles, requireMentor }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <Spinner size="lg" className="text-[var(--color-green-500)]" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!user.profileComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (requireMentor && !user.isMentor) {
    return <Navigate to="/dashboard" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
