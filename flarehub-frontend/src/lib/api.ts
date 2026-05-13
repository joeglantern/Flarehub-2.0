import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { supabase, getCurrentToken } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach JWT synchronously from cached token — no getSession() call, no deadlock
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCurrentToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 — refresh session once and retry
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { data } = await supabase.auth.refreshSession()
      const token = data.session?.access_token
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export type ApiError = {
  success: false
  error: { code: string; message: string; details?: unknown }
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined
    return data?.error?.message ?? error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
