'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api, Job } from '@/lib/api'
import { nextRunIn, timeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateJobDialog } from '@/components/create-job-dialog'
import { StatusDot } from '@/components/ui/status-dot'
import { Layers, PlayCircle, PauseCircle, MoreHorizontal, Clock, Zap, Timer } from 'lucide-react'

export default function HomePage() {
  const { data: jobs, error, mutate } = useSWR('jobs', api.jobs.list, { refreshInterval: 5000 })
  const [creating, setCreating] = useState(false)

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

  const total  = jobs?.length ?? 0
  const active = jobs?.filter(j => j.status === 'active').length ?? 0
  const paused = jobs?.filter(j => j.status === 'paused').length ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your scheduled cron jobs</p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
        >
          + New Job
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          Failed to load jobs: {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
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

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Schedule</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Run</TableHead>
              <TableHead className="text-muted-foreground font-medium">Next Run</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!jobs && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Timer className="size-5 text-muted-foreground/40" />
                    <span className="text-sm">Loading jobs…</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {jobs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                      <Clock className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No jobs yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create your first cron job to get started</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setCreating(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      + New Job
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {jobs?.map(job => (
              <TableRow key={job.id} className="border-border hover:bg-white/[0.02] group">
                <TableCell>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-medium hover:text-amber-400 transition-colors"
                  >
                    {job.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.http_method} {job.http_url}
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
                        {job.status === 'active' ? (
                          <><PauseCircle className="size-3.5 mr-1.5" />Pause</>
                        ) : (
                          <><PlayCircle className="size-3.5 mr-1.5" />Resume</>
                        )}
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
  )
}
