import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id:      string
  type:    ToastType
  title:   string
  message?: string
}

interface UiState {
  sidebarOpen:     boolean
  mobileNavOpen:   boolean
  toasts:          Toast[]
  setSidebar:      (open: boolean) => void
  toggleSidebar:   () => void
  setMobileNavOpen:(open: boolean) => void
  addToast:        (toast: Omit<Toast, 'id'>) => void
  removeToast:     (id: string) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen:   true,
  mobileNavOpen: false,
  toasts:        [],

  setSidebar:       (open) => set({ sidebarOpen: open }),
  toggleSidebar:    ()    => set({ sidebarOpen: !get().sidebarOpen }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), 4000)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (title: string, message?: string) =>
    useUiStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useUiStore.getState().addToast({ type: 'error', title, message }),
  info: (title: string, message?: string) =>
    useUiStore.getState().addToast({ type: 'info', title, message }),
  warning: (title: string, message?: string) =>
    useUiStore.getState().addToast({ type: 'warning', title, message }),
}
