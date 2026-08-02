'use client'

import { useMemo } from 'react'
import { Clock, CalendarClock } from 'lucide-react'

// ─── Field matching ───────────────────────────────────────────────────────────

function matchField(field: string, val: number, min: number, max: number): boolean {
  if (field === '*') return true
  for (const part of field.split(',')) {
    if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2))
      if (!isNaN(step)) for (let v = min; v <= max; v += step) if (v === val) return true
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      if (!isNaN(a) && !isNaN(b) && val >= a && val <= b) return true
    } else {
      const n = parseInt(part)
      if (!isNaN(n) && (n === val || (n === 7 && val === 0))) return true
    }
  }
  return false
}

function matchesParts(parts: string[], d: Date): boolean {
  const [minF, hourF, domF, monF, dowF] = parts
  return (
    matchField(minF,  d.getMinutes(),    0, 59) &&
    matchField(hourF, d.getHours(),      0, 23) &&
    matchField(domF,  d.getDate(),       1, 31) &&
    matchField(monF,  d.getMonth() + 1, 1, 12) &&
    matchField(dowF,  d.getDay(),        0,  6)
  )
}

// ─── Next run computation ─────────────────────────────────────────────────────

export function getNextRuns(expr: string, count = 5): Date[] {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return []
  const results: Date[] = []
  const start = new Date()
  start.setSeconds(0, 0)
  start.setMinutes(start.getMinutes() + 1)
  const MAX = 60 * 24 * 366
  for (let i = 0; i < MAX && results.length < count; i++) {
    const d = new Date(start.getTime() + i * 60_000)
    if (matchesParts(parts, d)) results.push(d)
  }
  return results
}

// ─── Human-readable description ───────────────────────────────────────────────

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

function fmt12(h: number, m: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function nameList(field: string, names: string[]): string {
  return field.split(',').map(p => {
    if (p.includes('-')) {
      const [a, b] = p.split('-').map(Number)
      return `${names[a] ?? a} through ${names[b] ?? b}`
    }
    const n = parseInt(p)
    return isNaN(n) ? p : (names[n] ?? p)
  }).join(', ')
}

export function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Invalid expression'
  const [minF, hourF, domF, monF, dowF] = parts

  const minStep  = minF.startsWith('*/')  ? parseInt(minF.slice(2))  : null
  const hourStep = hourF.startsWith('*/') ? parseInt(hourF.slice(2)) : null
  const minExact  = /^\d+$/.test(minF)  ? parseInt(minF)  : null
  const hourExact = /^\d+$/.test(hourF) ? parseInt(hourF) : null

  let timePart: string
  if (minF === '*' && hourF === '*') {
    timePart = 'every minute'
  } else if (minStep !== null && hourF === '*') {
    timePart = minStep === 1 ? 'every minute' : `every ${minStep} minutes`
  } else if (hourStep !== null && minExact === 0) {
    timePart = hourStep === 1 ? 'every hour' : `every ${hourStep} hours`
  } else if (hourStep !== null && minExact !== null) {
    timePart = `every ${hourStep} hours at :${minExact.toString().padStart(2, '0')}`
  } else if (hourF === '*' && minExact !== null) {
    timePart = `every hour at :${minExact.toString().padStart(2, '0')}`
  } else if (hourExact !== null && minExact !== null) {
    if (hourExact === 0 && minExact === 0) timePart = 'at midnight'
    else if (hourExact === 12 && minExact === 0) timePart = 'at noon'
    else timePart = `at ${fmt12(hourExact, minExact)}`
  } else {
    timePart = `at ${hourF}:${minF}`
  }

  const when: string[] = []
  if (dowF !== '*') when.push(nameList(dowF, WEEKDAYS))
  if (domF !== '*') {
    const n = parseInt(domF)
    when.push(!isNaN(n) ? `on the ${ordinal(n)}` : `on day ${domF}`)
  }
  if (monF !== '*') {
    const n = parseInt(monF)
    when.push(`in ${!isNaN(n) ? (MONTHS[n - 1] ?? monF) : nameList(monF, MONTHS)}`)
  }

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (when.length === 0) {
    if (timePart === 'every minute') return 'Every minute'
    if (timePart === 'every hour') return 'Every hour'
    return cap(`${timePart}, every day`)
  }
  return cap(`${timePart}, ${when.join(', ')}`)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  expr: string
  className?: string
}

export function CronPreview({ expr, className }: Props) {
  const { description, nextRuns } = useMemo(() => {
    if (!expr.trim() || expr.trim().split(/\s+/).length !== 5) {
      return { description: null, nextRuns: [] }
    }
    try {
      return { description: describeCron(expr), nextRuns: getNextRuns(expr, 5) }
    } catch {
      return { description: 'Parse error', nextRuns: [] }
    }
  }, [expr])

  if (!description) return null

  return (
    <div className={`rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2.5 ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-indigo-500 shrink-0" />
        <span className="text-xs font-medium text-indigo-700">{description}</span>
      </div>
      {nextRuns.length > 0 && (
        <div className="space-y-1 pl-5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
            <CalendarClock className="size-2.5" /> Next runs
          </p>
          {nextRuns.map((d, i) => (
            <p key={i} className="text-[11px] text-gray-500">
              <span className="text-gray-300 mr-2 tabular-nums">{i + 1}.</span>
              {d.toLocaleString()}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
