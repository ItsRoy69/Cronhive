'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Globe, Plus, Search, X, ExternalLink,
  CheckCircle2, XCircle, AlertTriangle, Clock,
  TrendingUp, Eye, RefreshCw,
} from 'lucide-react'

type SiteStatus = 'up' | 'down' | 'degraded' | 'pending'

type Site = {
  id: string
  name: string
  url: string
  status: SiteStatus
  uptime_30d: number
  avg_load_ms: number
  last_checked_at: string
  page_size_kb: number
  ssl_valid: boolean
  performance_score: number
}

const DEMO_SITES: Site[] = [
  { id: '1', name: 'Marketing Site', url: 'https://www.example.com', status: 'up', uptime_30d: 99.99, avg_load_ms: 1200, last_checked_at: new Date(Date.now() - 30000).toISOString(), page_size_kb: 2400, ssl_valid: true, performance_score: 92 },
  { id: '2', name: 'Documentation', url: 'https://docs.example.com', status: 'up', uptime_30d: 100, avg_load_ms: 800, last_checked_at: new Date(Date.now() - 45000).toISOString(), page_size_kb: 1100, ssl_valid: true, performance_score: 97 },
  { id: '3', name: 'Blog', url: 'https://blog.example.com', status: 'degraded', uptime_30d: 98.5, avg_load_ms: 3200, last_checked_at: new Date(Date.now() - 60000).toISOString(), page_size_kb: 4500, ssl_valid: true, performance_score: 54 },
  { id: '4', name: 'Customer Portal', url: 'https://app.example.com', status: 'up', uptime_30d: 99.95, avg_load_ms: 1800, last_checked_at: new Date(Date.now() - 25000).toISOString(), page_size_kb: 3200, ssl_valid: true, performance_score: 78 },
  { id: '5', name: 'Landing Page (Legacy)', url: 'https://old.example.com', status: 'down', uptime_30d: 94.2, avg_load_ms: 0, last_checked_at: new Date(Date.now() - 15000).toISOString(), page_size_kb: 0, ssl_valid: false, performance_score: 0 },
]

function StatusBadge({ status }: { status: SiteStatus }) {
  const config = {
    up: { label: 'Healthy', icon: CheckCircle2, cls: 'bg-green-50 text-green-700' },
    down: { label: 'Down', icon: XCircle, cls: 'bg-red-50 text-red-700' },
    degraded: { label: 'Slow', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
    pending: { label: 'Pending', icon: Clock, cls: 'bg-gray-100 text-gray-600' },
  }
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', c.cls)}>
      <c.icon className="size-3.5" />
      {c.label}
    </span>
  )
}

function PerformanceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            score >= 90 ? 'bg-green-400' : score >= 70 ? 'bg-amber-400' : score > 0 ? 'bg-red-400' : 'bg-gray-200'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-medium',
        score >= 90 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : score > 0 ? 'text-red-600' : 'text-gray-400'
      )}>
        {score > 0 ? score : '—'}
      </span>
    </div>
  )
}

export default function SitesPage() {
  const [sites] = useState<Site[]>(DEMO_SITES)
  const [search, setSearch] = useState('')

  const filtered = sites.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
  })

  const upCount = sites.filter(s => s.status === 'up').length
  const issueCount = sites.filter(s => s.status === 'down' || s.status === 'degraded').length

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sites</h1>
          <p className="text-sm text-gray-500 mt-0.5">Website performance monitoring and page speed insights</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="size-4" />
          Add Site
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Sites</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{sites.length}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Healthy</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{upCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Issues</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{issueCount}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Avg Performance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {sites.length > 0 ? Math.round(sites.reduce((s, st) => s + st.performance_score, 0) / sites.length) : 0}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">All Sites</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <input
                className="pl-9 pr-8 h-8 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56 placeholder:text-gray-400"
                placeholder="Search sites..."
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
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Site</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Load Time</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Uptime (30d)</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Performance</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Page Size</th>
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
                        <p className="text-sm font-medium text-gray-900">No sites found</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map(site => (
                  <tr key={site.id} className="hover:bg-gray-50/80 group transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{site.name}</p>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1 mt-0.5">
                        {site.url.replace('https://', '')}
                        <ExternalLink className="size-3" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={site.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {site.avg_load_ms > 0 ? (
                        <span className={cn(
                          'text-sm font-medium',
                          site.avg_load_ms < 2000 ? 'text-green-600' : site.avg_load_ms < 3000 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {(site.avg_load_ms / 1000).toFixed(1)}s
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'text-xs font-medium',
                        site.uptime_30d >= 99.9 ? 'text-green-600' : site.uptime_30d >= 99 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {site.uptime_30d.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <PerformanceBar score={site.performance_score} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {site.page_size_kb > 0 ? `${(site.page_size_kb / 1024).toFixed(1)} MB` : '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <button className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100" title="Re-check">
                        <RefreshCw className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
