'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Globe, Plus, Search, X, ArrowUpRight, ArrowDownRight,
  Clock, Shield, CheckCircle2, XCircle, AlertTriangle,
  Pause, Play, RefreshCw,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type CheckStatus = 'up' | 'down' | 'degraded' | 'paused' | 'pending'

type Check = {
  id: string
  name: string
  url: string
  method: 'GET' | 'HEAD' | 'POST'
  frequency: number // seconds
  status: CheckStatus
  uptime_7d: number // percentage
  avg_response_ms: number
  last_checked_at: string | null
  ssl_expires_at: string | null
  regions: string[]
  response_history: { time: string; ms: number; ok: boolean }[]
}

// ─── Demo data (when backend is not connected) ───────────────────────────────

const DEMO_CHECKS: Check[] = [
  {
    id: '1', name: 'Production API', url: 'https://api.example.com/health',
    method: 'GET', frequency: 30, status: 'up', uptime_7d: 99.98, avg_response_ms: 142,
    last_checked_at: new Date(Date.now() - 25000).toISOString(),
    ssl_expires_at: '2026-11-15T00:00:00Z', regions: ['us-east', 'eu-west', 'ap-south'],
    response_history: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ms: 120 + Math.random() * 60, ok: Math.random() > 0.02,
    })),
  },
  {
    id: '2', name: 'Marketing Website', url: 'https://www.example.com',
    method: 'GET', frequency: 60, status: 'up', uptime_7d: 100, avg_response_ms: 320,
    last_checked_at: new Date(Date.now() - 45000).toISOString(),
    ssl_expires_at: '2027-03-20T00:00:00Z', regions: ['us-east', 'eu-west'],
    response_history: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ms: 280 + Math.random() * 100, ok: true,
    })),
  },
  {
    id: '3', name: 'Payment Gateway', url: 'https://payments.example.com/status',
    method: 'GET', frequency: 30, status: 'degraded', uptime_7d: 98.5, avg_response_ms: 890,
    last_checked_at: new Date(Date.now() - 30000).toISOString(),
    ssl_expires_at: '2026-09-01T00:00:00Z', regions: ['us-east', 'us-west', 'eu-west'],
    response_history: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ms: i > 18 ? 800 + Math.random() * 300 : 200 + Math.random() * 80, ok: i < 20 || Math.random() > 0.3,
    })),
  },
  {
    id: '4', name: 'Auth Service', url: 'https://auth.example.com/ping',
    method: 'HEAD', frequency: 30, status: 'down', uptime_7d: 95.2, avg_response_ms: 0,
    last_checked_at: new Date(Date.now() - 15000).toISOString(),
    ssl_expires_at: '2026-12-10T00:00:00Z', regions: ['us-east'],
    response_history: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ms: i < 20 ? 90 + Math.random() * 30 : 0, ok: i < 20,
    })),
  },
  {
    id: '5', name: 'CDN Assets', url: 'https://cdn.example.com/health',
    method: 'GET', frequency: 60, status: 'paused', uptime_7d: 99.9, avg_response_ms: 45,
    last_checked_at: null,
    ssl_expires_at: '2027-06-01T00:00:00Z', regions: ['us-east', 'eu-west', 'ap-south', 'ap-east'],
    response_history: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      ms: 30 + Math.random() * 30, ok: true,
    })),
  },
]

// ─── Components ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'up': return <CheckCircle2 className="size-4 text-green-500" />
    case 'down': return <XCircle className="size-4 text-red-500" />
    case 'degraded': return <AlertTriangle className="size-4 text-amber-500" />
    case 'paused': return <Pause className="size-4 text-gray-400" />
    case 'pending': return <Clock className="size-4 text-gray-400" />
  }
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const config = {
    up: { label: 'Up', bg: 'bg-green-50 text-green-700' },
    down: { label: 'Down', bg: 'bg-red-50 text-red-700' },
    degraded: { label: 'Degraded', bg: 'bg-amber-50 text-amber-700' },
    paused: { label: 'Paused', bg: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Pending', bg: 'bg-gray-100 text-gray-600' },
  }
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', c.bg)}>
      <StatusIcon status={status} />
      {c.label}
    </span>
  )
}

function ResponseSparkline({ history }: { history: Check['response_history'] }) {
  const max = Math.max(...history.map(h => h.ms), 1)
  return (
    <div className="flex items-end gap-[2px] h-8">
      {history.map((h, i) => (
        <div
          key={i}
          className={cn(
            'w-[4px] rounded-[1px] transition-colors',
            h.ok
              ? h.ms / max > 0.7 ? 'bg-amber-300' : 'bg-green-300'
              : 'bg-red-400'
          )}
          style={{ height: `${Math.max((h.ms / max) * 100, h.ok ? 15 : 100)}%` }}
          title={`${Math.round(h.ms)}ms${!h.ok ? ' (failed)' : ''}`}
        />
      ))}
    </div>
  )
}

function UptimeBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            percentage >= 99.9 ? 'bg-green-400' : percentage >= 99 ? 'bg-amber-400' : 'bg-red-400'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-medium',
        percentage >= 99.9 ? 'text-green-600' : percentage >= 99 ? 'text-amber-600' : 'text-red-600'
      )}>
        {percentage.toFixed(2)}%
      </span>
    </div>
  )
}

