'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api, Job, Run } from '@/lib/api'
import { nextRunIn, timeAgo, formatDuration } from '@/lib/utils'
import { CreateJobDialog } from '@/components/create-job-dialog'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  PlayCircle, PauseCircle,
  Clock, Zap, Timer, Search, X,
  Activity, CheckCircle2, XCircle,
  TrendingUp, ArrowRight, Plus,
} from 'lucide-react'

// ─── Overview Charts (built from run data) ───────────────────────────────────

function useAllRuns(jobs: Job[] | undefined) {
  const jobIds = jobs?.map(j => j.id) ?? []
  const { data } = useSWR(
    jobIds.length ? `all-runs-${jobIds.join(',')}` : null,
    async () => {
      const results = await Promise.all(jobIds.map(id => api.jobs.runs(id)))
      return results.flat()
    },
    { refreshInterval: 30_000, revalidateOnFocus: false }
  )
  return data
}

function buildDailyChartData(runs: Run[] | undefined) {
  if (!runs || !runs.length) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), success: 0, failed: 0, total: 0 }
    })
  }

  const days: Record<string, { success: number; failed: number; total: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days[key] = { success: 0, failed: 0, total: 0 }
  }

  for (const run of runs) {
    const date = (run.started_at || run.created_at).slice(0, 10)
    if (days[date]) {
      days[date].total++
      if (run.status === 'success') days[date].success++
      if (run.status === 'failed' || run.status === 'dead') days[date].failed++
    }
  }

  return Object.entries(days).map(([date, counts]) => ({
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    ...counts,
  }))
}

function buildDurationChartData(runs: Run[] | undefined) {
  if (!runs || !runs.length) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), avg: 0 }
    })
  }

  const days: Record<string, { sum: number; count: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days[d.toISOString().slice(0, 10)] = { sum: 0, count: 0 }
  }

  for (const run of runs) {
    if (run.duration_ms == null) continue
    const date = (run.started_at || run.created_at).slice(0, 10)
    if (days[date]) {
      days[date].sum += run.duration_ms
      days[date].count++
    }
  }

  return Object.entries(days).map(([date, { sum, count }]) => ({
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    avg: count > 0 ? Math.round(sum / count) : 0,
  }))
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: string | number; icon: React.ElementType; color: string; trend?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="size-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('size-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="size-5 text-white" />
        </div>
      </div>
    </div>
  )
}

// ─── Run history sparkline ────────────────────────────────────────────────────

