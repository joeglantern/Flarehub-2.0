import { NavLink, useNavigate } from 'react-router-dom'
import {
  House, Binoculars, FileText, Target, Stairs, ChartBar,
  Camera, FolderOpen, DownloadSimple, Briefcase,
  ChatCircle, Bell, UsersThree, CalendarBlank,
  ChartPieSlice, ClipboardText, SealCheck, UsersFour,
  TrendUp, MegaphoneSimple, ClockCounterClockwise, Gear, SignOut,
  Flame, X, Plus, FilePdf, Link, HandHeart,
} from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { useUiStore } from '@/store/ui.store'
import { api } from '@/lib/api'
import type { ApiPaginated, Notification } from '@/types/api'

interface NavItem {
  to:     string
  icon:   typeof House
  label:  string
  badge?: number
  tag?:   string
  dot?:   boolean
  end?:   boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

function entrepreneurGroups(unreadNotifs: number): NavGroup[] {
  return [
    {
      group: 'Workspace',
      items: [
        { to: '/dashboard',    icon: House,      label: 'Overview',     end: true },
        { to: '/programs',     icon: Binoculars, label: 'Programs' },
        { to: '/applications', icon: FileText,   label: 'Applications' },
      ],
    },
    {
      group: 'Build',
      items: [
        { to: '/submissions/smart-goals',     icon: Target,         label: 'Smart Goals' },
        { to: '/submissions/milestones',      icon: Stairs,         label: 'Milestone Plan' },
        { to: '/submissions/market-research', icon: ChartBar,       label: 'Market Research' },
        { to: '/evidence',                    icon: Camera,         label: 'Evidence' },
        { to: '/documents',                   icon: FolderOpen,     label: 'Documents' },
        { to: '/templates',                   icon: DownloadSimple, label: 'Templates' },
        { to: '/business-plan',               icon: Briefcase,      label: 'Business Plan' },
      ],
    },
    {
      group: 'Connect',
      items: [
        { to: '/messages',                    icon: ChatCircle,      label: 'Messages' },
        { to: '/mentorship/applications',     icon: HandHeart,       label: 'Mentorship' },
        { to: '/notifications',               icon: Bell,            label: 'Notifications',  badge: unreadNotifs || undefined },
        { to: '/announcements',               icon: MegaphoneSimple, label: 'Announcements' },
      ],
    },
  ]
}

function mentorGroups(unreadNotifs: number): NavGroup[] {
  return [
    {
      group: 'Workspace',
      items: [
        { to: '/mentor',          icon: House,         label: 'Dashboard', end: true },
        { to: '/mentor/mentees',  icon: UsersThree,    label: 'My Mentees' },
        { to: '/mentor/meetings', icon: CalendarBlank, label: 'Meetings' },
      ],
    },
    {
      group: 'Connect',
      items: [
        { to: '/mentor/messages',       icon: ChatCircle,      label: 'Messages' },
        { to: '/mentor/invite-links',   icon: Link,            label: 'Invite Links' },
        { to: '/mentor/applications',   icon: HandHeart,       label: 'Applications' },
        { to: '/notifications',         icon: Bell,            label: 'Notifications', badge: unreadNotifs || undefined },
        { to: '/announcements',         icon: MegaphoneSimple, label: 'Announcements' },
      ],
    },
  ]
}

function adminGroups(): NavGroup[] {
  return [
    {
      group: 'Admin',
      items: [
        { to: '/admin',              icon: ChartPieSlice,   label: 'Dashboard', end: true },
        { to: '/admin/users',        icon: UsersThree,      label: 'Users' },
        { to: '/admin/programs',     icon: Binoculars,      label: 'Programs' },
        { to: '/admin/applications', icon: ClipboardText,   label: 'Applications' },
        { to: '/admin/evidence',     icon: SealCheck,       label: 'Evidence Review' },
        { to: '/admin/submissions',  icon: FileText,        label: 'Submissions' },
        { to: '/admin/mentors',      icon: UsersFour,       label: 'Mentor Management' },
        { to: '/admin/documents',    icon: FolderOpen,      label: 'Documents' },
      ],
    },
    {
      group: 'Reports',
      items: [
        { to: '/admin/analytics',     icon: TrendUp,               label: 'Analytics' },
        { to: '/admin/reports',       icon: FilePdf,               label: 'Reports' },
        { to: '/admin/announcements', icon: MegaphoneSimple,       label: 'Announcements' },
        { to: '/admin/activity-log',  icon: ClockCounterClockwise, label: 'Activity Log' },
        { to: '/admin/settings',      icon: Gear,                  label: 'Settings' },
      ],
    },
  ]
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all',
          isActive
            ? 'bg-[var(--color-ink)] text-white shadow-sm'
            : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-elev)] hover:text-[var(--color-ink)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-1 top-2 bottom-2 w-1 bg-[var(--color-terra-500)] rounded-full" />
          )}
          <Icon size={17} weight={isActive ? 'bold' : 'regular'} className="shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.tag && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-terra-50)] text-[var(--color-terra-600)]">
              {item.tag}
            </span>
          )}
          {item.badge ? (
            <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-[var(--color-terra-500)] text-white">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          ) : null}
          {item.dot && (
            <span className="relative inline-flex w-2 h-2">
              <span className="live w-2 h-2 rounded-full bg-emerald-500 absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarInner({ onClose, mobile }: { onClose?: () => void; mobile?: boolean }) {
  const { user }   = useAuthStore()
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const { data: unreadNotifsData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn:  () =>
      api.get<ApiPaginated<Notification>>('/notifications/me', { params: { isRead: false, limit: 1 } })
        .then(r => r.data.meta.total),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const unreadNotifs = unreadNotifsData ?? 0

  if (!user) return null

  const role    = user.isMentor ? 'mentor' : user.role
  const groups  =
    role === 'mentor'                          ? mentorGroups(unreadNotifs) :
    role === 'admin' || role === 'super_admin' ? adminGroups() :
    entrepreneurGroups(unreadNotifs)

  const isEntrepreneur = role !== 'mentor' && role !== 'admin' && role !== 'super_admin'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-2xl bg-[var(--color-ink)] flex items-center justify-center shadow-sm shrink-0">
            <Flame size={18} weight="fill" className="text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--color-terra-500)] rounded-full ring-2 ring-white" />
          </div>
          <span
            className="font-semibold text-[18px] tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Flarehub
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-elev)] text-[var(--color-ink-mute)]">
            v3
          </span>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 min-h-0">
        {groups.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--color-ink-faint)] font-semibold">
              {g.group}
            </div>
            <div className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <NavItemLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}

        {isEntrepreneur && (
          <button
            onClick={() => { navigate('/programs'); onClose?.() }}
            className="w-full mt-2 group flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[var(--color-terra-500)]/40 bg-[var(--color-terra-50)]/50 hover:bg-[var(--color-terra-50)] transition"
          >
            <span className="w-8 h-8 rounded-xl bg-[var(--color-terra-500)] text-white flex items-center justify-center group-hover:rotate-12 transition shrink-0">
              <Plus size={16} weight="bold" />
            </span>
            <span className="text-left">
              <div className="text-[13px] font-semibold text-[var(--color-ink)]">Apply to a program</div>
              <div className="text-[11px] text-[var(--color-ink-mute)]">Open programs this month</div>
            </span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-line)] shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-elev)] transition cursor-pointer"
          onClick={() => { navigate('/profile'); onClose?.() }}>
          <Avatar
            src={user.profilePic}
            firstName={user.firstName}
            lastName={user.lastName}
            size={36}
            online
          />
          <div className="flex-1 text-left min-w-0">
            <div className="text-[13px] font-semibold text-[var(--color-ink)] leading-tight truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[11px] text-[var(--color-ink-mute)] leading-tight truncate">{user.email}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout() }}
            className="p-1.5 text-[var(--color-ink-mute)] hover:text-[var(--color-error)] transition rounded-lg"
            aria-label="Sign out"
          >
            <SignOut size={15} />
          </button>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col shrink-0 w-[252px] h-screen sticky top-0 bg-[var(--color-paper)]/80 backdrop-blur-xl border-r border-[var(--color-line)]">
        <SidebarInner />
      </aside>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-[var(--color-paper)] shadow-2xl lg:hidden transition-transform duration-200',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarInner mobile onClose={() => setMobileNavOpen(false)} />
      </aside>
    </>
  )
}
