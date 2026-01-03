// Auth store for landing page and signin
// This will be enhanced with actual backend integration

import { createWithEqualityFn } from 'zustand/traditional'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin' | 'super_admin'
  tenantId?: string
  image?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = createWithEqualityFn<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          // TODO: Replace with actual backend API call
          // For now, this is a stub that will redirect to admin
          // In production, this should call your NestJS backend API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Login failed' }))
            set({ error: error.error || 'Invalid email or password', isLoading: false })
            return { success: false, error: error.error || 'Invalid email or password' }
          }

          const data = await response.json()

          if (data.user && data.token) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            return { success: true }
          } else {
            set({ error: 'Authentication failed', isLoading: false })
            return { success: false, error: 'Authentication failed' }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      logout: async () => {
        set({ user: null, token: null, isAuthenticated: false, error: null })
        // TODO: Call backend logout endpoint
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Export toast from toast-store
export { useToastStore, toast } from './toast-store'
export type { Toast, ToastType } from './toast-store'

// Stub exports for calendar store (needed by CalendarConfiguration)
export const useCalendarStore = () => ({
  config: null,
  tenantSettings: null,
  userConfigs: [],
  loading: false,
  saving: false,
  error: null,
  updateConfig: async () => { },
  updateTenantSettings: async () => { },
  updateUserConfig: async () => { },
  fetchCalendarConfiguration: async (_tenantId?: string, _userId?: string) => { },
  saveTenantSettings: async (_tenantId?: string, _settings?: any) => Promise.resolve(true),
  saveUserConfig: async (_userId?: string, _config?: any) => Promise.resolve(true),
})

export type CalendarConfig = any
export type TenantCalendarSettings = any

// Export chat auth store
export { useChatAuthStore } from './chat-auth-store'

// Export delivery status store
export { useDeliveryStatusStore } from './delivery-status-store'
export type { MessageDeliveryStatus } from './delivery-status-store'
