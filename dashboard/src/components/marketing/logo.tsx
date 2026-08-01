import { Activity } from 'lucide-react'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/30">
        <Activity className="size-4.5 text-white" strokeWidth={2.5} />
      </div>
      <span
        className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        CronHive
      </span>
    </div>
  )
}
