'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { formatDate, formatDuration, statusColor, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Link from 'next/link'
import { EditJobDialog } from '@/components/edit-job-dialog'
import { RunLogsDialog } from '@/components/run-logs-dialog'

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
    if (job?.status === 'active') {
      await api.jobs.pause(id)
    } else {
      await api.jobs.resume(id)
    }
    mutateJob()
  }

  const chartData = runs?.slice(0, 20).reverse().map((r, i) => ({
    name: `#${i + 1}`,
    duration: r.duration_ms ?? 0,
    status: r.status,
  }))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← All jobs
        </Link>
      </div>

      {job && (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-medium">{job.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={statusColor(job.status) as any}>
                  {job.status}
                </Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {job.cron_expr}
                </code>
                <span className="text-sm text-muted-foreground">
                  {job.timezone}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTrigger}>
                Trigger now
              </Button>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="outline" onClick={handlePause}>
                {job.status === 'active' ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal text-muted-foreground">
                  HTTP URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium truncate">{job.http_url}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal text-muted-foreground">
                  Last run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{timeAgo(job.last_run_at)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal text-muted-foreground">
                  Next run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{formatDate(job.next_run_at)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-normal text-muted-foreground">
                  Total runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{runs?.length ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          {chartData && chartData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Execution duration (last 20 runs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}ms`}
                    />
                    <Tooltip
                      formatter={(v) => [`${v ?? 0}ms`, 'Duration']}
                    />
                    <Bar dataKey="duration" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.status === 'success'
                              ? '#22c55e'
                              : entry.status === 'failed' || entry.status === 'dead'
                              ? '#ef4444'
                              : '#94a3b8'
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Run history</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Attempt</TableHead>
              <TableHead>HTTP</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Logs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs?.map(run => (
              <TableRow key={run.id}>
                <TableCell>
                  <Badge variant={statusColor(run.status) as any}>
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{run.attempt}</TableCell>
                <TableCell className="text-sm">
                  {run.http_status ?? '—'}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDuration(run.duration_ms)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {timeAgo(run.started_at)}
                </TableCell>
                <TableCell className="text-sm text-destructive max-w-xs truncate">
                  {run.error_msg ?? '—'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setLogsRunId(run.id)}>
                    Logs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {runs?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
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
