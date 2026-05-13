import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import type { User } from '@/types/api'

export default function AuthCallbackPage() {
  const navigate    = useNavigate()
  const { setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate('/login')
        return
      }
      try {
        const res = await api.post<{ success: true; data: User & { isNewUser: boolean } }>('/auth/sync-user')
        const user = res.data.data
        setUser(user)

        if (!user.profileComplete) {
          navigate('/onboarding')
        } else if (user.role === 'admin' || user.role === 'super_admin') {
          navigate('/admin')
        } else if (user.isMentor) {
          navigate('/mentor')
        } else {
          navigate('/dashboard')
        }
      } catch {
        navigate('/login')
      }
    })
  }, [navigate, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <Spinner size="lg" className="text-[var(--color-green-500)]" />
    </div>
  )
}
