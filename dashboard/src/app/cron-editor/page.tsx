'use client'

import { useState } from 'react'
import { CronPreview } from '@/components/cron-preview'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Terminal className="size-4 text-amber-500" />
          <h1 className="text-xl font-semibold">Cron Expression Editor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Build and validate cron schedules with instant human-readable preview
        </p>
      </div>

      {/* Editor card */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 block">
              Expression
            </label>
            <Input
              value={expr}
              onChange={e => setExpr(e.target.value)}
              className="font-mono text-xl h-14 bg-muted/40 border-border tracking-[0.3em] text-center"
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
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  )}>
                    {val || '?'}
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground">{f.label}</p>
                  <p className="text-[9px] text-muted-foreground/50">{f.range}</p>
                </div>
              )
            })}
          </div>

          {/* Human-readable preview */}
          {isValid && <CronPreview expr={expr} />}
        </CardContent>
      </Card>

      {/* Presets grid */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Common Presets
          <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wide">
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
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-border hover:border-border/80 hover:bg-white/[0.03] text-foreground'
                )}
              >
                <span className="font-medium">{p.label}</span>
                <code className={cn(
                  'text-[11px] font-mono px-2 py-0.5 rounded shrink-0',
                  isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'
                )}>
                  {p.expr}
                </code>
              </button>
            )
          })}
        </div>
      </div>

      {/* Syntax reference */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="size-3.5 text-muted-foreground" />
            Syntax Reference
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {SYNTAX_REF.map(({ sym, desc }) => (
              <div key={sym} className="flex items-center gap-3">
                <code className="text-xs bg-muted/60 px-2.5 py-1 rounded border border-border font-mono w-16 text-center shrink-0">
                  {sym}
                </code>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
