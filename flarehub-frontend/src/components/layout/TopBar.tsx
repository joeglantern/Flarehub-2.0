import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { List, Bell, CalendarBlank, MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { Avatar } from '@/components/ui/Avatar'
import { CommandPalette } from './CommandPalette'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiPaginated, Notification } from '@/types/api'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':                   'Overview',
  '/programs':                    'Programs',
  '/applications':                'My Applications',
  '/submissions/smart-goals':     'Smart Goals',
  '/submissions/milestones':      'Milestone Plan',
  '/submissions/market-research': 'Market Research',
  '/evidence':                    'Evidence',
  '/documents':                   'Documents',
  '/templates':                   'Templates',
  '/business-plan':               'Business Plan',
  '/messages':                    'Messages',
  '/notifications':               'Notifications',
  '/profile':                     'Profile',
  '/mentor':                      'Dashboard',
  '/mentor/mentees':              'My Mentees',
  '/mentor/meetings':             'Meetings',
  '/mentor/messages':             'Messages',
  '/admin':                       'Admin Dashboard',
  '/admin/users':                 'Users',
  '/admin/programs':              'Programs',
  '/admin/applications':          'Applications',
  '/admin/analytics':             'Analytics',
}

export function TopBar() {
  const { user } = useAuthStore()
  const { setMobileNavOpen } = useUiStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [commandOpen, setCommandOpen] = useState(false)

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn:  async () => {
      const res = await api.get<ApiPaginated<Notification>>('/notifications/me?isRead=false&limit=1')
      return res.data.meta.total
    },
    enabled: !!user,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!user) return null

  const pageLabel = Object.entries(PAGE_LABELS).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'Workspace'

  const role = user.isMentor ? 'mentor' : user.role
  const isEntrepreneur = role !== 'mentor' && role !== 'admin' && role !== 'super_admin'

  return (
    <>
      <header className="sticky top-0 z-30 bg-[var(--color-paper)]/85 backdrop-blur-xl border-b border-[var(--color-line)] shrink-0">
        <div className="flex items-center gap-3 px-4 lg:px-7 h-14">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--color-elev)] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition"
            aria-label="Open menu"
          >
            <List size={20} />
          </button>

          {/* Desktop breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-[12px] text-[var(--color-ink-mute)]">
            <span className="font-mono uppercase tracking-wider">Workspace</span>
            <span className="text-[var(--color-line)]">›</span>
            <span className="text-[var(--color-ink)] font-semibold">{pageLabel}</span>
          </div>

          {/* Command palette trigger */}
          <div className="flex-1 max-w-xl mx-auto">
            <button
              onClick={() => setCommandOpen(true)}
              className="group w-full flex items-center gap-2.5 h-10 px-3.5 rounded-2xl bg-[var(--color-elev)] hover:bg-[var(--color-inset)] border border-[var(--color-line)] text-left transition"
            >
              <MagnifyingGlass size={16} className="text-[var(--color-ink-mute)]" />
              <span className="text-[13px] text-[var(--color-ink-mute)] flex-1 truncate">
                Search programs, mentors, evidence…
              </span>
              <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[var(--color-ink-mute)]">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[var(--color-line)]">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[var(--color-line)]">K</kbd>
              </span>
            </button>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            {isEntrepreneur && (
              <button className="hidden lg:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-[13px] font-semibold text-[var(--color-forest-700)] bg-[var(--color-forest-50)] hover:bg-[var(--color-forest-100)] transition border border-[var(--color-forest-100)]">
                <Sparkle size={14} weight="fill" />
                Ask Sparkbot
              </button>
            )}

            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-xl hover:bg-[var(--color-elev)] flex items-center justify-center text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-terra-500)] ring-2 ring-[var(--color-paper)]" />
              )}
            </button>

            <button
              onClick={() => navigate('/submissions/milestones')}
              className="w-10 h-10 rounded-xl hover:bg-[var(--color-elev)] flex items-center justify-center text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition"
              aria-label="Milestones"
            >
              <CalendarBlank size={18} />
            </button>

            <div className="w-px h-6 bg-[var(--color-line)] mx-1" />

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[var(--color-elev)] transition"
            >
              <Avatar
                src={user.profilePic}
                firstName={user.firstName}
                lastName={user.lastName}
                size={30}
                online
              />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  )
}