function SSLBadge({ expiresAt }: { expiresAt: string | null }) {
  const [now] = useState(() => Date.now())
  if (!expiresAt) return <span className="text-xs text-gray-400">—</span>
  const days = Math.ceil((new Date(expiresAt).getTime() - now) / 86400000)
  if (days < 0) return <span className="text-xs text-red-600 font-medium">Expired</span>
  if (days < 14) return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
      <Shield className="size-3" />{days}d
    </span>
  )
  if (days < 30) return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Shield className="size-3" />{days}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <Shield className="size-3" />{days}d
    </span>
  )
}

// ─── Create Check Dialog ─────────────────────────────────────────────────────

function CreateCheckDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">New Check</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
            <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Production API" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">URL</label>
            <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="https://api.example.com/health" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Method</label>
              <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option>GET</option>
                <option>HEAD</option>
                <option>POST</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Frequency</label>
              <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="30">Every 30s</option>
                <option value="60">Every 1 min</option>
                <option value="300">Every 5 min</option>
                <option value="600">Every 10 min</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Regions</label>
            <div className="flex flex-wrap gap-2">
              {['us-east', 'us-west', 'eu-west', 'eu-central', 'ap-south', 'ap-east'].map(region => (
                <label key={region} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-200 has-[:checked]:text-indigo-700">
                  <input type="checkbox" className="sr-only" />
                  {region}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Expected Status Code</label>
            <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="200" defaultValue="200" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
            Create Check
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'up' | 'down' | 'degraded' | 'paused'

export default function ChecksPage() {
  const [checks] = useState<Check[]>(DEMO_CHECKS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [creating, setCreating] = useState(false)

  const filtered = checks.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.url.toLowerCase().includes(q)
    }
    return true
  })

  const upCount = checks.filter(c => c.status === 'up').length
  const downCount = checks.filter(c => c.status === 'down').length
  const degradedCount = checks.filter(c => c.status === 'degraded').length
  const avgUptime = checks.length > 0 ? (checks.reduce((s, c) => s + c.uptime_7d, 0) / checks.length) : 0

  const FILTERS: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: checks.length },
    { id: 'up', label: 'Up', count: upCount },
    { id: 'down', label: 'Down', count: downCount },
    { id: 'degraded', label: 'Degraded', count: degradedCount },
    { id: 'paused', label: 'Paused', count: checks.filter(c => c.status === 'paused').length },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Checks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor uptime and performance of your endpoints</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          New Check
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{checks.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Globe className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Healthy</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{upCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-green-500 flex items-center justify-center">
                <ArrowUpRight className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Down</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{downCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-red-500 flex items-center justify-center">
                <ArrowDownRight className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Avg Uptime (7d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avgUptime.toFixed(2)}%</p>
              </div>
              <div className="size-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Shield className="size-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Check list */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {f.label}
                  <span className={cn(
                    'inline-flex items-center justify-center text-[10px] px-1.5 min-w-[18px] rounded-full',
                    filter === f.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <input
                className="pl-9 pr-8 h-8 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56 placeholder:text-gray-400"
                placeholder="Search checks..."
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Endpoint</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Response Time</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Uptime (7d)</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">SSL</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">History (24h)</th>
                  <th className="w-10 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Globe className="size-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No checks found</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Create your first uptime check'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map(check => (
                  <tr key={check.id} className="hover:bg-gray-50/80 group transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'size-9 rounded-lg flex items-center justify-center shrink-0',
                          check.status === 'up' ? 'bg-green-50' :
                          check.status === 'down' ? 'bg-red-50' :
                          check.status === 'degraded' ? 'bg-amber-50' : 'bg-gray-50'
                        )}>
                          <Globe className={cn(
                            'size-4',
                            check.status === 'up' ? 'text-green-500' :
                            check.status === 'down' ? 'text-red-500' :
                            check.status === 'degraded' ? 'text-amber-500' : 'text-gray-400'
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{check.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[240px]">
                            <span className="text-gray-300 uppercase text-[10px] font-medium">{check.method}</span>{' '}
                            {check.url}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={check.status} />
                    </td>
                    <td className="px-5 py-4">
                      {check.status === 'down' ? (
                        <span className="text-sm text-red-500 font-medium">Timeout</span>
                      ) : check.status === 'paused' ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : (
                        <span className={cn(
                          'text-sm font-medium',
                          check.avg_response_ms < 300 ? 'text-green-600' :
                          check.avg_response_ms < 800 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {Math.round(check.avg_response_ms)}ms
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <UptimeBar percentage={check.uptime_7d} />
                    </td>
                    <td className="px-5 py-4">
                      <SSLBadge expiresAt={check.ssl_expires_at} />
                    </td>
                    <td className="px-5 py-4">
                      <ResponseSparkline history={check.response_history} />
                    </td>
                    <td className="px-3 py-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Run now">
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title={check.status === 'paused' ? 'Resume' : 'Pause'}>
                          {check.status === 'paused' ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateCheckDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
