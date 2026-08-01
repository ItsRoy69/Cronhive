'use client'

import { useEffect, useReducer } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  runId: string | null
  onClose: () => void
}

type State = { loading: boolean; logs: string; logUrl: string | null }
type Action =
  | { type: 'fetch' }
  | { type: 'logs'; payload: string }
  | { type: 'url'; payload: string }
  | { type: 'error' }

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case 'fetch': return { loading: true, logs: '', logUrl: null }
    case 'logs':  return { loading: false, logs: action.payload, logUrl: null }
    case 'url':   return { loading: false, logs: '', logUrl: action.payload }
    case 'error': return { loading: false, logs: 'Failed to load logs.', logUrl: null }
  }
}

export function RunLogsDialog({ runId, onClose }: Props) {
  const [{ loading, logs, logUrl }, dispatch] = useReducer(reducer, {
    loading: false,
    logs: '',
    logUrl: null,
  })

  useEffect(() => {
    if (!runId) return
    dispatch({ type: 'fetch' })
    api.runs.logs(runId)
      .then(data => {
        if (typeof data === 'string') {
          dispatch({ type: 'logs', payload: data })
        } else if (data && typeof data === 'object' && 'log_url' in data) {
          dispatch({ type: 'url', payload: (data as { log_url: string }).log_url })
        } else {
          dispatch({ type: 'logs', payload: 'No logs available.' })
        }
      })
      .catch(() => dispatch({ type: 'error' }))
  }, [runId])

  return (
    <Dialog open={!!runId} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run Logs</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {logUrl && (
            <p className="text-sm">
              Logs stored externally:{' '}
              <a href={logUrl} target="_blank" rel="noreferrer" className="underline text-blue-500">
                View
              </a>
            </p>
          )}
          {!loading && !logUrl && (
            <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
              {logs || 'No output captured.'}
            </pre>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
