'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authLogin, authSignup } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🐝</span>
          <h1 className="text-xl font-semibold mt-3">CronHive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-muted/40 border-border"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-muted/40 border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-muted/40 border-border"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-medium"
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </CardContent>
          </Card>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} className="text-amber-400 hover:underline">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-amber-400 hover:underline">Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cronhive_token'))
  const [user, setUser] = useState<User | null>(() => {
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
