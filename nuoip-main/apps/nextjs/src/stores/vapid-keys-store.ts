import { createWithEqualityFn } from 'zustand/traditional'
import { toast } from '@/stores/toast-store'
import { authenticatedFetch } from '@/features/admin/api/admin-api'

export interface VapidKeys {
  publicKey: string
  privateKey: string
  subject: string
  createdAt: string
  updatedAt: string
}

interface VapidKeysStore {
  // State
  vapidKeys: VapidKeys | null
  loading: boolean
  error: string | null

  // Actions
  fetchVapidKeys: () => Promise<void>
  generateNewKeys: (email?: string) => Promise<void>
  updateKeys: (keys: Partial<VapidKeys>) => Promise<void>
  testKeys: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useVapidKeysStore = createWithEqualityFn<VapidKeysStore>((set, get) => ({
  // Initial state
  vapidKeys: null,
  loading: false,
  error: null,

  // Fetch VAPID keys from API
  fetchVapidKeys: async () => {
    try {
      set({ loading: true, error: null })

      const response = await authenticatedFetch('/api/admin/system/vapid')
      const data = await response.json()

      if (data.success && data.hasKeys) {
        set({
          vapidKeys: {
            publicKey: data.publicKey,
            privateKey: '', // Don't expose private key
            subject: data.subject,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          }
        })
      } else {
        set({ vapidKeys: null })
      }
    } catch {
      const errorMessage = 'Failed to fetch VAPID keys'
      set({ error: errorMessage })
      toast.error('Fetch Error', errorMessage)
    } finally {
      set({ loading: false })
    }
  },

  // Generate new VAPID keys
  generateNewKeys: async (email?: string) => {
    try {
      set({ loading: true, error: null })

      const response = await authenticatedFetch('/api/admin/system/vapid', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('VAPID Keys Generated', data.message)
        await get().fetchVapidKeys()
      } else {
        const errorMessage = data.error || 'Failed to generate keys'
        set({ error: errorMessage })
        toast.error('Generation Error', errorMessage)
      }
    } catch {
      const errorMessage = 'Failed to generate VAPID keys'
      set({ error: errorMessage })
      toast.error('Generation Error', errorMessage)
    } finally {
      set({ loading: false })
    }
  },

  // Update VAPID keys manually
  updateKeys: async (keys: Partial<VapidKeys>) => {
    try {
      set({ loading: true, error: null })

      const response = await authenticatedFetch('/api/admin/system/vapid', {
        method: 'PUT',
        body: JSON.stringify(keys)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('VAPID Keys Updated', data.message)
        await get().fetchVapidKeys()
      } else {
        const errorMessage = data.error || 'Failed to update keys'
        set({ error: errorMessage })
        toast.error('Update Error', errorMessage)
      }
    } catch {
      const errorMessage = 'Failed to update VAPID keys'
      set({ error: errorMessage })
      toast.error('Update Error', errorMessage)
    } finally {
      set({ loading: false })
    }
  },

  // Test VAPID keys
  testKeys: async () => {
    try {
      set({ loading: true, error: null })

      const response = await authenticatedFetch('/api/admin/system/vapid', {
        method: 'PATCH'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('VAPID Keys Valid', data.message)
      } else {
        const errorMessage = data.message || 'VAPID keys test failed'
        set({ error: errorMessage })
        toast.error('Test Failed', errorMessage)
      }
    } catch {
      const errorMessage = 'Failed to test VAPID keys'
      set({ error: errorMessage })
      toast.error('Test Error', errorMessage)
    } finally {
      set({ loading: false })
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null })
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ loading })
  }
}))

// Convenience functions
export const vapidKeysActions = {
  copyToClipboard: async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied!', `${type} key copied to clipboard`)
    } catch {
      toast.error('Copy Failed', 'Failed to copy to clipboard')
    }
  },

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validatePublicKey: (key: string): boolean => {
    return key.startsWith('B') && key.length === 87
  },

  validatePrivateKey: (key: string): boolean => {
    return key.startsWith('O') && key.length === 43
  }
}
