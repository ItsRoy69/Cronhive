'use client'

import { useState } from 'react'
import { api, Job } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CronPreview } from '@/components/cron-preview'

interface Props {
  job: Job
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

const TIMEZONES = [
  'UTC',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney',
]

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export function EditJobDialog({ job, open, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prevJob, setPrevJob] = useState(job)
  const [form, setForm] = useState({
    name: job.name,
    cron_expr: job.cron_expr,
    http_url: job.http_url,
    http_method: job.http_method,
    timezone: job.timezone,
  })

  if (prevJob !== job) {
    setPrevJob(job)
    setForm({
      name: job.name,
      cron_expr: job.cron_expr,
      http_url: job.http_url,
      http_method: job.http_method,
      timezone: job.timezone,
    })
  }

  const setField = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.jobs.update(job.id, form)
      onUpdated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={e => setField('name')(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cron expression</label>
            <Input
              value={form.cron_expr}
              onChange={e => setField('cron_expr')(e.target.value)}
              className="font-mono"
            />
            <CronPreview expr={form.cron_expr} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">HTTP URL</label>
            <Input value={form.http_url} onChange={e => setField('http_url')(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Method</label>
              <Select value={form.http_method} onValueChange={setField('http_method')}>
                <SelectTrigger className="w-full bg-muted/40 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Timezone</label>
              <Select value={form.timezone} onValueChange={setField('timezone')}>
                <SelectTrigger className="w-full bg-muted/40 border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
