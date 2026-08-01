'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Globe, Plus, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, Eye, Users, Copy,
} from 'lucide-react'

type ComponentStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

type StatusComponent = {
  id: string
  name: string
  status: ComponentStatus
}

type StatusPage = {
  id: string
  name: string
  slug: string
  domain: string | null
  is_public: boolean
  components: StatusComponent[]
  subscribers: number
  overall_uptime: number
}

const DEMO_PAGES: StatusPage[] = [
  {
    id: '1', name: 'Public Status', slug: 'status', domain: 'status.example.com', is_public: true,
    subscribers: 342, overall_uptime: 99.95,
    components: [
      { id: 'c1', name: 'API', status: 'operational' },
      { id: 'c2', name: 'Web App', status: 'operational' },
      { id: 'c3', name: 'Database', status: 'operational' },
      { id: 'c4', name: 'Payment Processing', status: 'degraded' },
    ],
  },
  {
    id: '2', name: 'Internal Services', slug: 'internal', domain: null, is_public: false,
    subscribers: 28, overall_uptime: 98.8,
    components: [
      { id: 'c5', name: 'Auth Service', status: 'outage' },
      { id: 'c6', name: 'Email Service', status: 'operational' },
      { id: 'c7', name: 'CDN', status: 'maintenance' },
    ],
  },
]

function ComponentStatusDot({ status }: { status: ComponentStatus }) {
  const cls = {
    operational: 'bg-green-400',
    degraded: 'bg-amber-400',
    outage: 'bg-red-400',
    maintenance: 'bg-blue-400',
  }
  return <span className={cn('size-2 rounded-full shrink-0', cls[status])} />
}

function OverallBadge({ components }: { components: StatusComponent[] }) {
  const hasOutage = components.some(c => c.status === 'outage')
  const hasDegraded = components.some(c => c.status === 'degraded')

  if (hasOutage) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">
      <XCircle className="size-3.5" /> Major Outage
    </span>
  )
  if (hasDegraded) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
      <AlertTriangle className="size-3.5" /> Partial Degradation
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
      <CheckCircle2 className="size-3.5" /> All Operational
    </span>
  )
}

export default function StatusPagesPage() {
  const [pages] = useState<StatusPage[]>(DEMO_PAGES)

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Status Pages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Public and private status pages for your services</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="size-4" />
          New Status Page
        </button>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Page cards */}
        {pages.map(page => (
          <div key={page.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Page header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Globe className="size-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{page.name}</h3>
                    {page.is_public ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">Public</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">Private</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {page.domain && (
                      <a href={`https://${page.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 inline-flex items-center gap-1">
                        {page.domain} <ExternalLink className="size-3" />
                      </a>
                    )}
                    {!page.domain && (
                      <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                        cronhive.io/{page.slug} <Copy className="size-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="size-3" /> {page.subscribers} subscribers
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{page.overall_uptime}% uptime</p>
                </div>
                <OverallBadge components={page.components} />
              </div>
            </div>

            {/* Components list */}
            <div className="divide-y divide-gray-50">
              {page.components.map(comp => (
                <div key={comp.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ComponentStatusDot status={comp.status} />
                    <span className="text-sm text-gray-700">{comp.name}</span>
                  </div>
                  <span className={cn(
                    'text-xs font-medium capitalize',
                    comp.status === 'operational' ? 'text-green-600' :
                    comp.status === 'degraded' ? 'text-amber-600' :
                    comp.status === 'outage' ? 'text-red-600' : 'text-blue-600'
                  )}>
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pages.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Eye className="size-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">No status pages yet</p>
                <p className="text-xs text-gray-500 mt-0.5">Create a public or private status page to communicate system health</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
