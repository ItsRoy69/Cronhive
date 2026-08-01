'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Activity, MessageSquare, Mail, Star } from 'lucide-react'
import { authLogin, authSignup } from '@/lib/api'

type User = { name: string; email: string }

type AuthContextType = {
  user: User
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
  return useContext(AuthContext)
}

function FloatingAlert({
  icon: Icon,
  iconClass,
  text,
  className,
  delay,
}: {
  icon: React.ElementType
  iconClass: string
  text: string
  className?: string
  delay?: string
}) {
  return (
    <div
      className={`animate-float w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 ${className ?? ''}`}
      style={{ animationDelay: delay }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <div className={`flex size-5 items-center justify-center rounded ${iconClass}`}>
          <Icon className="size-3 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-medium text-slate-900">CronHive Alert</span>
      </div>
      <p className="text-xs leading-snug text-slate-600">{text}</p>
    </div>
  )
}

function AuthScreen({ onAuth }: { onAuth: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (mode === 'signup' && !name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = mode === 'signup'
        ? await authSignup(name.trim(), email.trim(), password)
        : await authLogin(email.trim(), password)
      onAuth(res.token, { name: res.name, email: res.email })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1">
        {/* Left panel - branding */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 lg:flex lg:w-1/2">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-blob absolute -top-24 left-1/4 size-96 rounded-full bg-white/10 blur-3xl" />
            <div
              className="animate-blob absolute bottom-0 right-1/4 size-96 rounded-full bg-violet-400/20 blur-3xl"
              style={{ animationDelay: '3s' }}
            />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <Activity className="size-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">CronHive</span>
            </Link>

            <div>
              <h2 className="mb-4 text-3xl leading-snug font-bold text-white">
                Simple monitoring
                <br />
                for every application
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-indigo-100">
                Performance insights and uptime monitoring for cron jobs, websites, APIs and more.
              </p>

              <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-300 text-amber-300" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-white">
                  &quot;Before using CronHive we had an important data backup job fail silently for over a
                  month.&quot;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <span className="text-xs font-semibold text-white">NG</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Natalie Gordon</p>
                    <p className="text-xs text-indigo-200">CEO of Babyst</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-indigo-200">
              <span>50,000+ jobs monitored</span>
              <span>·</span>
              <span>15,000+ alerts/day</span>
            </div>
          </div>

          {/* Floating alert cards */}
          <div className="absolute right-10 top-1/3 hidden xl:block">
            <FloatingAlert icon={MessageSquare} iconClass="bg-[#4A154B]" text={'"Shopify Sync" cron job has failed'} />
            <FloatingAlert
              icon={Mail}
              iconClass="bg-red-500"
              text={'"Storefront API" check is failing'}
              className="ml-8 mt-3"
              delay="1.5s"
            />
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <Link href="/" className="mb-10 flex items-center gap-2 transition-opacity hover:opacity-80 lg:hidden">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Activity className="size-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">CronHive</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'login'
                  ? 'Enter your credentials to access your dashboard'
                  : 'Start monitoring your jobs in minutes'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  {mode === 'login' && (
                    <button type="button" className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full cursor-pointer rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('signup')
                      setError('')
                    }}
                    className="cursor-pointer font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('login')
                      setError('')
                    }}
                    className="cursor-pointer font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('cronhive_token') : null
  )
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('cronhive_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const logout = useCallback(() => {
    localStorage.removeItem('cronhive_token')
    localStorage.removeItem('cronhive_user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('cronhive:unauthorized', handler)
    return () => window.removeEventListener('cronhive:unauthorized', handler)
  }, [logout])

  if (!token || !user) {
    return (
      <AuthScreen
        onAuth={(t, u) => {
          localStorage.setItem('cronhive_token', t)
          localStorage.setItem('cronhive_user', JSON.stringify(u))
          setToken(t)
          setUser(u)
        }}
      />
    )
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
