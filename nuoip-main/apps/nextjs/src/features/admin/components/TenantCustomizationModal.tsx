'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TenantCustomizationEditor } from '@/components/admin/TenantCustomizationEditor'
import type { Tenant } from '@/features/admin/api/admin-api'
import type { TenantCustomization } from '@/types/tenant-customization'
import { toast } from '@/stores'

// Helper to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) return null
    const parsed = JSON.parse(authStorage)
    return parsed?.state?.token || null
  } catch {
    return null
  }
}

interface TenantCustomizationModalProps {
  isOpen: boolean
  tenant: Tenant | null
  onClose: () => void
}

export function TenantCustomizationModal({
  isOpen,
  tenant,
  onClose,
}: TenantCustomizationModalProps) {
  const [customization, setCustomization] = useState<Partial<TenantCustomization> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomization = useCallback(async () => {
    if (!tenant) return

    try {
      setLoading(true)
      setError(null)

      const token = getAuthToken()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Add cache-busting to ensure we always get the latest customization
      const cacheBuster = `?t=${Date.now()}`
      const response = await fetch(`/api/tenants/${tenant.id}/customization${cacheBuster}`, {
        headers,
        cache: 'no-store', // Prevent browser caching
      })
      
      // Handle 404 gracefully - customization might not exist yet
      if (response.status === 404) {
        setCustomization(null)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch customization')
      }

      const data = await response.json()
      const loadedCustomization = data.customization || null
      console.log('[TenantCustomizationModal] Loaded customization:', JSON.stringify(loadedCustomization, null, 2))
      setCustomization(loadedCustomization)
    } catch (err) {
      console.error('Failed to fetch customization:', err)
      // Don't show error toast for 404 - it's expected if customization doesn't exist
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
        toast.error('Load failed', 'Unable to load customization settings.')
      } else {
        setCustomization(null)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant])

  useEffect(() => {
    if (isOpen && tenant) {
      void fetchCustomization()
    } else {
      setCustomization(null)
      setError(null)
    }
  }, [isOpen, tenant, fetchCustomization])

  const handleSave = async (newCustomization: Partial<TenantCustomization>) => {
    if (!tenant) return

    try {
      setError(null)
      const token = getAuthToken()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/tenants/${tenant.id}/customization`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ customization: newCustomization }),
      })

      if (!response.ok) {
        throw new Error('Failed to save customization')
      }

      toast.success('Customization saved', 'Tenant customization settings updated successfully.')
      // Refetch customization to ensure we have the latest from the server
      await fetchCustomization()
      onClose() // Close modal after successful save
    } catch (err) {
      console.error('Failed to save customization:', err)
      setError(err instanceof Error ? err.message : 'Failed to save customization')
      toast.error('Save failed', 'Unable to save customization settings.')
    }
  }

  if (!tenant) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl p-0"
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-gray-50" style={{ backgroundColor: '#f9fafb', color: 'black' }}>
          <DialogHeader>
            <DialogTitle className="text-black">Customize OTP Login Page</DialogTitle>
            <DialogDescription className="text-black">
              Customize the appearance of the OTP login page for{' '}
              <strong className="text-black">{tenant.displayName || tenant.name}</strong>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div 
          className="flex-1 overflow-y-auto px-6 pb-6 bg-white"
          style={{ maxHeight: 'calc(100vh - 10rem)', backgroundColor: 'white', color: 'black' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-black">Loading customization settings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Customization</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchCustomization}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <TenantCustomizationEditor
              tenantId={tenant.id}
              initialCustomization={customization || undefined}
              onSave={handleSave}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

