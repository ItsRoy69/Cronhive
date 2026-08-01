'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
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
import { KeyRound, MoreHorizontal, Copy, Check } from 'lucide-react'

function CreateKeyDialog({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!label.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await api.keys.create(label.trim())
      setCreatedKey(result.key)
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create key')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setLabel('')
    setCreatedKey(null)
    setCopied(false)
    setError('')
    onClose()
  }

  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Key Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Copy this key now — it won&apos;t be shown again.
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={createdKey}
                className="font-mono text-xs bg-muted/40 border-border"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} className="bg-amber-500 hover:bg-amber-400 text-black font-medium">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>New API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</label>
            <Input
              className="mt-1.5 bg-muted/40 border-border"
              placeholder="e.g. production, CI/CD"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !label.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
          >
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function KeysPage() {
  const { data: keys, error, mutate } = useSWR('keys', api.keys.list, { refreshInterval: 10000 })
  const [creating, setCreating] = useState(false)

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? Any services using it will lose access.')) return
    await api.keys.revoke(id)
    mutate()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage authentication keys for this account</p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
        >
          + New Key
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          Failed to load keys: {error.message}
        </div>
      )}

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Label</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Used</TableHead>
              <TableHead className="text-muted-foreground font-medium">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!keys && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {keys?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                      <KeyRound className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No API keys</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create a key to authenticate API requests</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setCreating(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-black"
                    >
                      + New Key
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {keys?.map(key => (
              <TableRow key={key.id} className="border-border hover:bg-white/[0.02] group">
                <TableCell>
                  <span className="text-sm font-medium">{key.label}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {timeAgo(key.last_used)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {timeAgo(key.created_at)}
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
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CreateKeyDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => { setCreating(false); mutate() }}
      />
    </div>
  )
}
