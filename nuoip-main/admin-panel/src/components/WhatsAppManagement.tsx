'use client'

import { useState, useEffect } from 'react'
import { Phone, MessageSquare, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react'
import { apiClient, isAuthError } from '../lib/api'

interface WhatsAppSession {
  id: string
  phoneNumber: string
  status: 'connected' | 'disconnected' | 'connecting'
  lastActive: string
  messageCount: number
}

export default function WhatsAppManagement() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    connected: 0,
    disconnected: 0,
    totalMessages: 0,
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await apiClient.get('/admin/whatsapp/sessions')
      // setSessions(response.data)
      
      // Mock data for now
      const mockSessions: WhatsAppSession[] = [
        {
          id: '1',
          phoneNumber: '+1234567890',
          status: 'connected',
          lastActive: new Date().toISOString(),
          messageCount: 150,
        },
        {
          id: '2',
          phoneNumber: '+0987654321',
          status: 'disconnected',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          messageCount: 45,
        },
      ]
      setSessions(mockSessions)
      
      // Calculate stats
      setStats({
        total: mockSessions.length,
        connected: mockSessions.filter(s => s.status === 'connected').length,
        disconnected: mockSessions.filter(s => s.status === 'disconnected').length,
        totalMessages: mockSessions.reduce((sum, s) => sum + s.messageCount, 0),
      })
      
      setError('')
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to fetch WhatsApp sessions')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-error" />
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-success-light border-success-dark'
      case 'disconnected':
        return 'bg-error-light border-error-dark'
      default:
        return 'bg-warning-light border-warning-dark'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">WhatsApp Management</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage WhatsApp Business sessions and messaging
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary bg-bg-primary hover:bg-bg-hover focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-error-light border border-error-dark rounded-md p-4">
          <div className="text-sm text-text-primary">{error}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-primary-500">
                <Phone className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Total Sessions</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.total}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-success">
                <CheckCircle className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Connected</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.connected}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-error">
                <XCircle className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Disconnected</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.disconnected}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-bg-primary overflow-hidden shadow-md rounded-lg border border-border-light p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-md bg-info">
                <MessageSquare className="h-6 w-6 text-bg-primary" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-text-secondary truncate">Total Messages</dt>
                <dd className="text-lg font-medium text-text-primary">{stats.totalMessages.toLocaleString()}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-bg-primary shadow-md overflow-hidden sm:rounded-md border border-border-light">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">
            Active Sessions
          </h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No WhatsApp sessions found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-4 ${getStatusColor(session.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(session.status)}
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-text-primary">{session.phoneNumber}</h4>
                        <p className="text-xs text-text-secondary">
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Messages: {session.messageCount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary capitalize">
                        {session.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

