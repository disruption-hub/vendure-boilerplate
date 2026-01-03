'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { apiClient, clearAdminToken } from '../lib/api'

interface LoginFormProps {
  onLogin: (token: string, role: string) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [capsLock, setCapsLock] = useState(false)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      setCapsLock(event.getModifierState?.('CapsLock') ?? false)
    }

    window.addEventListener('keyup', handler)
    window.addEventListener('keydown', handler)

    return () => {
      window.removeEventListener('keyup', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiClient.post('/auth/admin/login', {
        email,
        password,
      })

      const token = response.data?.token
      const role = response.data?.user?.role

      if (!token) {
        setError('Login response missing token')
        return
      }

      if (role !== 'super_admin') {
        setError('Access denied. Super admin privileges required.')
        clearAdminToken()
        return
      }

      onLogin(token, role)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      clearAdminToken()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            IPNUO Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Sign in to your super admin account
          </p>
        </div>
        {capsLock && (
          <div className="rounded-md bg-warning-light p-3 border border-warning-dark text-sm text-text-primary">
            Caps Lock is on
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-icon-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-border placeholder-text-muted text-text-primary rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-border-focus focus:z-10 sm:text-sm bg-bg-primary"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-icon-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-10 py-3 border border-border placeholder-text-muted text-text-primary rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-border-focus focus:z-10 sm:text-sm bg-bg-primary"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-icon-primary hover:text-icon-secondary hover:bg-bg-hover rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-error-light p-4 border border-error-dark">
              <div className="text-sm text-text-primary">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
