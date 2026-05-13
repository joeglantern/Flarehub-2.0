import { useEffect, useRef } from 'react'
import axios from 'axios'
import { supabase, primeToken } from '@/lib/supabase'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/ws'
import { registerServiceWorker } from '@/lib/push'
import { useAuthStore, writeUserCache } from '@/store/auth.store'
import type { User } from '@/types/api'

export function useAuth() {
  const { user, session, isLoading, clear } = useAuthStore()

  /**
   * Sign in and immediately prime the token cache so any subsequent
   * API calls in the same tick have a valid Authorization header.
   */
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session?.access_token) primeToken(data.session.access_token)
    return data
  }

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.session?.access_token) primeToken(data.session.access_token)
    return data
  }

  const logout = async () => {
    wsClient.disconnect()
    writeUserCache(null)
    clear()                        // clear state + set isLoading=false immediately
    await supabase.auth.signOut()  // fire SIGNED_OUT event (token cleared by onAuthStateChange)
  }

  return { user, session, isLoading, login, signup, logout }
}

export function useAuthInit() {
  const { setUser, setSession, setLoading } = useAuthStore()
  // Prevent duplicate sync-user calls when SIGNED_IN fires while
  // LoginPage is already handling sync (e.g. right after login).
  const syncingRef = useRef(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      // ── Session present (initial load or token refresh) ─────────────────
      if ((event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) {
        if (syncingRef.current) return   // LoginPage is already handling this
        syncingRef.current = true
        try {
          const res = await api.post<{ success: true; data: User & { isNewUser: boolean } }>('/auth/sync-user')
          const user = res.data.data
          setUser(user)
          writeUserCache(user)    // persist so next load skips the spinner
          // Only open a new WS connection on initial load or explicit sign-in.
          // TOKEN_REFRESHED leaves the existing connection alive — the backend
          // only verifies the token at connect time, so the session remains valid.
          if (event !== 'TOKEN_REFRESHED') wsClient.connect()
          registerServiceWorker()
        } catch (err) {
          // Only clear on auth failure — network errors should keep cached user
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            writeUserCache(null)
            setUser(null)
          }
        } finally {
          setLoading(false)
          syncingRef.current = false
        }
        return
      }

      // ── No session ────────────────────────────────────────────────────────
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        writeUserCache(null)
        setUser(null)
        wsClient.disconnect()
      }

      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setSession, setLoading])
}
