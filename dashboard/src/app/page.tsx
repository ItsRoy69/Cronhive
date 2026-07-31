'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api, Job } from '@/lib/api'
import { nextRunIn, timeAgo, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { CreateJobDialog } from '@/components/create-job-dialog'
import { StatusDot } from '@/components/ui/status-dot'
import { cn } from '@/lib/utils'
import {
  Layers, PlayCircle, PauseCircle, MoreHorizontal,
  Clock, Zap, Timer, Search, X,
} from 'lucide-react'

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
          <span key={i} className="w-[5px] h-3.5 rounded-[1px] bg-muted/40" />
        ))}
      </div>
    )
  }

  if (!runs.length) return <span className="text-muted-foreground/30 text-[11px]">—</span>

  const recent = [...runs].reverse().slice(0, 20)

  return (
    <div className="flex items-center gap-[2px]">
      {recent.map((r, i) => {
        const bgClass =
          r.status === 'success'
            ? 'bg-green-500/70 hover:bg-green-400'
            : r.status === 'failed' || r.status === 'dead'
            ? 'bg-red-500/70 hover:bg-red-400'
            : r.status === 'running' || r.status === 'queued'
            ? 'bg-blue-400/70 hover:bg-blue-300'
            : 'bg-zinc-600/50'
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className={cn('block w-[5px] h-3.5 rounded-[1px] transition-colors cursor-default', bgClass)} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <span className="capitalize">{r.status}</span>
              {r.duration_ms != null && ` · ${formatDuration(r.duration_ms)}`}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused'

export default function HomePage() {
  const { data: jobs, error, mutate } = useSWR('jobs', api.jobs.list, { refreshInterval: 5000 })
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const total  = jobs?.length ?? 0
  const active = jobs?.filter(j => j.status === 'active').length ?? 0
  const paused = jobs?.filter(j => j.status === 'paused').length ?? 0

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return
    await api.jobs.delete(id)
    mutate()
  }

  const FILTERS: { id: StatusFilter; label: string; count: number | undefined }[] = [
    { id: 'all',    label: 'All',    count: jobs ? total  : undefined },
    { id: 'active', label: 'Active', count: jobs ? active : undefined },
    { id: 'paused', label: 'Paused', count: jobs ? paused : undefined },
  ]

  return (
    <TooltipProvider delayDuration={100}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Jobs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor and manage your scheduled cron jobs</p>
          </div>
          <Button
            onClick={() => setCreating(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
          >
            + New Job
          </Button>
        </div>

        {error && (
          <div className="text-destructive text-sm mb-5 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            Failed to load jobs: {error.message}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Jobs</CardTitle>
              <Layers className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{jobs ? total : '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
              <PlayCircle className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-400">{jobs ? active : '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Paused</CardTitle>
              <PauseCircle className="size-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-yellow-400">{jobs ? paused : '—'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-8 text-sm bg-muted/40 border-border"
              placeholder="Search jobs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center border border-border rounded-lg overflow-hidden h-8 text-xs">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-full font-medium transition-colors',
                  statusFilter === f.id
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className={cn(
                    'inline-flex items-center justify-center text-[10px] px-1.5 min-w-[18px] rounded-full',
                    statusFilter === f.id
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="bg-card border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Schedule</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">History</TableHead>
                <TableHead className="text-muted-foreground font-medium">Last Run</TableHead>
                <TableHead className="text-muted-foreground font-medium">Next Run</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!jobs && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Timer className="size-5 text-muted-foreground/40" />
                      <span className="text-sm">Loading jobs…</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {jobs && displayedJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                        <Clock className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {search || statusFilter !== 'all' ? 'No matching jobs' : 'No jobs yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {search || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter'
                            : 'Create your first cron job to get started'}
                        </p>
                      </div>
                      {!search && statusFilter === 'all' && (
                        <Button
                          size="sm"
                          onClick={() => setCreating(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-black"
                        >
                          + New Job
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {displayedJobs.map(job => (
                <TableRow key={job.id} className="border-border hover:bg-white/[0.02] group">
                  <TableCell>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium hover:text-amber-400 transition-colors"
                    >
                      {job.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                      <span className="text-muted-foreground/50">{job.http_method}</span>{' '}
                      {job.http_url}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted/60 px-2 py-1 rounded font-mono border border-border">
                      {job.cron_expr}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusDot status={job.status} />
                  </TableCell>
                  <TableCell>
                    <RunHistoryBar jobId={job.id} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {timeAgo(job.last_run_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {nextRunIn(job.next_run_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleTrigger(job.id)}>
                          <Zap className="size-3.5 mr-1.5" />
                          Run now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePause(job)}>
                          {job.status === 'active'
                            ? <><PauseCircle className="size-3.5 mr-1.5" />Pause</>
                            : <><PlayCircle className="size-3.5 mr-1.5" />Resume</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/jobs/${job.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(job.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <CreateJobDialog
          open={creating}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); mutate() }}
        />
      </div>
    </TooltipProvider>
  )
}
