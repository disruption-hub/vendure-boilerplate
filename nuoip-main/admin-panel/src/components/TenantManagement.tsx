'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from 'lucide-react'
import { apiClient, isAuthError } from '../lib/api'
import { theme } from '../lib/theme'

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
      branding: { primaryColor: theme.colors.primary[600], logoUrl: '/flowbot-logo.svg' }
    }
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get('/admin/tenants')
      setTenants(response.data)
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to fetch tenants')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/admin/tenants', createData)
      setShowCreateModal(false)
      setCreateData({
        name: '',
        domain: '',
        settings: {
          features: ['search', 'analytics'],
          limits: { maxUsers: 100, maxTrademarks: 10000 },
          branding: { primaryColor: theme.colors.primary[600], logoUrl: '/flowbot-logo.svg' }
        }
      })
      fetchTenants()
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to create tenant')
      }
    }
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to deactivate this tenant?')) return
    
    try {
      await apiClient.delete(`/admin/tenants/${tenantId}`)
      fetchTenants()
    } catch (err: any) {
      if (isAuthError(err)) {
        setError('Session expired. Please sign in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to delete tenant')
      }
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
          <h1 className="text-2xl font-bold text-text-primary">Tenant Management</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage tenants and their configurations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-bg-primary bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Tenant
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-error-light border border-error-dark rounded-md p-4">
          <div className="text-sm text-text-primary">{error}</div>
        </div>
      )}

      <div className="bg-bg-primary shadow-md overflow-hidden sm:rounded-md border border-border-light">
        <ul className="divide-y divide-border-light">
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tenant.isActive ? 'bg-success-light' : 'bg-error-light'
                    }`}>
                      <span className={`text-sm font-medium text-text-primary`}>
                        {tenant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-text-primary">{tenant.name}</p>
                      {!tenant.isActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-light text-text-primary border border-error-dark">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{tenant.domain || 'No domain'}</p>
                    <div className="flex space-x-4 mt-1">
                      <span className="text-xs text-text-secondary">
                        <Users className="inline h-3 w-3 mr-1" />
                        {tenant.userCount} users
                      </span>
                      <span className="text-xs text-text-secondary">
                        {tenant.trademarkCount} trademarks
                      </span>
                      <span className="text-xs text-text-secondary">
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
                    className="p-2 rounded-md text-primary-600 hover:text-primary-800 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    aria-label="Edit tenant"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id)}
                    className="p-2 rounded-md text-error hover:text-error-dark hover:bg-error-light focus:outline-none focus:ring-2 focus:ring-error transition-colors"
                    aria-label="Delete tenant"
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
        <div className="fixed inset-0 bg-text-primary bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border-light w-96 shadow-xl rounded-md bg-bg-primary">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-text-primary mb-4">Create New Tenant</h3>
              <form onSubmit={handleCreateTenant}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary-500 focus:border-border-focus text-text-primary bg-bg-primary"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={createData.domain}
                    onChange={(e) => setCreateData({ ...createData, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary-500 focus:border-border-focus text-text-primary bg-bg-primary"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
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
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-primary-500 focus:border-border-focus text-text-primary bg-bg-primary"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-tertiary hover:bg-bg-active rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-bg-primary bg-primary-600 hover:bg-primary-700 rounded-md transition-colors shadow-md"
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
