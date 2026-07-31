const statusConfig: Record<string, { color: string; label: string }> = {
  active:  { color: 'bg-green-500',  label: 'Active'  },
  paused:  { color: 'bg-yellow-500', label: 'Paused'  },
  deleted: { color: 'bg-zinc-600',   label: 'Deleted' },
  running: { color: 'bg-blue-500',   label: 'Running' },
  success: { color: 'bg-green-500',  label: 'Success' },
  failed:  { color: 'bg-red-500',    label: 'Failed'  },
  dead:    { color: 'bg-red-500',    label: 'Dead'    },
  queued:  { color: 'bg-blue-400',   label: 'Queued'  },
}

export function StatusDot({ status }: { status: string }) {
  const { color, label } = statusConfig[status] ?? { color: 'bg-zinc-600', label: status }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full shrink-0 ${color}`} />
      <span className="text-sm">{label}</span>
    </span>
  )
}
