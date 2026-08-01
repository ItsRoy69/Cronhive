'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api, AlertConfig } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Bell, Plus, Search, X, Trash2,
  AlertTriangle, CheckCircle2, Zap, Mail, MessageSquare, Globe,
} from 'lucide-react'

function ChannelBadge({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', color)}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

function channelBadges(cfg: AlertConfig) {
  const badges: { icon: React.ElementType; label: string; color: string }[] = []
  if (cfg.slack_url) badges.push({ icon: MessageSquare, label: 'Slack', color: 'bg-purple-50 text-purple-700' })
  if (cfg.email) badges.push({ icon: Mail, label: 'Email', color: 'bg-blue-50 text-blue-700' })
  if (cfg.webhook_url) badges.push({ icon: Globe, label: 'Webhook', color: 'bg-green-50 text-green-700' })
  return badges
}

function TriggerBadge({ label, type }: { label: string; type: 'danger' | 'success' }) {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-full font-medium',
      type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
    )}>
      {label}
    </span>
  )
}

function CreateAlertDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    job_id: '', slack_url: '', webhook_url: '', email: '',
    on_failure: true, on_dead: true, on_recovery: false,
  })

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        on_failure: form.on_failure, on_dead: form.on_dead, on_recovery: form.on_recovery,
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">New Alert Config</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Job ID <span className="text-gray-400 font-normal">(optional — blank = all jobs)</span>
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="UUID of specific job"
              value={form.job_id}
              onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Slack Webhook URL</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://hooks.slack.com/..."
              value={form.slack_url}
              onChange={e => setForm(f => ({ ...f, slack_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Webhook URL</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://example.com/hook"
              value={form.webhook_url}
              onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="alerts@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Triggers</label>
            <div className="flex gap-2">
              {(['on_failure', 'on_dead', 'on_recovery'] as const).map(flag => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggle(flag)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                    form[flag]
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {flag.replace('on_', '')}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Creating…' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const { data: alerts, error, mutate } = useSWR('alerts', api.alerts.list, { refreshInterval: 10000 })
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert config?')) return
    await api.alerts.delete(id)
    mutate()
  }

  const filtered = alerts?.filter(cfg => {
    if (!search) return true
    const q = search.toLowerCase()
    return (cfg.email ?? '').toLowerCase().includes(q) ||
      (cfg.slack_url ?? '').toLowerCase().includes(q) ||
      (cfg.job_id ?? '').toLowerCase().includes(q)
  })

  const totalAlerts = alerts?.length ?? 0
  const slackCount = alerts?.filter(a => a.slack_url).length ?? 0
  const emailCount = alerts?.filter(a => a.email).length ?? 0

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Issues & Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure notifications for job failures, dead runs, and recovery</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          New Alert
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {error && (
          <div className="text-red-600 text-sm p-4 rounded-lg bg-red-50 border border-red-100">
            Failed to load alerts: {error.message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Configs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalAlerts}</p>
              </div>
              <div className="size-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Bell className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Slack Channels</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{slackCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <MessageSquare className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Email Alerts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{emailCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Mail className="size-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert configs table */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Alert Configurations</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <input
                className="pl-9 pr-8 h-8 text-sm rounded-lg border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-56 placeholder:text-gray-400"
                placeholder="Search alerts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Scope</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Channels</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Triggers</th>
                  <th className="w-10 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!alerts && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Bell className="size-5 text-gray-300 animate-pulse" />
                        <span className="text-sm">Loading…</span>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered?.length === 0 && alerts && (
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Bell className="size-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">No alert configs yet</p>
                          <p className="text-xs text-gray-500 mt-0.5">Get notified when jobs fail or recover</p>
                        </div>
                        <button
                          onClick={() => setCreating(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="size-3.5" />
                          New Alert
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered?.map(cfg => (
                  <tr key={cfg.id} className="hover:bg-gray-50/80 group transition-colors">
                    <td className="px-5 py-3.5">
                      {cfg.job_id ? (
                        <code className="text-xs bg-gray-50 px-2 py-1 rounded-md font-mono text-gray-600 border border-gray-100">
                          {cfg.job_id.slice(0, 8)}…
                        </code>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Zap className="size-3" /> All jobs
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {channelBadges(cfg).map(b => (
                          <ChannelBadge key={b.label} icon={b.icon} label={b.label} color={b.color} />
                        ))}
                        {channelBadges(cfg).length === 0 && (
                          <span className="text-xs text-gray-400">None configured</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {cfg.on_failure && <TriggerBadge label="failure" type="danger" />}
                        {cfg.on_dead && <TriggerBadge label="dead" type="danger" />}
                        {cfg.on_recovery && <TriggerBadge label="recovery" type="success" />}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => handleDelete(cfg.id)}
                        className="size-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateAlertDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); mutate() }}
      />
    </div>
  )
}
