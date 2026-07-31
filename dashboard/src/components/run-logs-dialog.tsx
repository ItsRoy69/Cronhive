'use client'

import { useEffect, useState } from 'react'
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

export function RunLogsDialog({ runId, onClose }: Props) {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [logUrl, setLogUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!runId) return
    setLoading(true)
    setLogs('')
    setLogUrl(null)
    api.runs.logs(runId)
      .then(data => {
        if (typeof data === 'string') {
          setLogs(data)
        } else if (data && typeof data === 'object' && 'log_url' in data) {
          setLogUrl((data as { log_url: string }).log_url)
        } else {
          setLogs('No logs available.')
        }
      })
      .catch(() => setLogs('Failed to load logs.'))
      .finally(() => setLoading(false))
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
