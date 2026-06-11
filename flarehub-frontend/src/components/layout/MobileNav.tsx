import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  House, Binoculars, Camera, ChatCircle, Bell,
  ChartPieSlice, UsersThree, ClipboardText,
} from '@phosphor-icons/react'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApiPaginated, Notification } from '@/types/api'

export function MobileNav() {
  const { user } = useAuthStore()

  const { data: unreadNotifCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn:  () => api.get<ApiPaginated<Notification>>('/notifications/me', { params: { isRead: false, limit: 1 } }).then(r => r.data.meta.total),
    enabled:  !!user,
    refetchInterval: 30_000,
  })

  if (!user) return null

  const unreadNotifs = unreadNotifCount ?? 0

  const role    = user.isMentor ? 'mentor' : user.role
  const isAdmin  = role === 'admin' || role === 'super_admin'
  const isMentor = role === 'mentor'

  const links = isAdmin
    ? [
        { to: '/admin',              icon: ChartPieSlice, label: 'Dashboard' },
        { to: '/admin/users',        icon: UsersThree,    label: 'Users' },
        { to: '/admin/applications', icon: ClipboardText, label: 'Apps' },
      ]
    : isMentor
    ? [
        { to: '/mentor',          icon: House,      label: 'Home',     badge: 0 },
        { to: '/mentor/mentees',  icon: UsersThree, label: 'Mentees',  badge: 0 },
        { to: '/mentor/messages', icon: ChatCircle, label: 'Messages', badge: 0 },
        { to: '/notifications',   icon: Bell,       label: 'Alerts',   badge: unreadNotifs },
      ]
    : [
        { to: '/dashboard',     icon: House,      label: 'Home',     badge: 0 },
        { to: '/programs',      icon: Binoculars, label: 'Programs', badge: 0 },
        { to: '/evidence',      icon: Camera,     label: 'Evidence', badge: 0 },
        { to: '/messages',      icon: ChatCircle, label: 'Messages', badge: 0 },
        { to: '/notifications', icon: Bell,       label: 'Alerts',   badge: unreadNotifs },
      ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-paper)]/90 backdrop-blur-xl border-t border-[var(--color-line)] flex items-center z-20 safe-bottom">
      {links.map((link) => {
        const Icon = link.icon
        const badge = 'badge' in link ? link.badge : 0
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/mentor' || link.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 text-[10px] font-semibold font-mono uppercase tracking-wide transition-colors',
                isActive
                  ? 'text-[var(--color-ink)]'
                  : 'text-[var(--color-ink-mute)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'relative w-8 h-8 flex items-center justify-center rounded-2xl transition-colors',
                  isActive && 'bg-[var(--color-ink)]',
                )}>
                  <Icon
                    size={18}
                    weight={isActive ? 'fill' : 'regular'}
                    className={isActive ? 'text-white' : undefined}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full bg-[var(--color-terra-500)] text-white text-[8px] font-bold leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {link.label}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
