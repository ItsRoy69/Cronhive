'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/marketing/logo'
import styles from './navbar.module.css'

const NAV_LINKS = [
  { href: '#features', label: 'Product' },
  { href: '#stats', label: 'Pricing' },
  { href: '#trusted', label: 'Customers' },
  { href: '#contact', label: 'Docs' },
]

export function Navbar() {
  const headerRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(false)
  const closeTimerRef = useRef<number | undefined>(undefined)

  const [compact, setCompact] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    let ticking = false

    function measure() {
      ticking = false
      const isCompact = window.scrollY > 72
      setCompact(isCompact)
      if (!isCompact) {
        pinnedRef.current = false
        setExpanded(false)
      }

      const pill = pillRef.current
      const header = headerRef.current
      if (pill && header) {
        const rect = pill.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        // Sample what's actually painted behind the nav at this point,
        // skipping the nav's own chrome (header/shell/pill/menu), so a
        // dark element sitting under the glass flips it to light text.
        const beneath = document.elementsFromPoint(x, y).find(el => !header.contains(el))
        setIsDark(Boolean(beneath?.closest('[data-nav-theme="dark"]')))
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(measure)
      }
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  function openOnHover() {
    window.clearTimeout(closeTimerRef.current)
    if (compact) setExpanded(true)
  }

  function closeOnLeave() {
    if (pinnedRef.current) return
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => setExpanded(false), 200)
  }

  function toggleClick() {
    setExpanded(prev => {
      const next = !prev
      pinnedRef.current = next
      return next
    })
  }

  function closeMenu() {
    pinnedRef.current = false
    setExpanded(false)
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-50 px-4 pt-4 pb-3">
      <div
        className={`${styles.shell} ${compact ? styles.compact : ''}`}
        onMouseEnter={openOnHover}
        onMouseLeave={closeOnLeave}
      >
        <div
          ref={pillRef}
          className={`${styles.pill} ${compact ? `${styles.compact} ${styles.elevated}` : ''} ${
            isDark ? styles.onDark : ''
          }`}
        >
          <span className={styles.sheen} aria-hidden />
          <div className={styles.row}>
            <Link href="#hero" className={styles.brand} aria-label="CronHive home">
              <Logo light={isDark} />
            </Link>

            <nav className={`${styles.links} ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors duration-300 ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className={styles.actions}>
              <Link
                href="/keys"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 active:translate-y-0"
              >
                Start for free
              </Link>
            </div>

            <button
              type="button"
              className={`${styles.toggle} ${expanded ? styles.expanded : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}
              aria-label={expanded ? 'Close navigation' : 'Open navigation'}
              aria-expanded={expanded}
              onClick={toggleClick}
            >
              <span className={styles.toggleBar} />
              <span className={styles.toggleBar} />
            </button>
          </div>
        </div>

        <div className={`${styles.menu} ${expanded ? styles.open : ''} ${isDark ? styles.onDark : ''}`}>
          <span className={styles.menuLabel}>Explore CronHive</span>
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} className={styles.menuLink} onClick={closeMenu}>
              {link.label}
              <span className={styles.menuLinkArrow}>&rarr;</span>
            </Link>
          ))}
          <div className={styles.menuFoot}>
            <div>
              <span className={styles.menuFootLabel}>Start here</span>
              <Link href="/keys" className={styles.menuFootLink} onClick={closeMenu}>
                Create your free account
              </Link>
            </div>
            <div>
              <span className={styles.menuFootLabel}>Already monitoring?</span>
              <Link href="/keys" className={styles.menuFootLink} onClick={closeMenu}>
                Sign in to CronHive
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
