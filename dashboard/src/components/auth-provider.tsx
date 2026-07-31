'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { validateKey } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AuthContextType = {
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function useAuth() {
  return useContext(AuthContext)
}

function LoginScreen({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const valid = await validateKey(key.trim())
      if (valid) {
        onLogin(key.trim())
      } else {
        setError('Invalid API key')
      }
    } catch {
      setError('Could not connect to server')
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
          <p className="text-sm text-muted-foreground mt-1">Sign in with your API key</p>
        </div>
        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  placeholder="ch_..."
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="bg-muted/40 border-border font-mono text-sm"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-medium"
              >
                {loading ? 'Verifying…' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem('cronhive_api_key')
    setApiKey(null)
  }, [])

  useEffect(() => {
    setApiKey(localStorage.getItem('cronhive_api_key'))
    setReady(true)

    const handler = () => logout()
    window.addEventListener('cronhive:unauthorized', handler)
    return () => window.removeEventListener('cronhive:unauthorized', handler)
  }, [logout])

  if (!ready) return null

  if (!apiKey) {
    return (
      <LoginScreen
        onLogin={(key) => {
          localStorage.setItem('cronhive_api_key', key)
          setApiKey(key)
        }}
      />
    )
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  )
}
