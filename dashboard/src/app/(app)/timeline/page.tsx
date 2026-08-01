'use client'

import { cn } from '@/lib/utils'
import {
  CheckCircle2, XCircle, AlertTriangle, Pause, Play,
  Clock, Zap, Bell, Settings,
} from 'lucide-react'

type EventType = 'job_success' | 'job_failed' | 'job_triggered' | 'alert_sent' | 'job_paused' | 'job_resumed' | 'check_down' | 'check_recovered' | 'settings_changed'

type TimelineEvent = {
  id: string
  type: EventType
  title: string
  description: string
  timestamp: string
  metadata?: { job_name?: string; duration_ms?: number }
}

function generateDemoEvents(): TimelineEvent[] {
  const now = Date.now()
  return [
    { id: '1', type: 'job_success', title: 'Invoice Generator completed', description: 'Finished in 2.3s with exit code 0', timestamp: new Date(now - 300000).toISOString(), metadata: { job_name: 'Invoice Generator', duration_ms: 2300 } },
    { id: '2', type: 'alert_sent', title: 'Alert sent for Auth Service', description: 'Slack notification delivered to #ops-alerts', timestamp: new Date(now - 600000).toISOString() },
    { id: '3', type: 'check_down', title: 'Auth Service is down', description: 'HTTPS check failed from us-east and eu-west', timestamp: new Date(now - 660000).toISOString() },
    { id: '4', type: 'job_success', title: 'Data Backup completed', description: 'Finished in 45.2s with exit code 0', timestamp: new Date(now - 3600000).toISOString(), metadata: { job_name: 'Data Backup', duration_ms: 45200 } },
    { id: '5', type: 'job_failed', title: 'Email Digest failed', description: 'SMTP connection timeout after 30s', timestamp: new Date(now - 7200000).toISOString(), metadata: { job_name: 'Email Digest' } },
    { id: '6', type: 'alert_sent', title: 'Alert sent for Email Digest', description: 'Email notification sent to ops@example.com', timestamp: new Date(now - 7200000).toISOString() },
    { id: '7', type: 'job_triggered', title: 'Cache Cleanup triggered manually', description: 'Triggered by user admin@example.com', timestamp: new Date(now - 10800000).toISOString() },
    { id: '8', type: 'job_paused', title: 'CDN Assets check paused', description: 'Paused for scheduled maintenance', timestamp: new Date(now - 14400000).toISOString() },
    { id: '9', type: 'check_recovered', title: 'Payment Gateway recovered', description: 'Responding normally from all regions (avg 180ms)', timestamp: new Date(now - 18000000).toISOString() },
    { id: '10', type: 'job_success', title: 'Report Generator completed', description: 'Finished in 12.8s with exit code 0', timestamp: new Date(now - 21600000).toISOString(), metadata: { duration_ms: 12800 } },
    { id: '11', type: 'settings_changed', title: 'Alert configuration updated', description: 'Added Slack webhook for Payment Gateway', timestamp: new Date(now - 28800000).toISOString() },
    { id: '12', type: 'job_resumed', title: 'SSL Renewal resumed', description: 'Monitoring resumed after maintenance', timestamp: new Date(now - 36000000).toISOString() },
  ]
}

function EventIcon({ type }: { type: EventType }) {
  const config: Record<EventType, { icon: React.ElementType; bg: string; fg: string }> = {
    job_success: { icon: CheckCircle2, bg: 'bg-green-50', fg: 'text-green-500' },
    job_failed: { icon: XCircle, bg: 'bg-red-50', fg: 'text-red-500' },
    job_triggered: { icon: Zap, bg: 'bg-indigo-50', fg: 'text-indigo-500' },
    alert_sent: { icon: Bell, bg: 'bg-amber-50', fg: 'text-amber-500' },
    job_paused: { icon: Pause, bg: 'bg-gray-100', fg: 'text-gray-500' },
    job_resumed: { icon: Play, bg: 'bg-green-50', fg: 'text-green-500' },
    check_down: { icon: AlertTriangle, bg: 'bg-red-50', fg: 'text-red-500' },
    check_recovered: { icon: CheckCircle2, bg: 'bg-green-50', fg: 'text-green-500' },
    settings_changed: { icon: Settings, bg: 'bg-gray-100', fg: 'text-gray-500' },
  }
  const c = config[type]
  return (
    <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
      <c.icon className={cn('size-4', c.fg)} />
    </div>
  )
}

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function groupByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {}
  for (const event of events) {
    const date = new Date(event.timestamp)
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    let key: string
    if (date.toDateString() === today.toDateString()) key = 'Today'
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
  }
  return groups
}

export default function TimelinePage() {
  const events = generateDemoEvents()
  const grouped = groupByDate(events)

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Activity feed for all your monitors and jobs</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-gray-500"><Clock className="size-3.5" /> Live updates</span>
          <span className="size-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{date}</h3>
              <div className="space-y-1">
                {items.map((event, i) => (
                  <div key={event.id} className="relative flex gap-4 py-3 px-4 rounded-lg hover:bg-white hover:shadow-sm transition-all group">
                    {/* Connector line */}
                    {i < items.length - 1 && (
                      <div className="absolute left-[2.25rem] top-12 bottom-0 w-px bg-gray-100" />
                    )}
                    <EventIcon type={event.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 pt-0.5">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
