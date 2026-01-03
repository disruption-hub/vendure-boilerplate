'use client'

import { useEffect, useState } from 'react'
import LoginForm from '../components/LoginForm'
import Dashboard from '../components/Dashboard'
import {
  addSessionExpiredListener,
  apiClient,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '../lib/api'

interface SessionState {
  token: string | null
  role: string | null
}

export default function Home() {
  const [session, setSession] = useState<SessionState>({ token: null, role: null })
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    const bootstrapSession = async () => {
      const token = getAdminToken()
      if (!token) {
        if (!cancelled) {
          setBootstrapping(false)
        }
        return
      }

      try {
        const response = await apiClient.get('/auth/me')
        if (!cancelled) {
          setSession({ token, role: response.data?.role ?? null })
        }
      } catch (error) {
        clearAdminToken()
        if (!cancelled) {
          setSession({ token: null, role: null })
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false)
        }
      }
    }

    const removeListener = addSessionExpiredListener(() => {
      setSession({ token: null, role: null })
    })

    void bootstrapSession()

    return () => {
      cancelled = true
      removeListener()
    }
  }, [])

  const handleLogin = (token: string, role: string) => {
    setAdminToken(token)
    setSession({ token, role })
  }

  const handleLogout = () => {
    clearAdminToken()
    setSession({ token: null, role: null })
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full border-b-2 border-primary-600 animate-spin" />
          <p className="text-sm text-text-secondary">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session.token) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <Dashboard onLogout={handleLogout} />
}
