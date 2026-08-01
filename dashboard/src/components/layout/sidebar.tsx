'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Briefcase, CheckSquare2, HeartPulse, Globe2,
  AlertCircle, Clock, MonitorCheck, Wrench,
  Rocket, Settings, BookOpen, HelpCircle, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'

const PRIMARY_NAV = [
  { href: '/dashboard',      label: 'Home',       icon: Home },
  { href: '/dashboard',      label: 'Jobs',       icon: Briefcase },
  { href: '/checks',     label: 'Checks',     icon: CheckSquare2 },
  { href: '/heartbeats', label: 'Heartbeats', icon: HeartPulse },
  { href: '/sites',      label: 'Sites',      icon: Globe2 },
]

const SECONDARY_NAV = [
  { href: '/alerts',        label: 'Issues',       icon: AlertCircle },
  { href: '/timeline',      label: 'Timeline',     icon: Clock },
  { href: '/status-pages',  label: 'Status Pages', icon: MonitorCheck },
  { href: '/maintenance',   label: 'Maintenance',  icon: Wrench },
]

const BOTTOM_NAV = [
  { href: '/cron-editor', label: 'Get Started', icon: Rocket },
  { href: '/settings',    label: 'Settings',    icon: Settings },
  { href: '/keys',        label: 'Docs',        icon: BookOpen },
  { href: '/help',        label: 'Help',        icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = (user.name as string)
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === '/') return pathname === '/'
    if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/jobs')
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navHref = (href: string) => href

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = isActive(href)
    return (
      <Link
        href={navHref(href)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
          active
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        )}
      >
        <Icon className={cn('size-4 shrink-0', active ? 'text-indigo-600' : 'text-gray-400')} />
        {label}
        {label === 'Issues' && (
          <span className="ml-auto size-1.5 rounded-full bg-red-400 shrink-0" />
        )}
      </Link>
    )
  }

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white leading-none">C</span>
          </div>
          <p className="text-sm font-bold text-gray-900">CronHive</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>

        <div className="my-3 border-t border-gray-100" />

        <div className="space-y-0.5">
          {SECONDARY_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="space-y-0.5 mb-3">
          {BOTTOM_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full mb-2"
          >
            <LogOut className="size-4 shrink-0 text-gray-400" />
            Sign out
          </button>
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="size-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-600">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
