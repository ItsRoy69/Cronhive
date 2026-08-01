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
  { href: '/',           label: 'Home',       icon: Home },
  { href: '/__jobs',     label: 'Jobs',       icon: Briefcase },
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
    if (href === '/__jobs') return pathname === '/' || pathname.startsWith('/jobs')
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navHref = (href: string) => (href === '/__jobs' ? '/' : href)

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = isActive(href)
    return (
      <Link
        href={navHref(href)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
          active
            ? 'bg-white/10 text-white'
            : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-white/5'
        )}
      >
        <Icon className={cn('size-4 shrink-0', active ? 'text-white' : 'text-sidebar-foreground/40')} />
        {label}
        {label === 'Issues' && (
          <span className="ml-auto size-1.5 rounded-full bg-red-400 shrink-0" />
        )}
      </Link>
    )
  }

  return (
    <aside className="dark w-[210px] shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-black leading-none">C</span>
          </div>
          <p className="text-sm font-semibold text-white">CronHive</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>

        <div className="my-3 border-t border-white/8" />

        <div className="space-y-0.5">
          {SECONDARY_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/8">
        <div className="space-y-0.5 mb-3">
          {BOTTOM_NAV.map(item => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>

        <div className="border-t border-white/8 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-white/5 transition-colors w-full mb-2"
          >
            <LogOut className="size-4 shrink-0 text-sidebar-foreground/40" />
            Sign out
          </button>
          <div className="flex items-center gap-2.5 px-3 py-1">
            <div className="size-7 rounded-full bg-slate-600 flex items-center justify-center shrink-0 text-xs font-medium text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{user.name}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
