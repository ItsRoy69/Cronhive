'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Bell, KeyRound, LogOut, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'

const NAV_SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { href: '/',       label: 'Jobs',   icon: LayoutDashboard },
      { href: '/alerts', label: 'Alerts', icon: Bell            },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/cron-editor', label: 'Cron Editor', icon: Terminal },
      { href: '/keys',        label: 'API Keys',    icon: KeyRound },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🐝</span>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">CronHive</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Scheduler</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-white/5'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-amber-500" />
                    )}
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="px-2 mb-1">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-amber-500" />
            </span>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <span className="text-[11px] text-muted-foreground">v0.1.0</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-white/5 transition-colors w-full"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
