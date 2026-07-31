'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { api, AlertConfig } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function CreateAlertDialog({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    job_id: '',
    slack_url: '',
    webhook_url: '',
    email: '',
    on_failure: true,
    on_dead: true,
    on_recovery: false,
  })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        on_failure: form.on_failure,
        on_dead: form.on_dead,
        on_recovery: form.on_recovery,
      }
      if (form.job_id) payload.job_id = form.job_id
      if (form.slack_url) payload.slack_url = form.slack_url
      if (form.webhook_url) payload.webhook_url = form.webhook_url
      if (form.email) payload.email = form.email

      await api.alerts.create(payload)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create alert')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (field: 'on_failure' | 'on_dead' | 'on_recovery') =>
    setForm(f => ({ ...f, [field]: !f[field] }))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Alert Config</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium">Job ID (optional — blank = all jobs)</label>
            <Input
              placeholder="uuid of specific job"
              value={form.job_id}
              onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slack webhook URL</label>
            <Input
              placeholder="https://hooks.slack.com/..."
              value={form.slack_url}
              onChange={e => setForm(f => ({ ...f, slack_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Webhook URL</label>
            <Input
              placeholder="https://example.com/hook"
              value={form.webhook_url}
              onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="alerts@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            {(['on_failure', 'on_dead', 'on_recovery'] as const).map(flag => (
              <button
                key={flag}
                type="button"
                onClick={() => toggle(flag)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  form[flag]
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border'
                }`}
              >
                {flag.replace('on_', '')}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function channelBadges(cfg: AlertConfig) {
  const channels: string[] = []
  if (cfg.slack_url) channels.push('Slack')
  if (cfg.webhook_url) channels.push('Webhook')
  if (cfg.email) channels.push('Email')
  return channels
}

export default function AlertsPage() {
  const { data: alerts, error, mutate } = useSWR('alerts', api.alerts.list, {
    refreshInterval: 10000,
  })
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert config?')) return
    await api.alerts.delete(id)
    mutate()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← All jobs
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Alert Configs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notify on job failure, dead runs, or recovery
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Alert</Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-4">
          Failed to load alerts: {error.message}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scope</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Triggers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!alerts && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {alerts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No alert configs yet
                </TableCell>
              </TableRow>
            )}
            {alerts?.map(cfg => (
              <TableRow key={cfg.id}>
                <TableCell className="text-sm">
                  {cfg.job_id ? (
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {cfg.job_id.slice(0, 8)}…
                    </code>
                  ) : (
                    <span className="text-muted-foreground">All jobs</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {channelBadges(cfg).map(ch => (
                      <Badge key={ch} variant="secondary">{ch}</Badge>
                    ))}
                    {channelBadges(cfg).length === 0 && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {cfg.on_failure && <Badge variant="destructive">failure</Badge>}
                    {cfg.on_dead && <Badge variant="destructive">dead</Badge>}
                    {cfg.on_recovery && <Badge variant="default">recovery</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(cfg.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CreateAlertDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); mutate() }}
      />
    </div>
  )
}
