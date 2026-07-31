'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
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
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const TIMEZONES = [
  'UTC',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney',
]

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export function CreateJobDialog({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    cron_expr: '*/5 * * * *',
    http_url: '',
    http_method: 'POST',
    timezone: 'UTC',
    timeout_secs: 30,
    max_retries: 3,
  })

  const setField = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.cron_expr || !form.http_url) {
      setError('Name, schedule and URL are required')
      return
    }
    setLoading(true)
    try {
      await api.jobs.create(form)
      onCreated()
      setForm({
        name: '', cron_expr: '*/5 * * * *', http_url: '',
        http_method: 'POST', timezone: 'UTC', timeout_secs: 30, max_retries: 3,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="send-weekly-report"
              value={form.name}
              onChange={e => setField('name')(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cron schedule</label>
            <Input
              placeholder="*/5 * * * *"
              value={form.cron_expr}
              onChange={e => setField('cron_expr')(e.target.value)}
              className="font-mono"
            />
            <CronPreview expr={form.cron_expr} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">HTTP URL</label>
            <Input
              placeholder="https://your-service.com/webhook"
              value={form.http_url}
              onChange={e => setField('http_url')(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Timeout (secs)</label>
              <Input
                type="number"
                value={form.timeout_secs}
                onChange={e => setField('timeout_secs')(+e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max retries</label>
              <Input
                type="number"
                value={form.max_retries}
                onChange={e => setField('max_retries')(+e.target.value)}
              />
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
            {loading ? 'Creating…' : 'Create Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
