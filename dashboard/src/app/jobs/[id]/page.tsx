'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDate, formatDuration, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { EditJobDialog } from '@/components/edit-job-dialog'
import { RunLogsDialog } from '@/components/run-logs-dialog'
import { ChevronRight, Zap, Pencil, Globe, Clock, CalendarClock, Hash } from 'lucide-react'

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    active:  { color: 'bg-green-500',  label: 'Active'   },
    paused:  { color: 'bg-yellow-500', label: 'Paused'   },
    deleted: { color: 'bg-zinc-600',   label: 'Deleted'  },
    running: { color: 'bg-blue-500',   label: 'Running'  },
    success: { color: 'bg-green-500',  label: 'Success'  },
    failed:  { color: 'bg-red-500',    label: 'Failed'   },
    dead:    { color: 'bg-red-500',    label: 'Dead'     },
    queued:  { color: 'bg-blue-400',   label: 'Queued'   },
  }
  const { color, label } = config[status] ?? { color: 'bg-zinc-600', label: status }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full shrink-0 ${color}`} />
      <span className="text-sm">{label}</span>
    </span>
  )
}

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

  const handleTrigger = async () => {
    await api.jobs.trigger(id)
    mutateRuns()
  }

  const handlePause = async () => {
    if (job?.status === 'active') await api.jobs.pause(id)
    else await api.jobs.resume(id)
    mutateJob()
  }

  const chartData = runs?.slice(0, 20).reverse().map((r, i) => ({
    name: `#${i + 1}`,
    duration: r.duration_ms ?? 0,
    status: r.status,
  }))

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Jobs</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground truncate max-w-xs">{job?.name ?? '…'}</span>
      </div>

      {job && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold">{job.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusDot status={job.status} />
                <code className="text-xs bg-muted/60 px-2 py-1 rounded font-mono border border-border">
                  {job.cron_expr}
                </code>
                <span className="text-xs text-muted-foreground">{job.timezone}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-white/5"
                onClick={handleTrigger}
              >
                <Zap className="size-3.5 mr-1.5" />
                Trigger now
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-white/5"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-white/5"
                onClick={handlePause}
              >
                {job.status === 'active' ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">HTTP URL</CardTitle>
                <Globe className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium truncate" title={job.http_url}>{job.http_url}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Last Run</CardTitle>
                <Clock className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{timeAgo(job.last_run_at)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Next Run</CardTitle>
                <CalendarClock className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{formatDate(job.next_run_at)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-1 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Runs</CardTitle>
                <Hash className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{runs?.length ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Duration Chart */}
          {chartData && chartData.length > 0 && (
            <Card className="mb-8 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Execution Duration</CardTitle>
                <p className="text-xs text-muted-foreground">Last 20 runs</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }}
                      tickFormatter={v => `${v}ms`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(0.13 0 0)',
                        border: '1px solid oklch(1 0 0 / 8%)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(v) => [`${v ?? 0}ms`, 'Duration']}
                    />
                    <Bar dataKey="duration" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.status === 'success'
                              ? '#f59e0b'
                              : entry.status === 'failed' || entry.status === 'dead'
                              ? '#ef4444'
                              : '#6b7280'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Run History */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium">Run History</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Attempt</TableHead>
              <TableHead className="text-muted-foreground font-medium">HTTP</TableHead>
              <TableHead className="text-muted-foreground font-medium">Duration</TableHead>
              <TableHead className="text-muted-foreground font-medium">Started</TableHead>
              <TableHead className="text-muted-foreground font-medium">Error</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs?.map(run => (
              <TableRow key={run.id} className="border-border hover:bg-white/[0.02]">
                <TableCell>
                  <StatusDot status={run.status} />
                </TableCell>
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
          </TableBody>
        </Table>
      </Card>

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
