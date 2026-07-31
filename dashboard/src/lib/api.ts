const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

function getApiKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('cronhive_api_key') || ''
}

export async function validateKey(key: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/v1/jobs`, {
    headers: { 'Authorization': `Bearer ${key}` },
  })
  return res.ok
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cronhive_api_key')
      window.dispatchEvent(new Event('cronhive:unauthorized'))
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export type Job = {
  id: string
  name: string
  cron_expr: string
  timezone: string
  http_url: string
  http_method: string
  status: 'active' | 'paused' | 'deleted'
  next_run_at: string | null
  last_run_at: string | null
  created_at: string
}

export type Run = {
  id: string
  status: 'queued' | 'running' | 'success' | 'failed' | 'dead'
  attempt: number
  http_status: number | null
  duration_ms: number | null
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  error_msg: string | null
  created_at: string
}

export type AlertConfig = {
  id: string
  job_id: string | null
  on_failure: boolean
  on_dead: boolean
  on_recovery: boolean
  slack_url: string | null
  email: string | null
  webhook_url: string | null
  created_at: string
}

export const api = {
  jobs: {
    list: () => apiFetch<Job[]>('/jobs'),
    get: (id: string) => apiFetch<Job>(`/jobs/${id}`),
    create: (data: Partial<Job> & { cron_expr: string; http_url: string; name: string }) =>
      apiFetch<{ id: string; next_run_at: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiFetch<void>(`/jobs/${id}`, { method: 'DELETE' }),
    pause: (id: string) => apiFetch<{ status: string }>(`/jobs/${id}/pause`, { method: 'POST' }),
    resume: (id: string) => apiFetch<{ status: string }>(`/jobs/${id}/resume`, { method: 'POST' }),
    trigger: (id: string) => apiFetch<{ run_id: string }>(`/jobs/${id}/trigger`, { method: 'POST' }),
    runs: (id: string) => apiFetch<Run[]>(`/jobs/${id}/runs`),
    update: (id: string, data: Partial<Job>) =>
      apiFetch<{ status: string }>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  runs: {
    get: (id: string) => apiFetch<Run & { log_url?: string }>(`/runs/${id}`),
    logs: (id: string): Promise<string | { log_url: string } | { message: string }> =>
      fetch(`${API_BASE}/api/v1/runs/${id}/logs`, {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      }).then(r => r.headers.get('content-type')?.includes('text/plain') ? r.text() : r.json()),
  },
  keys: {
    list: () => apiFetch<{ id: string; label: string; last_used: string | null; created_at: string }[]>('/keys'),
    create: (label: string) => apiFetch<{ id: string; key: string }>('/keys', { method: 'POST', body: JSON.stringify({ label }) }),
    revoke: (id: string) => apiFetch<void>(`/keys/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: () => apiFetch<AlertConfig[]>('/alerts'),
    create: (data: Partial<AlertConfig>) =>
      apiFetch<{ id: string }>('/alerts', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch<void>(`/alerts/${id}`, { method: 'DELETE' }),
    update: (id: string, data: Partial<AlertConfig>) =>
      apiFetch<{ status: string }>(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
}