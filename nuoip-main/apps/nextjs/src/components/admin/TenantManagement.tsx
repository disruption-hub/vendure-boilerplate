'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  domain: string | null
  isActive: boolean
  settings: any
  userCount: number
  trademarkCount: number
  memorySessionCount: number
  createdAt: string
  updatedAt: string
}

interface CreateTenantData {
  name: string
  domain: string
  settings: {
    features: string[]
    limits: { maxUsers: number; maxTrademarks: number }
    branding: { primaryColor: string; logoUrl: string | null }
  }
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [createData, setCreateData] = useState<CreateTenantData>({
    name: '',
    domain: '',
    settings: {
      features: ['search', 'analytics'],
      limits: { maxUsers: 100, maxTrademarks: 10000 },
      branding: { primaryColor: '#3b82f6', logoUrl: '/flowbot-logo.svg' }
    }
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTenants(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Get auth token from localStorage
      const authStorage = localStorage.getItem('auth-storage')
      let token = null
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          token = parsed?.state?.token || null
        } catch (e) {
          console.error('Failed to parse auth storage:', e)
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers,
        body: JSON.stringify(createData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setShowCreateModal(false)
      setCreateData({
        name: '',
        domain: '',
        settings: {
          features: ['search', 'analytics'],
          limits: { maxUsers: 100, maxTrademarks: 10000 },
          branding: { primaryColor: '#3b82f6', logoUrl: '/flowbot-logo.svg' }
        }
      })
      fetchTenants()
    } catch (err: any) {
      setError(err.message || 'Failed to create tenant')
    }
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to deactivate this tenant?')) return

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      fetchTenants()
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant')
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
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tenants and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tenant.isActive ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        tenant.isActive ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {tenant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                      {!tenant.isActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{tenant.domain || 'No domain'}</p>
                    <div className="flex space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        <Users className="inline h-3 w-3 mr-1" />
                        {tenant.userCount} users
                      </span>
                      <span className="text-xs text-gray-500">
                        {tenant.trademarkCount} trademarks
                      </span>
                      <span className="text-xs text-gray-500">
                        {tenant.memorySessionCount} sessions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setShowEditModal(true)
                    }}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tenant</h3>
              <form onSubmit={handleCreateTenant}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={createData.domain}
                    onChange={(e) => setCreateData({ ...createData, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={createData.settings.limits.maxUsers}
                    onChange={(e) => setCreateData({
                      ...createData,
                      settings: {
                        ...createData.settings,
                        limits: { ...createData.settings.limits, maxUsers: parseInt(e.target.value) }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
