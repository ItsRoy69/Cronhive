'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Wrench, Plus, Calendar, Clock, CheckCircle2,
  AlertTriangle, X,
} from 'lucide-react'

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed'

type MaintenanceWindow = {
  id: string
  title: string
  description: string
  status: MaintenanceStatus
  start_at: string
  end_at: string
  affected_services: string[]
  notify_subscribers: boolean
}

const DEMO_WINDOWS: MaintenanceWindow[] = [
  {
    id: '1', title: 'Database Migration v2.4', description: 'Migrating primary database to new schema. Expected 15 min downtime for write operations.',
    status: 'scheduled', start_at: new Date(Date.now() + 86400000).toISOString(), end_at: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    affected_services: ['API', 'Database', 'Payment Processing'], notify_subscribers: true,
  },
  {
    id: '2', title: 'CDN Certificate Rotation', description: 'Rotating SSL certificates on all CDN edge nodes.',
    status: 'in_progress', start_at: new Date(Date.now() - 1800000).toISOString(), end_at: new Date(Date.now() + 1800000).toISOString(),
    affected_services: ['CDN'], notify_subscribers: true,
  },
  {
    id: '3', title: 'Infrastructure Upgrade', description: 'Upgrading compute instances for better performance. No expected downtime.',
    status: 'completed', start_at: new Date(Date.now() - 172800000).toISOString(), end_at: new Date(Date.now() - 169200000).toISOString(),
    affected_services: ['Web App', 'API'], notify_subscribers: false,
  },
  {
    id: '4', title: 'Network Switch Maintenance', description: 'Replacing network switches in US-East region. Brief connectivity interruptions possible.',
    status: 'completed', start_at: new Date(Date.now() - 604800000).toISOString(), end_at: new Date(Date.now() - 601200000).toISOString(),
    affected_services: ['All Services'], notify_subscribers: true,
  },
]

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const config = {
    scheduled: { label: 'Scheduled', icon: Calendar, cls: 'bg-blue-50 text-blue-700' },
    in_progress: { label: 'In Progress', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
    completed: { label: 'Completed', icon: CheckCircle2, cls: 'bg-green-50 text-green-700' },
  }
  const c = config[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', c.cls)}>
      <c.icon className="size-3.5" />
      {c.label}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default function MaintenancePage() {
  const [windows] = useState<MaintenanceWindow[]>(DEMO_WINDOWS)
  const [creating, setCreating] = useState(false)

  const scheduled = windows.filter(w => w.status === 'scheduled')
  const inProgress = windows.filter(w => w.status === 'in_progress')
  const completed = windows.filter(w => w.status === 'completed')

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and track planned maintenance windows</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          Schedule Maintenance
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{scheduled.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Calendar className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{inProgress.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Wrench className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed (30d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completed.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        {inProgress.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">In Progress</h3>
            <div className="space-y-3">
              {inProgress.map(w => (
                <div key={w.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{w.title}</h4>
                        <StatusBadge status={w.status} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{w.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="size-3" /> Started {formatDate(w.start_at)}
                        </span>
                        <span className="text-xs text-gray-500">Duration: {formatDuration(w.start_at, w.end_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {w.affected_services.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-700 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled */}
        {scheduled.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upcoming</h3>
            <div className="space-y-3">
              {scheduled.map(w => (
                <div key={w.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{w.title}</h4>
                        <StatusBadge status={w.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{w.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="size-3" /> {formatDate(w.start_at)} – {formatDate(w.end_at)}
                        </span>
                        <span className="text-xs text-gray-500">Duration: {formatDuration(w.start_at, w.end_at)}</span>
                      </div>
                    </div>
                    {w.notify_subscribers && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium shrink-0">Subscribers notified</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {w.affected_services.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recently Completed</h3>
            <div className="space-y-3">
              {completed.map(w => (
                <div key={w.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700">{w.title}</h4>
                        <StatusBadge status={w.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="size-3" /> {formatDate(w.start_at)}
                        </span>
                        <span className="text-xs text-gray-400">Duration: {formatDuration(w.start_at, w.end_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {w.affected_services.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create dialog */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Schedule Maintenance</h2>
              <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Title</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Database Migration" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                <textarea rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="What will be affected and for how long?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Start</label>
                  <input type="datetime-local" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">End</label>
                  <input type="datetime-local" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Affected Services</label>
                <input className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="API, Database (comma separated)" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                <span className="text-sm text-gray-700">Notify status page subscribers</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
              <button className="px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
