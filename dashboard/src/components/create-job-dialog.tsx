'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateJobDialog({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    cron_expr: '* * * * *',
    http_url: '',
    http_method: 'POST',
    timezone: 'UTC',
    timeout_secs: 30,
    max_retries: 3,
  })

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
        name: '',
        cron_expr: '* * * * *',
        http_url: '',
        http_method: 'POST',
        timezone: 'UTC',
        timeout_secs: 30,
        max_retries: 3,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="send-weekly-report"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Cron schedule</label>
            <Input
              placeholder="*/5 * * * *"
              value={form.cron_expr}
              onChange={e => setForm(f => ({ ...f, cron_expr: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Standard 5-field cron expression (minute hour dom month dow)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">HTTP URL</label>
            <Input
              placeholder="https://your-service.com/webhook"
              value={form.http_url}
              onChange={e => setForm(f => ({ ...f, http_url: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Method</label>
              <Input
                value={form.http_method}
                onChange={e => setForm(f => ({ ...f, http_method: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Timezone</label>
              <Input
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Timeout (secs)</label>
              <Input
                type="number"
                value={form.timeout_secs}
                onChange={e => setForm(f => ({ ...f, timeout_secs: +e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max retries</label>
              <Input
                type="number"
                value={form.max_retries}
                onChange={e => setForm(f => ({ ...f, max_retries: +e.target.value }))}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}