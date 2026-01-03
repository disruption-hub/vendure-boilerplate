'use client'

import { useState, useEffect } from 'react'
import { Phone, CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Square } from 'lucide-react'
import { authenticatedFetch } from '@/features/admin/api/admin-api'

interface WhatsAppSession {
  id: string
  sessionId: string
  tenantId: string
  name: string | null
  phoneNumber: string | null
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_REQUIRED' | 'ERROR'
  isActive: boolean
  browserActive: boolean
  lastSync: string
  lastConnected: string | null
  errorMessage: string | null
}

export default function WhatsAppManagement() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/whatsapp')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSessions(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch WhatsApp sessions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'CONNECTING':
        return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
      case 'DISCONNECTED':
        return <XCircle className="h-5 w-5 text-gray-500" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-100 text-green-800'
      case 'CONNECTING':
        return 'bg-yellow-100 text-yellow-800'
      case 'DISCONNECTED':
        return 'bg-gray-100 text-gray-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
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
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage WhatsApp Business sessions and connections
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              No WhatsApp sessions configured
            </li>
          ) : (
            sessions.map((session) => (
              <li key={session.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getStatusIcon(session.status)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {session.name || `Session ${session.sessionId}`}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {session.phoneNumber ? `+${session.phoneNumber}` : 'No phone number'}
                      </p>
                      <div className="flex space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          Last sync: {new Date(session.lastSync).toLocaleString()}
                        </span>
                        {session.lastConnected && (
                          <span className="text-xs text-gray-500">
                            Last connected: {new Date(session.lastConnected).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {session.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{session.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.status === 'DISCONNECTED' && (
                      <button className="text-green-600 hover:text-green-900">
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {session.status === 'CONNECTED' && (
                      <button className="text-red-600 hover:text-red-900">
                        <Square className="h-4 w-4" />
                      </button>
                    )}
                    <button className="text-primary-600 hover:text-primary-900">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Session Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'CONNECTED').length}
              </div>
              <div className="text-sm text-gray-500">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'CONNECTING').length}
              </div>
              <div className="text-sm text-gray-500">Connecting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'DISCONNECTED').length}
              </div>
              <div className="text-sm text-gray-500">Disconnected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => s.status === 'ERROR').length}
              </div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
