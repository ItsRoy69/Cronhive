'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, Job } from '@/lib/api'
import { formatDate, nextRunIn, timeAgo, statusColor } from '@/lib/utils'
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
import { CreateJobDialog } from '@/components/create-job-dialog'
import Link from 'next/link'

export default function HomePage() {
  const { data: jobs, error, mutate } = useSWR('jobs', api.jobs.list, {
    refreshInterval: 5000,
  })
  const [creating, setCreating] = useState(false)

  const handlePause = async (job: Job) => {
    if (job.status === 'active') {
      await api.jobs.pause(job.id)
    } else {
      await api.jobs.resume(job.id)
    }
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium">CronHive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Distributed cron job scheduler
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Job</Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-4">
          Failed to load jobs: {error.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{jobs?.length ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">
              {jobs?.filter(j => j.status === 'active').length ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">
              {jobs?.filter(j => j.status === 'paused').length ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!jobs && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {jobs?.map(job => (
              <TableRow key={job.id}>
                <TableCell>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-medium hover:underline"
                  >
                    {job.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.http_method} {job.http_url}
                  </p>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {job.cron_expr}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor(job.status) as any}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {timeAgo(job.last_run_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {nextRunIn(job.next_run_at)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrigger(job.id)}
                    >
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(job)}
                    >
                      {job.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(job.id)}
                    >
                      Delete
                    </Button>
                  </div>
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