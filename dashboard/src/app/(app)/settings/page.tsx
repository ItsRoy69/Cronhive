'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'
import {
  User, Bell, Shield, Clock,
  Copy, Check, ChevronRight,
} from 'lucide-react'

type Section = 'profile' | 'notifications' | 'security' | 'timezone'

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'timezone',      label: 'Timezone',       icon: Clock },
  { id: 'security',      label: 'Security',       icon: Shield },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [active, setActive] = useState<Section>('profile')
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cronhive_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    return 'UTC'
  })
  const [saved, setSaved] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const [notifications, setNotifications] = useState({
    emailOnFailure: true,
    emailOnRecovery: false,
    slackOnFailure: true,
    slackOnDead: true,
    weeklyDigest: false,
  })

  const tenantId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('cronhive_user') || '{}').tenant_id || '—'
    : '—'

  const handleSaveTimezone = () => {
    localStorage.setItem('cronhive_timezone', timezone)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopyTenantId = () => {
    if (tenantId !== '—') {
      navigator.clipboard.writeText(tenantId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="flex gap-6 max-w-4xl">
          {/* Sidebar nav */}
          <nav className="w-48 shrink-0 space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  active === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <s.icon className={cn('size-4 shrink-0', active === s.id ? 'text-indigo-600' : 'text-gray-400')} />
                {s.label}
                <ChevronRight className={cn('size-3 ml-auto', active === s.id ? 'text-indigo-400' : 'text-gray-300')} />
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="flex-1 space-y-6">
            {active === 'profile' && (
              <>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Name</label>
                      <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                        {user.name || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Email</label>
                      <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                        {user.email || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Tenant ID</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 font-mono truncate">
                          {tenantId}
                        </div>
                        <button
                          onClick={handleCopyTenantId}
                          className="shrink-0 p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                        >
                          {copiedId ? <Check className="size-4 text-green-500" /> : <Copy className="size-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {active === 'notifications' && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-3">
                  {([
                    { key: 'emailOnFailure' as const,   label: 'Email on job failure',   desc: 'Get an email when a job fails' },
                    { key: 'emailOnRecovery' as const,  label: 'Email on recovery',      desc: 'Get an email when a failed job recovers' },
                    { key: 'slackOnFailure' as const,   label: 'Slack on failure',        desc: 'Post to Slack when a job fails' },
                    { key: 'slackOnDead' as const,      label: 'Slack on dead runs',      desc: 'Post to Slack when a run is marked dead' },
                    { key: 'weeklyDigest' as const,     label: 'Weekly digest',           desc: 'Receive a weekly summary email' },
                  ]).map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div
                        role="switch"
                        aria-checked={notifications[item.key]}
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={cn(
                          'relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer',
                          notifications[item.key] ? 'bg-indigo-600' : 'bg-gray-200'
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
                          notifications[item.key] && 'translate-x-4'
                        )} />
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Per-job alert channels are configured on the Issues &amp; Alerts page.
                </p>
              </div>
            )}

            {active === 'timezone' && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Default Timezone</h2>
                <p className="text-xs text-gray-400 mb-4">Used for displaying timestamps and scheduling cron jobs</p>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <div className="mt-4">
                  <button
                    onClick={handleSaveTimezone}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {saved ? <><Check className="size-4" /> Saved</> : 'Save Timezone'}
                  </button>
                </div>
              </div>
            )}

            {active === 'security' && (
              <>
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">API Keys</h2>
                  <p className="text-xs text-gray-400 mb-4">Manage your API keys for programmatic access</p>
                  <a
                    href="/keys"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Manage API Keys
                    <ChevronRight className="size-3.5" />
                  </a>
                </div>

                <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
                  <p className="text-xs text-gray-400 mb-4">Permanently delete your account and all associated data</p>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
