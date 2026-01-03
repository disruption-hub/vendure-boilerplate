'use client'

import { useState, useEffect } from 'react'
import { Users, Building2, Database, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import { authenticatedFetch } from '@/features/admin/api/admin-api'

interface SystemStats {
  totalTenants: number
  totalUsers: number
  activeTenants: number
  totalTrademarks: number
  totalMemorySessions: number
  totalKnowledgeNodes: number
  databaseSize: string
  databaseSizeBytes: number
  timestamp: string
}

export default function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/system-stats')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Tenants',
      value: stats?.totalTenants || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Tenants',
      value: stats?.activeTenants || 0,
      icon: Activity,
      color: 'bg-green-500',
    },
    {
      name: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Trademarks',
      value: stats?.totalTrademarks || 0,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
    {
      name: 'Memory Sessions',
      value: stats?.totalMemorySessions || 0,
      icon: Database,
      color: 'bg-indigo-500',
    },
    {
      name: 'Knowledge Nodes',
      value: stats?.totalKnowledgeNodes || 0,
      icon: Database,
      color: 'bg-pink-500',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Platform-wide statistics and metrics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Database Information
          </h3>
          <div className="mt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Database Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{stats?.databaseSize || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'Unknown'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