function RunHistoryBar({ jobId }: { jobId: string }) {
  const { data: runs } = useSWR(
    `runs-sparkline-${jobId}`,
    () => api.jobs.runs(jobId),
    { refreshInterval: 60_000, revalidateOnFocus: false, dedupingInterval: 30_000 }
  )

  if (!runs) {
    return (
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="w-[5px] h-3.5 rounded-[1px] bg-gray-100" />
        ))}
      </div>
    )
  }

  if (!runs.length) return <span className="text-gray-300 text-[11px]">—</span>

  const recent = [...runs].reverse().slice(0, 20)

  return (
    <div className="flex items-center gap-[2px]">
      {recent.map((r, i) => {
        const bgClass =
          r.status === 'success'
            ? 'bg-green-400 hover:bg-green-500'
            : r.status === 'failed' || r.status === 'dead'
            ? 'bg-red-400 hover:bg-red-500'
            : r.status === 'running' || r.status === 'queued'
            ? 'bg-indigo-400 hover:bg-indigo-500'
            : 'bg-gray-200'
        return (
          <span
            key={i}
            title={`${r.status}${r.duration_ms != null ? ` · ${formatDuration(r.duration_ms)}` : ''}`}
            className={cn('block w-[5px] h-3.5 rounded-[1px] transition-colors cursor-default', bgClass)}
          />
        )
      })}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused'

export default function DashboardPage() {
  const { data: jobs, error, mutate } = useSWR('jobs', api.jobs.list, { refreshInterval: 5000 })
  const allRuns = useAllRuns(jobs)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const total  = jobs?.length ?? 0
  const active = jobs?.filter(j => j.status === 'active').length ?? 0
  const paused = jobs?.filter(j => j.status === 'paused').length ?? 0

  const totalRuns = allRuns?.length ?? 0
  const successRuns = allRuns?.filter(r => r.status === 'success').length ?? 0
  const failedRuns = allRuns?.filter(r => r.status === 'failed' || r.status === 'dead').length ?? 0
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0

  const dailyData = useMemo(() => buildDailyChartData(allRuns), [allRuns])
  const durationData = useMemo(() => buildDurationChartData(allRuns), [allRuns])

  const displayedJobs = useMemo(() => {
    if (!jobs) return []
    let list = jobs
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(j =>
        j.name.toLowerCase().includes(q) ||
        (j.http_url ?? '').toLowerCase().includes(q) ||
        (j.cron_expr ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter(j => j.status === statusFilter)
    return list
  }, [jobs, search, statusFilter])

  const handlePause = async (job: Job) => {
    if (job.status === 'active') await api.jobs.pause(job.id)
    else await api.jobs.resume(job.id)
    mutate()
  }

  const handleTrigger = async (id: string) => {
    await api.jobs.trigger(id)
    mutate()
  }

  const FILTERS: { id: StatusFilter; label: string; count: number | undefined }[] = [
    { id: 'all',    label: 'All Jobs',  count: jobs ? total  : undefined },
    { id: 'active', label: 'Active',    count: jobs ? active : undefined },
    { id: 'paused', label: 'Paused',    count: jobs ? paused : undefined },
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage your cron jobs</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          New Job
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {error && (
          <div className="text-red-600 text-sm p-4 rounded-lg bg-red-50 border border-red-100">
            Failed to load jobs: {error.message}
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Jobs" value={total} icon={Activity} color="bg-indigo-500" />
          <StatCard label="Active" value={active} icon={CheckCircle2} color="bg-green-500" trend={total > 0 ? `${Math.round((active/total)*100)}% of total` : undefined} />
          <StatCard label="Failed Runs" value={failedRuns} icon={XCircle} color="bg-red-500" />
          <StatCard label="Success Rate" value={`${successRate}%`} icon={TrendingUp} color="bg-amber-500" />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Executions chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Executions (7 days)</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-indigo-400" />Success</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-400" />Failed</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="success" stroke="#818cf8" strokeWidth={2} fill="url(#successGrad)" />
                <Area type="monotone" dataKey="failed" stroke="#f87171" strokeWidth={2} fill="url(#failedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Avg duration chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Avg Duration (ms)</h3>
              <span className="text-xs text-gray-400">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={durationData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value) => [`${value}ms`, 'Avg Duration']}
                />
                <Bar dataKey="avg" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Jobs Table ── */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === f.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span className={cn(
                      'inline-flex items-center justify-center text-[10px] px-1.5 min-w-[18px] rounded-full',
                      statusFilter === f.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <input
                className="pl-9 pr-8 h-8 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56 placeholder:text-gray-400"
                placeholder="Search jobs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Schedule</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">History</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Last Run</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Next Run</th>
                  <th className="w-10 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!jobs && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Timer className="size-5 text-gray-300 animate-pulse" />
                        <span className="text-sm">Loading jobs…</span>
                      </div>
                    </td>
                  </tr>
                )}
                {jobs && displayedJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Clock className="size-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {search || statusFilter !== 'all' ? 'No matching jobs' : 'No jobs yet'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {search || statusFilter !== 'all'
                              ? 'Try adjusting your search or filter'
                              : 'Create your first cron job to get started'}
                          </p>
                        </div>
                        {!search && statusFilter === 'all' && (
                          <button
                            onClick={() => setCreating(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            New Job
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {displayedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50/80 group transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {job.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
                        <span className="text-gray-300 uppercase text-[10px] font-medium">{job.http_method}</span>{' '}
                        {job.http_url}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs bg-gray-50 px-2 py-1 rounded-md font-mono text-gray-600 border border-gray-100">
                        {job.cron_expr}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                        job.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        <span className={cn(
                          'size-1.5 rounded-full',
                          job.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RunHistoryBar jobId={job.id} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {timeAgo(job.last_run_at)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {nextRunIn(job.next_run_at)}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => handleTrigger(job.id)}
                          className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Run now"
                        >
                          <Zap className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handlePause(job)}
                          className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title={job.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {job.status === 'active'
                            ? <PauseCircle className="size-3.5" />
                            : <PlayCircle className="size-3.5" />
                          }
                        </button>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateJobDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); mutate() }}
      />
    </div>
  )
}
