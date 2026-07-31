'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, AlertConfig } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

function ChannelBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', color)}>
      {label}
    </span>
  )
}

function channelBadges(cfg: AlertConfig) {
  const badges: { label: string; color: string }[] = []
  if (cfg.slack_url)   badges.push({ label: 'Slack',   color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' })
  if (cfg.email)       badges.push({ label: 'Email',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' })
  if (cfg.webhook_url) badges.push({ label: 'Webhook', color: 'bg-green-500/10 text-green-400 border-green-500/20' })
  return badges
}

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
      if (form.job_id)      payload.job_id      = form.job_id
      if (form.slack_url)   payload.slack_url   = form.slack_url
      if (form.webhook_url) payload.webhook_url = form.webhook_url
      if (form.email)       payload.email       = form.email
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
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>New Alert Config</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Job ID <span className="normal-case font-normal">(optional — blank = all jobs)</span>
            </label>
            <Input
              className="mt-1.5 bg-muted/40 border-border"
              placeholder="uuid of specific job"
              value={form.job_id}
              onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Slack Webhook URL</label>
            <Input
              className="mt-1.5 bg-muted/40 border-border"
              placeholder="https://hooks.slack.com/…"
              value={form.slack_url}
              onChange={e => setForm(f => ({ ...f, slack_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook URL</label>
            <Input
              className="mt-1.5 bg-muted/40 border-border"
              placeholder="https://example.com/hook"
              value={form.webhook_url}
              onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <Input
              className="mt-1.5 bg-muted/40 border-border"
              type="email"
              placeholder="alerts@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Triggers</label>
            <div className="flex gap-2">
              {(['on_failure', 'on_dead', 'on_recovery'] as const).map(flag => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggle(flag)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors font-medium',
                    form[flag]
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-muted/40 text-muted-foreground border-border hover:border-border/80'
                  )}
                >
                  {flag.replace('on_', '')}
                </button>
              ))}
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
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AlertsPage() {
  const { data: alerts, error, mutate } = useSWR('alerts', api.alerts.list, { refreshInterval: 10000 })
  const [creating, setCreating] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert config?')) return
    await api.alerts.delete(id)
    mutate()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Notify on job failure, dead runs, or recovery</p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
        >
          + New Alert
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          Failed to load alerts: {error.message}
        </div>
      )}

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Scope</TableHead>
              <TableHead className="text-muted-foreground font-medium">Channels</TableHead>
              <TableHead className="text-muted-foreground font-medium">Triggers</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!alerts && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {alerts?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                      <Bell className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No alert configs yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Get notified when jobs fail or recover</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setCreating(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      + New Alert
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {alerts?.map(cfg => (
              <TableRow key={cfg.id} className="border-border hover:bg-white/[0.02] group">
                <TableCell className="text-sm">
                  {cfg.job_id ? (
                    <code className="text-xs bg-muted/60 px-2 py-1 rounded font-mono border border-border">
                      {cfg.job_id.slice(0, 8)}…
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-xs">All jobs</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {channelBadges(cfg).map(b => (
                      <ChannelBadge key={b.label} label={b.label} color={b.color} />
                    ))}
                    {channelBadges(cfg).length === 0 && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1.5 flex-wrap">
                    {cfg.on_failure && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        failure
                      </span>
                    )}
                    {cfg.on_dead && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        dead
                      </span>
                    )}
                    {cfg.on_recovery && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        recovery
                      </span>
                    )}
                  </div>
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
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(cfg.id)}
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

      <CreateAlertDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); mutate() }}
      />
    </div>
  )
}
