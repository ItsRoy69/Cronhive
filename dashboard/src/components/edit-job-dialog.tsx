'use client'

import { useState, useEffect } from 'react'
import { api, Job } from '@/lib/api'
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
  job: Job
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export function EditJobDialog({ job, open, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: job.name,
    cron_expr: job.cron_expr,
    http_url: job.http_url,
    http_method: job.http_method,
    timezone: job.timezone,
  })

  useEffect(() => {
    setForm({
      name: job.name,
      cron_expr: job.cron_expr,
      http_url: job.http_url,
      http_method: job.http_method,
      timezone: job.timezone,
    })
  }, [job])

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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="text-sm font-medium">Cron expression</label>
            <Input value={form.cron_expr} onChange={set('cron_expr')} />
          </div>
          <div>
            <label className="text-sm font-medium">HTTP URL</label>
            <Input value={form.http_url} onChange={set('http_url')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Method</label>
              <Input value={form.http_method} onChange={set('http_method')} />
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Input value={form.timezone} onChange={set('timezone')} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
