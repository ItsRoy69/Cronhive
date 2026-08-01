'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
    <div className="min-h-screen flex bg-white">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-semibold text-white">CronHive</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Simple monitoring<br />for every application
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
              Performance insights and uptime monitoring for cron jobs, websites, APIs and more.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="size-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xs font-semibold text-white">NG</span>
              </div>
              <div>
                <p className="text-sm text-white font-medium">&quot;Before using CronHive we had an important data backup job fail silently for over a month.&quot;</p>
                <p className="text-xs text-indigo-300 mt-1">Natalie Gordon · CEO of Babyst</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-indigo-300">
            <span>50,000+ jobs monitored</span>
            <span>·</span>
            <span>15,000+ alerts/day</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="size-7 rounded bg-amber-500 flex items-center justify-center">
              <span className="text-sm font-bold text-black">C</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">CronHive</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Start monitoring your jobs in minutes'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => { setMode('signup'); setError('') }} className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Sign in</button>
              </>
            )}
          </p>
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
