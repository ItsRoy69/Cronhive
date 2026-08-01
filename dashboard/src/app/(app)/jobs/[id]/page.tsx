'use client'

import { use, useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDuration, timeAgo, nextRunIn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { EditJobDialog } from '@/components/edit-job-dialog'
import { RunLogsDialog } from '@/components/run-logs-dialog'
import { StatusDot } from '@/components/ui/status-dot'
import {
  ChevronRight, Zap, Pencil, Clock, Bell, ChevronDown,
  Hash, Calendar, Timer,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(arr: number[], p: number) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)]
}

function StatBlock({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className={`text-lg font-semibold leading-none ${valueClass ?? ''}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [editing, setEditing] = useState(false)
  const [logsRunId, setLogsRunId] = useState<string | null>(null)

  const { data: job, mutate: mutateJob } = useSWR(
    `job-${id}`,
    () => api.jobs.get(id),
    { refreshInterval: 5000 }
  )

  const { data: runs, mutate: mutateRuns } = useSWR(
    `runs-${id}`,
    () => api.jobs.runs(id),
    { refreshInterval: 5000 }
  )

  const successRate = useMemo(() => {
    if (!runs || runs.length === 0) return null
    const finished = runs.filter(r => ['success', 'failed', 'dead'].includes(r.status))
    if (finished.length === 0) return null
    const ok = finished.filter(r => r.status === 'success').length
    return Math.round((ok / finished.length) * 100)
  }, [runs])

  const avgDuration = useMemo(() => {
    if (!runs) return null
    const withDur = runs.filter(r => r.duration_ms != null)
    if (withDur.length === 0) return null
    const avg = withDur.reduce((sum, r) => sum + (r.duration_ms ?? 0), 0) / withDur.length
    return Math.round(avg)
  }, [runs])

  // Group runs by day → compute p10/p50/p90/p99 per bucket
  const chartData = useMemo(() => {
    if (!runs || runs.length === 0) return []

    const groups: Record<string, number[]> = {}
    const order: string[] = []

    const sorted = [...runs]
      .filter(r => r.started_at && r.duration_ms != null)
      .sort((a, b) => new Date(a.started_at!).getTime() - new Date(b.started_at!).getTime())

    sorted.forEach(r => {
      const day = new Date(r.started_at!).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      if (!groups[day]) { groups[day] = []; order.push(day) }
      groups[day].push((r.duration_ms ?? 0) / 1000)
    })

    return [...new Set(order)].map(day => {
      const vals = groups[day]
      return { day, p99: pct(vals, 99), p90: pct(vals, 90), p50: pct(vals, 50), p10: pct(vals, 10) }
    })
  }, [runs])

  const handleTrigger = async () => {
    await api.jobs.trigger(id)
    mutateRuns()
  }

  const handlePause = async () => {
    if (job?.status === 'active') await api.jobs.pause(id)
    else await api.jobs.resume(id)
    mutateJob()
  }

  const statusLabel = job?.status === 'active' ? 'Healthy' : job?.status === 'paused' ? 'Paused' : (job?.status ?? '…')
  const statusClass =
    job?.status === 'active'  ? 'bg-green-100 text-green-700 border border-green-200' :
    job?.status === 'paused'  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-muted text-muted-foreground border border-border'

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-border bg-background shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-xs">{job?.name ?? '…'}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold leading-tight">{job?.name ?? '…'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {job?.cron_expr && (
                <code className="font-mono text-muted-foreground/80">{job.cron_expr}</code>
              )}
              {job?.next_run_at && (
                <span> · Next {nextRunIn(job.next_run_at)}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border hover:bg-muted">
              <Bell className="size-3.5" />
              Alerts: On
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border hover:bg-muted">
              More
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {job && (
        <div className="px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-start gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              {job.last_run_at && (
                <p className="text-xs text-muted-foreground">{timeAgo(job.last_run_at)}</p>
              )}
            </div>

            <div className="w-px self-stretch bg-border" />

            <StatBlock
              label="Success"
              value={successRate !== null ? `${successRate}%` : '—'}
              sub="7 Days"
              valueClass={
                successRate === null ? '' :
                successRate >= 90 ? 'text-green-700' :
                successRate >= 70 ? 'text-yellow-700' : 'text-red-600'
              }
            />

            <div className="w-px self-stretch bg-border" />

            <StatBlock
              label="Performance"
              value={avgDuration !== null ? formatDuration(avgDuration) : '—'}
              sub="7 Days"
            />

            <div className="w-px self-stretch bg-border" />

            <StatBlock
              label="Executions"
              value={runs ? runs.length.toLocaleString() : '—'}
              sub="7 Days"
            />

            <div className="w-px self-stretch bg-border" />

            <StatBlock
              label="Alerts"
              value="None"
              sub="7 Days"
            />
          </div>
        </div>
      )}

      {/* ── Body: chart + events | monitor details ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: chart + run history */}
        <div className="flex-1 min-w-0 overflow-auto p-6 space-y-5">

          {/* Execution Time chart */}
          {chartData.length > 0 ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Execution Time</CardTitle>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border hover:bg-muted">
                    <Calendar className="size-3" />
                    7 Days
                    <ChevronDown className="size-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g99" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="g90" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6d28d9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.06} />
                      </linearGradient>
                      <linearGradient id="g50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4c1d95" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#4c1d95" stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="g10" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2e1065" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#2e1065" stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                      tickFormatter={v => `${v}s`}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(v, name) => [`${((v as number) ?? 0).toFixed(2)}s`, name as string]}
                    />
                    <Area type="monotone" dataKey="p99" stroke="#7c3aed" strokeWidth={1}   fill="url(#g99)" dot={false} name="p99" />
                    <Area type="monotone" dataKey="p90" stroke="#6d28d9" strokeWidth={1}   fill="url(#g90)" dot={false} name="p90" />
                    <Area type="monotone" dataKey="p50" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#g50)" dot={false} name="p50" />
                    <Area type="monotone" dataKey="p10" stroke="#7c3aed" strokeWidth={1}   fill="url(#g10)" dot={false} name="p10" />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex items-center gap-4 justify-end mt-1">
                  {[
                    { label: 'p99', stroke: '#7c3aed' },
                    { label: 'p90', stroke: '#6d28d9' },
                    { label: 'p50', stroke: '#8b5cf6' },
                    { label: 'p10', stroke: '#4c1d95' },
                  ].map(({ label, stroke }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full border-2"
                        style={{ borderColor: stroke, backgroundColor: stroke + '33' }}
                      />
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : runs && runs.length === 0 ? null : (
            <Card className="bg-card border-border">
              <CardContent className="py-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Timer className="size-5 opacity-40" />
                  <span className="text-sm">No execution data yet</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Events / Run History */}
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Events</CardTitle>
                  <Button variant="outline" size="sm" className="h-6 text-xs gap-1 border-border hover:bg-muted">
                    7 Days <ChevronDown className="size-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="size-3" />
                  {runs?.length ?? '—'} total
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs">Attempt</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs">HTTP</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs">Duration</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs">Started</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs">Error</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs?.map(run => (
                  <TableRow key={run.id} className="border-border hover:bg-muted/50">
                    <TableCell><StatusDot status={run.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{run.attempt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{run.http_status ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDuration(run.duration_ms)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{timeAgo(run.started_at)}</TableCell>
                    <TableCell className="text-sm text-destructive max-w-xs truncate">
                      {run.error_msg ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setLogsRunId(run.id)}
                      >
                        Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {runs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
                      No runs yet
                    </TableCell>
                  </TableRow>
                )}
                {!runs && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12 text-sm">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right: Monitor Details panel */}
        {job && (
          <aside className="w-64 shrink-0 border-l border-border bg-background overflow-y-auto">
            <div className="p-5 space-y-5">
              <h3 className="text-sm font-semibold">Monitor Details</h3>

              {/* Type + Key */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Type</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="size-3.5 text-muted-foreground shrink-0" />
                    Job
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Key</p>
                  <p className="text-sm font-mono text-muted-foreground truncate" title={job.id}>
                    {job.id.slice(0, 8)}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Schedule</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono bg-muted/60 border border-border px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wide">
                    CRON
                  </span>
                  <code className="text-sm font-mono">{job.cron_expr}</code>
                </div>
                {job.next_run_at && (
                  <p className="text-xs text-muted-foreground mt-1.5">Next {nextRunIn(job.next_run_at)}</p>
                )}
              </div>

              {/* Platform + Timezone */}
              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Platform</p>
                  <p className="text-sm text-muted-foreground">—</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Server Timezone</p>
                  <p className="text-sm">{job.timezone || 'UTC'}</p>
                </div>
              </div>

              {/* HTTP endpoint */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Note</p>
                <p className="text-xs text-muted-foreground break-all leading-relaxed">
                  <span className="font-mono text-muted-foreground/60">{job.http_method}</span>{' '}
                  {job.http_url}
                </p>
              </div>

              {/* Assertions */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Assertions</p>
                <p className="text-sm text-muted-foreground">None</p>
              </div>

              {/* Notify */}
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notify</p>
                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded px-2.5 py-1.5 text-sm">
                  <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
                  Standard Alert
                </div>
              </div>

              {/* Failure + Schedule Tolerance */}
              <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Failure Tolerance</p>
                  <p className="text-sm text-muted-foreground">—</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Schedule Tolerance</p>
                  <p className="text-sm text-muted-foreground">—</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-border hover:bg-muted"
                  onClick={handleTrigger}
                >
                  <Zap className="size-3.5" />
                  Trigger now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-border hover:bg-muted"
                  onClick={handlePause}
                >
                  {job.status === 'active' ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {job && (
        <EditJobDialog
          job={job}
          open={editing}
          onClose={() => setEditing(false)}
          onUpdated={() => { setEditing(false); mutateJob() }}
        />
      )}
      <RunLogsDialog runId={logsRunId} onClose={() => setLogsRunId(null)} />
    </div>
  )
}
