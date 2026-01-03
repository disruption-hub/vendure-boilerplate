'use client'

import { createWithEqualityFn } from 'zustand/traditional'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from './toast-store'
import {
  requestOtp as requestOtpApi,
  verifyOtp as verifyOtpApi,
  syncSession as syncSessionApi,
  loadSession as loadSessionApi,
  fetchProfile as fetchProfileApi,
  updateProfile as updateProfileApi,
  revokeSession as revokeSessionApi,
} from '@/modules/chatbot/client/chat-auth-client'
import { prepareCountryCodeForRequest, sanitizeCountryCode } from '@/lib/utils/phone'
import type {
  ChatAuthStatus,
  RequestOtpInput,
  ChatAuthProfileInput,
} from '@/modules/chatbot/domain/auth'

interface ChatAuthState {
  status: ChatAuthStatus
  sessionToken: string | null
  sessionId: string | null
  userId: string | null
  linkedUserId: string | null
  tenantId: string | null
  normalizedPhone: string | null
  verificationId: string | null
  expiresAt: string | null
  lastRequestedAt: number | null
  lastPhoneInput: string | null
  lastCountryCode: string | null
  lastTenantId: string | null
  error: string | null
  isHydrated: boolean
  displayName: string | null
  email: string | null
  profileComplete: boolean
  profileSaving: boolean

  requestOtp: (options: RequestOtpInput) => Promise<boolean>
  verifyOtp: (code: string) => Promise<boolean>
  syncSession: (options: RequestOtpInput) => Promise<boolean>
  loadSession: () => Promise<boolean>
  fetchProfile: () => Promise<boolean>
  saveProfile: (input: ChatAuthProfileInput) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
  setHydrated: (value: boolean) => void
  normalizeCountryCode: () => void
}

