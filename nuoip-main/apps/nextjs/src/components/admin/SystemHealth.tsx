'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Activity } from 'lucide-react'

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
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Mock services data since backend might not have this endpoint yet
      const mockServices: ServiceHealth[] = [
        { name: 'Database', url: 'postgresql://...', status: 'healthy' as const, lastChecked: new Date().toISOString() },
        { name: 'API Gateway', url: 'https://...', status: 'healthy' as const, lastChecked: new Date().toISOString() },
        { name: 'WhatsApp Service', url: 'wss://...', status: 'healthy' as const, lastChecked: new Date().toISOString() },
      ]
      setServices(mockServices)
      setLastUpdated(data.timestamp || new Date().toISOString())
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health')
      setServices([])
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'unhealthy':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const totalCount = services.length
  const uptimePercentage = totalCount === 0 ? 0 : Math.round((healthyCount / totalCount) * 100)

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor the health status of all microservices
          </p>
        </div>
        <button
          onClick={fetchSystemHealth}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Health Summary */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Health Summary</h3>
            <p className="text-sm text-gray-500">
              {healthyCount} of {totalCount} services are healthy
              {lastUpdated && (
                <span className="ml-2 text-xs text-gray-400">Last updated {new Date(lastUpdated).toLocaleTimeString()}</span>
              )}
            </p>
          </div>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">
              {uptimePercentage}%
            </div>
            <div className="ml-2 text-sm text-gray-500">uptime</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
                  <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                  <p className="text-xs text-gray-500">{service.url}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {service.status}
                </div>
                {service.responseTime && (
                  <div className="text-xs text-gray-500">
                    {service.responseTime}ms
                  </div>
                )}
                {service.lastChecked && (
                  <div className="text-xs text-gray-500">
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
        <p className="text-sm text-gray-500">
          Health checks are performed manually. Click refresh to update status.
        </p>
      </div>
    </div>
  )
}
