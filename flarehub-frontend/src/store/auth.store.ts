import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types/api'

const CACHE_KEY = 'fh:user'

function readCached(): User | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch { return null }
}

export function writeUserCache(user: User | null): void {
  try {
    if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user))
    else localStorage.removeItem(CACHE_KEY)
  } catch { /* storage full or blocked — non-fatal */ }
}

const _cached = readCached()

interface AuthState {
  user:      User | null
  session:   Session | null
  isLoading: boolean
  setUser:    (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  clear:      () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // If we have a cached user, skip the full-page spinner — sync-user runs in background
  user:      _cached,
  session:   null,
  isLoading: _cached === null,

  setUser:    (user)      => set({ user }),
  setSession: (session)   => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, session: null, isLoading: false }),
}))

export const getRole = (): UserRole | null => useAuthStore.getState().user?.role ?? null
export const getIsMentor = (): boolean => useAuthStore.getState().user?.isMentor ?? false
