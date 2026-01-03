import { getRealtimeSettings } from '@/features/admin/api/admin-api'

export interface SoketiConfig {
  appId: string
  key: string
  secret: string
  cluster?: string
  host: string
  publicHost: string
  port: number
  publicPort: number
  useTLS: boolean
  enabled: boolean
  internalHost?: string
  internalPort?: number
}

/**
 * Fetches Soketi configuration from the database via the backend API.
 * Falls back to environment variables if database config is not available.
 */
export const getSoketiConfig = async (): Promise<SoketiConfig | null> => {
  try {
    // Check if we're on the server and have access to auth token
    const isServer = typeof window === 'undefined'
    const hasAuth = isServer
      ? false
      : (() => {
          try {
            const authStorage = localStorage.getItem('auth-storage')
            return !!authStorage
          } catch {
            return false
          }
        })()

    // Only try database fetch if we have auth (client-side with token)
    if (hasAuth) {
      try {
    // Try to fetch from database first
    const response = await getRealtimeSettings()
    
    if (response.exists && response.config && response.config.enabled) {
      return {
        appId: response.config.appId,
        key: response.config.key,
        secret: response.config.secret,
        cluster: '',
        host: (response.config.internalHost || response.config.publicHost || '').trim(),
        publicHost: (response.config.publicHost || '').trim(),
        port: response.config.internalPort || response.config.publicPort,
        publicPort: response.config.publicPort,
        useTLS: response.config.useTLS,
        enabled: response.config.enabled,
        internalHost: response.config.internalHost ? response.config.internalHost.trim() : undefined,
        internalPort: response.config.internalPort,
      }
    }
      } catch (error) {
        // If database fetch fails (e.g., no auth), fall through to env vars
        const errorMessage = error instanceof Error ? error.message : 'unknown error'
        if (!errorMessage.includes('No token') && !errorMessage.includes('Unauthorized')) {
          console.log('Database config fetch failed, using env vars fallback:', errorMessage)
        }
      }
    }

    // Fallback to environment variables if database config is not available or no auth
    const envAppId = process.env.SOKETI_DEFAULT_APP_ID
    const envKey = process.env.SOKETI_DEFAULT_APP_KEY
    const envSecret = process.env.SOKETI_DEFAULT_APP_SECRET
    const envPublicHost = process.env.SOKETI_PUBLIC_HOST
    const envPublicPort = process.env.SOKETI_PUBLIC_PORT
      ? parseInt(process.env.SOKETI_PUBLIC_PORT, 10)
      : 443
    const envInternalHost = process.env.SOKETI_INTERNAL_HOST
    const envInternalPort = process.env.SOKETI_INTERNAL_PORT
      ? parseInt(process.env.SOKETI_INTERNAL_PORT, 10)
      : 6001

    // Debug logging to see what env vars are available
    if (typeof window === 'undefined') {
      console.log('[getSoketiConfig] Environment variables check:', {
        hasAppId: !!envAppId,
        hasKey: !!envKey,
        hasSecret: !!envSecret,
        hasPublicHost: !!envPublicHost,
        publicHost: envPublicHost,
        publicPort: envPublicPort,
        hasInternalHost: !!envInternalHost,
        internalPort: envInternalPort,
      })
    }

    if (envAppId && envKey && envSecret && envPublicHost) {
      const trimmedPublicHost = (envPublicHost || '').trim()
      const trimmedInternalHost = envInternalHost ? envInternalHost.trim() : undefined
      const config = {
        appId: envAppId,
        key: envKey,
        secret: envSecret,
        cluster: '',
        host: (trimmedInternalHost || trimmedPublicHost).trim(),
        publicHost: trimmedPublicHost,
        port: envInternalPort || envPublicPort,
        publicPort: envPublicPort,
        useTLS: true,
        enabled: true,
        internalHost: trimmedInternalHost,
        internalPort: envInternalPort,
      }
      
      if (typeof window === 'undefined') {
        console.log('[getSoketiConfig] Returning Railway Soketi config from env vars:', {
          appId: config.appId,
          publicHost: config.publicHost,
          publicPort: config.publicPort,
          useTLS: config.useTLS,
          enabled: config.enabled,
        })
      }
      
      return config
    }

    // No configuration available
    if (typeof window === 'undefined') {
      console.warn('[getSoketiConfig] No Soketi configuration found. Missing env vars:', {
        missingAppId: !envAppId,
        missingKey: !envKey,
        missingSecret: !envSecret,
        missingPublicHost: !envPublicHost,
      })
    }
    return null
  } catch (error) {
    // Only log unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'unknown error'
    if (!errorMessage.includes('No token') && !errorMessage.includes('Unauthorized')) {
      console.error('Error fetching Soketi config:', error)
    }

    // Fallback to environment variables on error
    const envAppId = process.env.SOKETI_DEFAULT_APP_ID
    const envKey = process.env.SOKETI_DEFAULT_APP_KEY
    const envSecret = process.env.SOKETI_DEFAULT_APP_SECRET
    const envPublicHost = process.env.SOKETI_PUBLIC_HOST
    const envPublicPort = process.env.SOKETI_PUBLIC_PORT
      ? parseInt(process.env.SOKETI_PUBLIC_PORT, 10)
      : 443
    const envInternalHost = process.env.SOKETI_INTERNAL_HOST
    const envInternalPort = process.env.SOKETI_INTERNAL_PORT
      ? parseInt(process.env.SOKETI_INTERNAL_PORT, 10)
      : 6001

    if (envAppId && envKey && envSecret && envPublicHost) {
      const trimmedPublicHost = (envPublicHost || '').trim()
      const trimmedInternalHost = envInternalHost ? envInternalHost.trim() : undefined
      return {
        appId: envAppId,
        key: envKey,
        secret: envSecret,
        cluster: '',
        host: (trimmedInternalHost || trimmedPublicHost).trim(),
        publicHost: trimmedPublicHost,
        port: envInternalPort || envPublicPort,
        publicPort: envPublicPort,
        useTLS: true,
        enabled: true,
        internalHost: trimmedInternalHost,
        internalPort: envInternalPort,
      }
    }

    return null
  }
}