const STORAGE_KEY = 'chat-auth-storage'

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
} as Storage

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const useChatAuthStore = createWithEqualityFn<ChatAuthState>()(
  persist(
    (set, get) => ({
      status: 'unauthenticated',
      sessionToken: null,
      sessionId: null,
      userId: null,
      linkedUserId: null,
      tenantId: null,
      normalizedPhone: null,
      verificationId: null,
      expiresAt: null,
      lastRequestedAt: null,
      lastPhoneInput: null,
      lastCountryCode: null,
      lastTenantId: null,
      error: null,
      isHydrated: false,
      displayName: null,
      email: null,
      profileComplete: false,
      profileSaving: false,

      setHydrated: (value: boolean) =>
        set(prev => {
          // When hydrating with a session token, determine the correct status
          const nextStatus: ChatAuthStatus = value
            ? prev.sessionToken
              ? prev.profileComplete
                ? 'authenticated'
                : 'profile_pending' // Changed from 'loading' to 'profile_pending'
              : 'unauthenticated'
            : 'loading'
          if (prev.isHydrated === value && prev.status === nextStatus) {
            return prev
          }

          console.log('[ChatAuthStore] Hydration complete:', {
            hasToken: !!prev.sessionToken,
            profileComplete: prev.profileComplete,
            status: nextStatus,
            lastTenantId: prev.lastTenantId,
          })

          return {
            ...prev,
            isHydrated: value,
            status: nextStatus,
          }
        }),

      clearError: () =>
        set(prev => {
          if (prev.error == null) {
            return prev
          }
          return {
            ...prev,
            error: null,
          }
        }),

      normalizeCountryCode: () =>
        set(prev => {
          const sanitized = sanitizeCountryCode(prev.lastCountryCode)
          if (sanitized === prev.lastCountryCode) {
            return prev
          }
          return {
            ...prev,
            lastCountryCode: sanitized,
          }
        }),

      requestOtp: async ({ phone, countryCode, tenantId, host, language = 'es' }) => {
        if (!phone.trim()) {
          set({ error: 'Phone number is required', status: 'unauthenticated' })
          return false
        }

        try {
          set({ status: 'loading', error: null })
          const normalizedCountryCode = countryCode ? prepareCountryCodeForRequest(countryCode) : undefined
          const result = await requestOtpApi({
            phone,
            countryCode: normalizedCountryCode,
            tenantId,
            host,
            language,
          })

          const resolvedCountryCode = sanitizeCountryCode(result.countryCode ?? normalizedCountryCode ?? null)

          set({
            status: 'otp_requested',
            verificationId: result.verificationId,
            normalizedPhone: result.normalizedPhone,
            lastRequestedAt: Date.now(),
            lastPhoneInput: result.normalizedPhone,
            lastCountryCode: resolvedCountryCode,
            expiresAt: result.expiresAt,
            profileComplete: false,
            displayName: null,
            email: null,
            tenantId: tenantId ?? null,
            lastTenantId: tenantId ?? null,
          })

          toast.success('Verification code sent', 'We sent a verification code via SMS.')
          return true
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Unable to request verification code'
          const code = (error as any)?.code
          set({
            status: 'unauthenticated',
            error: message,
            verificationId: null,
            tenantId: null,
          })
          if (code === 'ACCESS_DENIED') {
            toast.error('Acceso restringido', message)
            return false
          }
          toast.error('OTP request failed', message)
          return false
        }
      },

      verifyOtp: async (code: string) => {
        const { verificationId } = get()
        if (!verificationId) {
          set({ error: 'No verification in progress' })
          toast.error('Verification failed', 'No active verification request found.')
          return false
        }

        try {
          set({ status: 'verifying', error: null })
          const result = await verifyOtpApi(verificationId, code)
          const profileComplete = Boolean(result.user.profileComplete)

          set({
            status: profileComplete ? 'authenticated' : 'profile_pending',
            sessionToken: result.session.token,
            sessionId: result.session.sessionId,
            userId: result.user.id,
            linkedUserId: result.user.linkedUserId ?? null,
            tenantId: result.user.tenantId ?? null,
            lastTenantId: result.user.tenantId ?? null,
            normalizedPhone: result.user.normalizedPhone,
            expiresAt: result.session.expiresAt,
            verificationId: null,
            error: null,
            displayName: result.user.displayName ?? null,
            email: result.user.email ?? null,
            profileComplete,
            lastPhoneInput: result.user.phone ?? result.user.normalizedPhone,
            lastCountryCode: sanitizeCountryCode(result.user.countryCode ?? null),
          })

          if (profileComplete) {
            toast.success('Phone verified', 'You are now authenticated in FlowBot.')
          } else {
            toast.info('Phone verified', 'Completa tu perfil para continuar.')
          }

          console.log('[ChatAuthStore] OTP verified successfully:', {
            profileComplete,
            newStatus: profileComplete ? 'authenticated' : 'profile_pending',
            hasToken: !!result.session.token,
            hasTenantId: !!result.user.tenantId,
          })

          return profileComplete
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Invalid verification code'
          const code = (error as any)?.code
          if (code === 'ACCESS_DENIED') {
            set({ status: 'unauthenticated', verificationId: null, error: message })
            toast.error('Acceso restringido', message)
          } else {
            set({ status: 'otp_requested', error: message })
            toast.error('Verification failed', message)
          }
          return false
        }
      },

      syncSession: async ({ phone, countryCode, tenantId, host, language = 'es' }) => {
        try {
          console.log('syncSession called with:', { phone, countryCode, tenantId, host, language })
          set({ status: 'loading', error: null })
          const normalizedCountryCode: string | undefined = prepareCountryCodeForRequest(countryCode ?? null)
          const response = await syncSessionApi({
            phone,
            countryCode: normalizedCountryCode,
            tenantId,
            host,
            language,
            sessionToken: get().sessionToken ?? undefined,
          })
          console.log('syncSession API response:', response)

          if (response.success && response.session && response.user) {
            const profileComplete = response.user.profileComplete ?? Boolean(
              (response.user.displayName ?? '').trim() && (response.user.email ?? '').trim(),
            )
            set({
              status: profileComplete ? 'authenticated' : 'profile_pending',
              sessionToken: response.session.token,
              sessionId: response.session.sessionId,
              userId: response.user.id,
              linkedUserId: response.user.linkedUserId ?? null,
              tenantId: response.user.tenantId ?? null,
              normalizedPhone: response.user.normalizedPhone,
              expiresAt: response.session.expiresAt,
              verificationId: null,
              error: null,
              lastPhoneInput: response.user.phone ?? response.user.normalizedPhone ?? phone,
              lastCountryCode: sanitizeCountryCode(
                response.user.countryCode ?? normalizedCountryCode ?? null,
              ),
              displayName: response.user.displayName ?? null,
              email: response.user.email ?? null,
              profileComplete,
              lastTenantId: response.user.tenantId ?? null,
            })

            if (profileComplete) {
              toast.success('Welcome back!', response.message || 'Your session has been restored.')
            } else {
              toast.info('Completa tu perfil', 'Necesitamos tu nombre y correo para continuar.')
            }
            return true
          } else if (response.requiresOtp) {
            // User exists but needs OTP verification
            console.log('requiresOtp case triggered, resetting to unauthenticated')
            set({ status: 'unauthenticated', error: null }) // Reset status for OTP flow
            toast.info('Verification required', response.message || 'Please verify your phone number.')
            return false
          } else if ((response as any).reason === 'access_denied') {
            const message = response.message || 'Tu cuenta no está autorizada para usar el chatbot.'
            set({ status: 'unauthenticated', error: message })
            toast.error('Acceso restringido', message)
            return false
          } else {
            // User not found - they need to register
            console.log('user not found case, resetting to unauthenticated')
            set({ status: 'unauthenticated', error: null }) // Reset status for OTP flow
            toast.info('Registration required', response.message || 'Please register your phone number.')
            return false
          }
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Session synchronization failed'
          set({ status: 'unauthenticated', error: message })
          toast.error('Sync failed', message)
          return false
        }
      },

      loadSession: async () => {
        const token = get().sessionToken
        if (!token) {
          set({ status: 'unauthenticated', sessionId: null, userId: null, expiresAt: null })
          return false
        }

        set({ status: 'loading', error: null })

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await loadSessionApi(token, true)
            const profileComplete = response.user.profileComplete ?? Boolean(
              (response.user.displayName ?? '').trim() && (response.user.email ?? '').trim(),
            )

            set({
              status: profileComplete ? 'authenticated' : 'profile_pending',
              sessionToken: response.session.token,
              sessionId: response.session.sessionId,
              userId: response.user.id,
              linkedUserId: response.user.linkedUserId ?? null,
              tenantId: response.user.tenantId ?? null,
              normalizedPhone: response.user.normalizedPhone,
              expiresAt: response.session.expiresAt,
              error: null,
              displayName: response.user.displayName ?? null,
              email: response.user.email ?? null,
              profileComplete,
              lastPhoneInput: response.user.phone ?? response.user.normalizedPhone,
              lastCountryCode: sanitizeCountryCode(response.user.countryCode ?? null),
              lastTenantId: response.user.tenantId ?? null,
            })

            console.log('[ChatAuthStore] Session loaded successfully:', {
              profileComplete,
              userId: response.user.id,
              tenantId: response.user.tenantId,
              status: profileComplete ? 'authenticated' : 'profile_pending',
            })

            return true
          } catch (error: any) {
            console.error('[ChatAuthStore] Session validation failed:', {
              error,
              message: error instanceof Error ? error.message : 'Unknown error',
              code: (error as any)?.code,
              attempt,
              token: token ? `${token.substring(0, 10)}...` : 'null',
            })
            console.warn('Chat auth session validation failed', error)
            const code = (error as any)?.code
            const message = error instanceof Error ? error.message : 'Session validation failed'

            if (code === 'SESSION_INVALID' && attempt < 2) {
              await sleep(350 * (attempt + 1))
              continue
            }

            if (code === 'ACCESS_DENIED') {
              toast.error('Acceso restringido', message)
            } else {
              toast.error('Sesión no válida', message)
            }

            const { lastPhoneInput, lastCountryCode } = get()
            await get().logout()
            set(prev => ({
              ...prev,
              error: message,
              lastPhoneInput: lastPhoneInput ?? prev.lastPhoneInput,
              lastCountryCode: lastCountryCode ?? prev.lastCountryCode,
              // Preserve lastTenantId if available, otherwise keep current
              lastTenantId: prev.lastTenantId ?? prev.tenantId,
            }))
            return false
          }
        }

        return false
      },

      fetchProfile: async () => {
        const token = get().sessionToken
        if (!token) {
          return false
        }

        try {
          const profile = await fetchProfileApi(token)
          if (!profile) {
            return false
          }

          const completed = Boolean(profile.profileComplete)

          set(prev => ({
            ...prev,
            displayName: profile.displayName,
            email: profile.email,
            profileComplete: completed,
            status: prev.status === 'profile_pending' && completed ? 'authenticated' : prev.status,
            normalizedPhone: profile.phone,
            lastPhoneInput: profile.phone,
            lastCountryCode: sanitizeCountryCode(profile.countryCode ?? prev.lastCountryCode ?? null),
            tenantId: profile.tenantId ?? prev.tenantId ?? null,
            lastTenantId: profile.tenantId ?? prev.tenantId ?? prev.lastTenantId ?? null,
          }))

          return completed
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'Unable to load profile'
          toast.error('Perfil', message)
          return false
        }
      },

      saveProfile: async ({ displayName, email }) => {
        const token = get().sessionToken
        if (!token) {
          toast.error('Perfil', 'Inicia sesión para actualizar tus datos.')
          return false
        }

        try {
          set({ profileSaving: true, error: null })
          const profile = await updateProfileApi(token, { displayName, email })
          const completed = Boolean(profile.profileComplete)

          set(prev => ({
            ...prev,
            profileSaving: false,
            displayName: profile.displayName,
            email: profile.email,
            profileComplete: completed,
            status: completed ? 'authenticated' : prev.status,
            normalizedPhone: profile.phone,
            lastPhoneInput: profile.phone,
            lastCountryCode: sanitizeCountryCode(profile.countryCode ?? prev.lastCountryCode ?? null),
            tenantId: profile.tenantId ?? prev.tenantId ?? null,
            lastTenantId: profile.tenantId ?? prev.tenantId ?? prev.lastTenantId ?? null,
          }))

          toast.success('Perfil actualizado', 'Guardamos tu información correctamente.')
          return completed
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'No se pudo guardar el perfil'
          set(prev => ({ ...prev, profileSaving: false, error: message }))
          toast.error('Error al guardar', message)
          return false
        }
      },

      logout: async () => {
        const token = get().sessionToken
        const currentLastTenantId = get().lastTenantId
        const currentTenantId = get().tenantId

        // Clear state first, but preserve lastTenantId
        set({
          status: 'unauthenticated',
          sessionToken: null,
          sessionId: null,
          userId: null,
          linkedUserId: null,
          tenantId: null,
          expiresAt: null,
          verificationId: null,
          normalizedPhone: null,
          displayName: null,
          email: null,
          profileComplete: false,
          profileSaving: false,
          lastPhoneInput: null,
          lastCountryCode: null,
          // Preserve lastTenantId on logout to maintain context for re-login
          lastTenantId: currentLastTenantId || currentTenantId,
          error: null,
        })

        // Update localStorage to preserve lastTenantId instead of removing entirely
        if (typeof window !== 'undefined') {
          try {
            const preservedTenantId = currentLastTenantId || currentTenantId
            const storageValue = {
              state: {
                lastTenantId: preservedTenantId,
                // Keep minimal state to preserve tenant context
                status: 'unauthenticated',
                sessionToken: null,
                sessionId: null,
                userId: null,
                tenantId: null,
                normalizedPhone: null,
                expiresAt: null,
                displayName: null,
                email: null,
                profileComplete: false,
              },
              version: 0,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageValue))
            console.log('[ChatAuthStore] Logout: localStorage updated, lastTenantId preserved:', preservedTenantId)
          } catch (error) {
            console.warn('[ChatAuthStore] Failed to update localStorage:', error)
          }
        }

        // Try to revoke session on server (non-blocking)
        if (token) {
          try {
            await revokeSessionApi(token)
            console.log('[ChatAuthStore] Logout: Session revoked on server')
          } catch (error) {
            console.warn('[ChatAuthStore] Failed to revoke chat auth session on server:', error)
            // Continue with logout even if server revocation fails
          }
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: state => ({
        sessionToken: state.sessionToken,
        sessionId: state.sessionId,
        userId: state.userId,
        linkedUserId: state.linkedUserId,
        tenantId: state.tenantId,
        normalizedPhone: state.normalizedPhone,
        expiresAt: state.expiresAt,
        displayName: state.displayName,
        email: state.email,
        profileComplete: state.profileComplete,
        lastTenantId: state.lastTenantId,
      }),
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : fallbackStorage)),
      onRehydrateStorage: () => state => {
        console.log('[ChatAuthStore] Rehydrating from storage:', {
          hasState: !!state,
          hasToken: !!state?.sessionToken,
          tenantId: state?.tenantId,
          lastTenantId: state?.lastTenantId,
          profileComplete: state?.profileComplete,
        })
        state?.setHydrated(true)
        state?.clearError()
      },
    },
  ),
)

export type {
  ChatAuthStatus,
  ChatAuthSession,
  ChatAuthUser,
  ChatAuthProfile,
  ChatAuthProfileInput,
  RequestOtpInput,
  VerifyOtpInput,
} from '@/modules/chatbot/domain/auth'
