'use client'

import { useEffect, useRef, useState } from 'react'

function parseValue(raw: string) {
  const match = raw.match(/^([\d,]+)(.*)$/)
  if (!match) return { number: 0, suffix: raw, hasNumber: false }
  return {
    number: parseInt(match[1].replace(/,/g, ''), 10),
    suffix: match[2],
    hasNumber: true,
  }
}

export function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const { number, suffix, hasNumber } = parseValue(value)
    if (!hasNumber || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true

        const duration = 1400
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(`${Math.round(number * eased).toLocaleString()}${suffix}`)
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.disconnect()
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{display}</span>
}
