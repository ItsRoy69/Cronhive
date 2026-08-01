'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Heart, Plus, Search, X, CheckCircle2, XCircle,
  AlertTriangle, Clock, Pause, Copy,
} from 'lucide-react'

type HeartbeatStatus = 'healthy' | 'late' | 'down' | 'paused' | 'new'

type Heartbeat = {
  id: string
  name: string
  slug: string
  schedule: string
  grace_minutes: number
  status: HeartbeatStatus
  last_ping_at: string | null
  next_expected_at: string | null
  total_pings_24h: number
  ping_history: { time: string; ok: boolean }[]
}

const DEMO_HEARTBEATS: Heartbeat[] = [
  {
    id: '1', name: 'Database Backup', slug: 'db-backup', schedule: '0 2 * * *', grace_minutes: 15,
    status: 'healthy', last_ping_at: new Date(Date.now() - 3600000).toISOString(),
    next_expected_at: new Date(Date.now() + 72000000).toISOString(), total_pings_24h: 1,
    ping_history: Array.from({ length: 7 }, () => ({ time: '', ok: true })),
  },
  {
    id: '2', name: 'Email Queue Worker', slug: 'email-queue', schedule: '*/5 * * * *', grace_minutes: 2,
    status: 'healthy', last_ping_at: new Date(Date.now() - 180000).toISOString(),
    next_expected_at: new Date(Date.now() + 120000).toISOString(), total_pings_24h: 288,
    ping_history: Array.from({ length: 24 }, () => ({ time: '', ok: true })),
  },
  {
    id: '3', name: 'Report Generator', slug: 'reports', schedule: '0 9 * * 1-5', grace_minutes: 30,
    status: 'late', last_ping_at: new Date(Date.now() - 86400000).toISOString(),
    next_expected_at: new Date(Date.now() - 1800000).toISOString(), total_pings_24h: 0,
    ping_history: Array.from({ length: 7 }, (_, i) => ({ time: '', ok: i < 5 })),
  },
  {
    id: '4', name: 'SSL Renewal Check', slug: 'ssl-renew', schedule: '0 0 * * *', grace_minutes: 60,
    status: 'down', last_ping_at: new Date(Date.now() - 259200000).toISOString(),
    next_expected_at: new Date(Date.now() - 172800000).toISOString(), total_pings_24h: 0,
    ping_history: Array.from({ length: 7 }, (_, i) => ({ time: '', ok: i < 4 })),
  },
  {
    id: '5', name: 'Cache Warmer', slug: 'cache-warm', schedule: '*/10 * * * *', grace_minutes: 5,
    status: 'paused', last_ping_at: null, next_expected_at: null, total_pings_24h: 0,
    ping_history: Array.from({ length: 7 }, () => ({ time: '', ok: true })),
  },
]

function StatusBadge({ status }: { status: HeartbeatStatus }) {
  const config: Record<HeartbeatStatus, { label: string; icon: React.ElementType; className: string }> = {
    healthy: { label: 'Healthy', icon: CheckCircle2, className: 'bg-green-50 text-green-700' },
    late: { label: 'Late', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700' },
    down: { label: 'Down', icon: XCircle, className: 'bg-red-50 text-red-700' },
    paused: { label: 'Paused', icon: Pause, className: 'bg-gray-100 text-gray-600' },
    new: { label: 'New', icon: Clock, className: 'bg-indigo-50 text-indigo-700' },
  }
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', c.className)}>
      <c.icon className="size-3.5" />
      {c.label}
    </span>
  )
}

function PingDots({ history }: { history: Heartbeat['ping_history'] }) {
  return (
    <div className="flex items-center gap-1">
      {history.map((h, i) => (
        <span
          key={i}
          className={cn('size-3 rounded-full', h.ok ? 'bg-green-400' : 'bg-red-400')}
        />
      ))}
    </div>
  )
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function HeartbeatsPage() {
  const [heartbeats] = useState<Heartbeat[]>(DEMO_HEARTBEATS)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = heartbeats.filter(h => {
    if (!search) return true
    const q = search.toLowerCase()
    return h.name.toLowerCase().includes(q) || h.slug.toLowerCase().includes(q)
  })

  const healthy = heartbeats.filter(h => h.status === 'healthy').length
  const unhealthy = heartbeats.filter(h => h.status === 'down' || h.status === 'late').length

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Heartbeats</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dead man&apos;s switch monitoring for background processes</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          New Heartbeat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Heartbeats</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{heartbeats.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Heart className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Healthy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{healthy}</p>
              </div>
              <div className="size-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{unhealthy}</p>
              </div>
              <div className="size-10 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertTriangle className="size-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How heartbeats work</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your services send a periodic HTTP ping to a unique URL. If a ping doesn&apos;t arrive within the expected schedule + grace time, CronHive sends an alert. Perfect for monitoring cron jobs, background workers, queue consumers, and any process that should run on a regular cadence.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="text-xs bg-gray-50 border border-gray-100 rounded-md px-3 py-1.5 text-gray-600 font-mono">
              curl https://hb.cronhive.io/your-slug
            </code>
            <button className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Copy">
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Heartbeats list */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Heartbeats</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <input
                className="pl-9 pr-8 h-8 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56 placeholder:text-gray-400"
                placeholder="Search heartbeats..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Schedule</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Last Ping</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Pings (24h)</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Heart className="size-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No heartbeats found</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map(hb => (
                  <tr key={hb.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{hb.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">/{hb.slug}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={hb.status} />
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-xs bg-gray-50 px-2 py-1 rounded-md font-mono text-gray-600 border border-gray-100">
                        {hb.schedule}
                      </code>
                      <p className="text-[10px] text-gray-400 mt-0.5">Grace: {hb.grace_minutes}m</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {timeAgo(hb.last_ping_at)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                      {hb.total_pings_24h}
                    </td>
                    <td className="px-5 py-4">
                      <PingDots history={hb.ping_history} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create dialog placeholder */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">New Heartbeat</h2>
              <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Database Backup" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Slug</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="db-backup" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Schedule (cron)</label>
                  <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="0 2 * * *" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Grace Time (min)</label>
                  <input type="number" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="15" defaultValue={15} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
              <button className="px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm">Create Heartbeat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
