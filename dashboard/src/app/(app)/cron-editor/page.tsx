'use client'

import { useState } from 'react'
import { CronPreview } from '@/components/cron-preview'
import { cn } from '@/lib/utils'
import { Terminal, BookOpen } from 'lucide-react'

const PRESETS = [
  { label: 'Every minute',      expr: '* * * * *'    },
  { label: 'Every 5 minutes',   expr: '*/5 * * * *'  },
  { label: 'Every 15 minutes',  expr: '*/15 * * * *' },
  { label: 'Every 30 minutes',  expr: '*/30 * * * *' },
  { label: 'Every hour',        expr: '0 * * * *'    },
  { label: 'Every 6 hours',     expr: '0 */6 * * *'  },
  { label: 'Every 12 hours',    expr: '0 */12 * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *'    },
  { label: 'Daily at 9 AM',     expr: '0 9 * * *'    },
  { label: 'Weekdays at 9 AM',  expr: '0 9 * * 1-5'  },
  { label: 'Every Monday',      expr: '0 9 * * 1'    },
  { label: 'Every Sunday',      expr: '0 0 * * 0'    },
  { label: 'Monthly (1st)',     expr: '0 0 1 * *'    },
  { label: 'Yearly (Jan 1st)', expr: '0 0 1 1 *'    },
] as const

const FIELD_LABELS = [
  { label: 'Minute',  range: '0–59'        },
  { label: 'Hour',    range: '0–23'        },
  { label: 'Day',     range: '1–31'        },
  { label: 'Month',   range: '1–12'        },
  { label: 'Weekday', range: '0–6 (Sun=0)' },
]

const SYNTAX_REF = [
  { sym: '*',     desc: 'Any / all values'     },
  { sym: '1-5',   desc: 'Range (1 through 5)'  },
  { sym: '*/5',   desc: 'Step — every 5 units' },
  { sym: '1,3,5', desc: 'Comma-separated list' },
  { sym: '1-5/2', desc: 'Range with step of 2' },
  { sym: '0 / 7', desc: 'Both = Sunday (dow)'  },
]

export default function CronEditorPage() {
  const [expr, setExpr] = useState('*/5 * * * *')
  const parts = expr.trim().split(/\s+/)
  const isValid = parts.length === 5

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cron Expression Editor</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Build and validate cron schedules with instant human-readable preview
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-6">
        {/* Editor card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 block">
              Expression
            </label>
            <input
              value={expr}
              onChange={e => setExpr(e.target.value)}
              className="w-full font-mono text-xl h-14 rounded-lg border border-gray-200 bg-gray-50 tracking-[0.3em] text-center text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
              placeholder="* * * * *"
              spellCheck={false}
            />
          </div>

          {/* Field breakdown */}
          <div className="grid grid-cols-5 gap-2">
            {FIELD_LABELS.map((f, i) => {
              const val = parts[i]
              const active = val && val !== '*'
              return (
                <div key={i} className="text-center space-y-1.5">
                  <div className={cn(
                    'text-sm px-2 py-2 rounded-md font-mono font-semibold border transition-colors',
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                  )}>
                    {val || '?'}
                  </div>
                  <p className="text-[11px] font-medium text-gray-500">{f.label}</p>
                  <p className="text-[9px] text-gray-400">{f.range}</p>
                </div>
              )
            })}
          </div>

          {/* Human-readable preview */}
          {isValid && <CronPreview expr={expr} />}
        </div>

        {/* Presets grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            Common Presets
            <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wide">
              click to apply
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => {
              const isActive = expr.trim() === p.expr
              return (
                <button
                  key={p.expr}
                  onClick={() => setExpr(p.expr)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all text-left',
                    isActive
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm text-gray-700'
                  )}
                >
                  <span className="font-medium">{p.label}</span>
                  <code className={cn(
                    'text-[11px] font-mono px-2 py-0.5 rounded shrink-0',
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {p.expr}
                  </code>
                </button>
              )
            })}
          </div>
        </div>

        {/* Syntax reference */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="size-3.5 text-gray-400" />
            Syntax Reference
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {SYNTAX_REF.map(({ sym, desc }) => (
              <div key={sym} className="flex items-center gap-3">
                <code className="text-xs bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-mono w-16 text-center shrink-0 text-gray-700">
                  {sym}
                </code>
                <span className="text-xs text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
