import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnon)

// Synchronous token cache — persisted to localStorage so it survives page
// refreshes and is available before the async onAuthStateChange fires.
const TOKEN_KEY = 'fh:token'

let _currentToken: string | null = (() => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
})()

supabase.auth.onAuthStateChange((_event, session) => {
  _currentToken = session?.access_token ?? null
  try {
    if (_currentToken) localStorage.setItem(TOKEN_KEY, _currentToken)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* storage blocked — non-fatal */ }
})

export function getCurrentToken(): string | null {
  return _currentToken
}

/**
 * Call immediately after signInWithPassword / signUp so the token is cached
 * before any synchronous code that follows tries to use it.
 * onAuthStateChange fires asynchronously and would otherwise be too late.
 */
export function primeToken(token: string): void {
  _currentToken = token
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* non-fatal */ }
}
