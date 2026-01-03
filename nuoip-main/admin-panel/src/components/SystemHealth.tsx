'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { apiClient, isAuthError } from '../lib/api'

interface ServiceHealth {
  name: string
  url: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  lastChecked: string
}

export default function SystemHealth() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    void fetchSystemHealth()
  }, [])

  const fetchSystemHealth = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/admin/system-health')
      setServices(response.data?.services ?? [])
      setLastUpdated(response.data?.timestamp ?? '')
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to fetch system health')
      }
      setServices([])
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-error" />
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success-light border-success-dark'
      case 'unhealthy':
        return 'bg-error-light border-error-dark'
      default:
        return 'bg-warning-light border-warning-dark'
    }
  }

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const totalCount = services.length
  const uptimePercentage = totalCount === 0 ? 0 : Math.round((healthyCount / totalCount) * 100)

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Health</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor the health status of all microservices
          </p>
        </div>
        <button
          onClick={fetchSystemHealth}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-error-light border border-error-dark rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-text-primary">Error</h3>
              <div className="mt-2 text-sm text-text-primary">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Summary */}
      <div className="mb-6 bg-bg-primary shadow-md rounded-lg p-6 border border-border-light">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-text-primary">Health Summary</h3>
            <p className="text-sm text-text-secondary">
              {healthyCount} of {totalCount} services are healthy
              {lastUpdated && (
                <span className="ml-2 text-xs text-text-muted">Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>
              )}
            </p>
          </div>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-text-primary">
              {uptimePercentage}%
            </div>
            <div className="ml-2 text-sm text-text-secondary">uptime</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-border-light rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full transition-all duration-300"
              style={{ width: `${uptimePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="grid gap-4">
        {services.map((service, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(service.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(service.status)}
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-text-primary">{service.name}</h4>
                  <p className="text-xs text-text-secondary">{service.url}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary capitalize">
                  {service.status}
                </div>
                {service.responseTime && (
                  <div className="text-xs text-text-secondary">
                    {service.responseTime}ms
                  </div>
                )}
                {service.lastChecked && (
                  <div className="text-xs text-text-secondary">
                    {new Date(service.lastChecked).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-refresh info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Health checks are performed manually. Click refresh to update status.
        </p>
      </div>
    </div>
  )
}
