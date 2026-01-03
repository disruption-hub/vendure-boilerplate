"use client"

import { useCallback, useEffect, useState, useRef } from 'react'
import { useRealtime } from '@/contexts/RealtimeContext'
import { buildWhatsAppChannel } from '@/lib/whatsapp/integration/soketi-emitter'
import { toast, useAuthStore } from '@/stores'

// Helper to make authenticated fetch calls
async function authenticatedFetch(url: string, options: RequestInit = {}, token: string | null = null): Promise<Response> {
  // Try to get token from parameter first, then from localStorage as fallback
  let authToken = token
  if (!authToken && typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        authToken = parsed?.state?.token || null
      }
    } catch (e) {
      console.error('Failed to get auth token from localStorage:', e)
    }
  }
  
  const headers = new Headers(options.headers)
  
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  } else {
    console.warn('[WhatsApp Connection] No auth token available for request:', url)
  }
  
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

type ConnectionPhase = 'disconnected' | 'connecting' | 'connected' | 'qr_required' | 'error'

interface ConnectionState {
  status: ConnectionPhase
  socketStatus?: string | null
  lastDisconnectReason?: string | null
}

const INITIAL_STATE: ConnectionState = {
  status: 'disconnected',
  socketStatus: null,
  lastDisconnectReason: null,
}

function normalizeStatus(value?: string | null): ConnectionPhase {
  if (!value) {
    return 'disconnected'
  }

  const lowered = value.toLowerCase()

  switch (lowered) {
    case 'connected':
    case 'open':
      return 'connected'
    case 'connecting':
    case 'close-pending':
      return 'connecting'
    case 'qr_required':
    case 'qr-required':
    case 'qr':
      return 'qr_required'
    case 'error':
      return 'error'
    default:
      return 'disconnected'
  }
}

function mapConnectionValue(value: string | null | undefined, current: ConnectionPhase): ConnectionPhase {
  if (!value) {
    return current
  }

  const lowered = value.toLowerCase()

  if (lowered === 'open') {
    return 'connected'
  }
  if (lowered === 'close') {
    return 'disconnected'
  }
  if (lowered === 'connecting') {
    return 'connecting'
  }

  return current
}

function extractDisconnectReason(update: any): string | null {
  const lastDisconnect = update?.lastDisconnect
  if (!lastDisconnect) {
    return null
  }

  const error = lastDisconnect.error
  if (!error) {
    return null
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error?.message === 'string' && error.message.length > 0) {
    return error.message
  }

  const payloadMessage = error?.output?.payload?.message
  if (typeof payloadMessage === 'string' && payloadMessage.length > 0) {
    return payloadMessage
  }

  return null
}

export function useWhatsAppConnection(sessionId: string | null | undefined) {
  const { subscribe, isReady } = useRealtime()
  const { token } = useAuthStore()

  const [state, setState] = useState<ConnectionState>(INITIAL_STATE)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Use refs to store callbacks so they don't need to be in dependency arrays
  const applyConnectionUpdateRef = useRef<(update: any) => void>(() => {})
  const lastQrCodeRef = useRef<string | null>(null)
  const qrCodeStableRef = useRef<boolean>(false)

  // Initialize the callback ref
  applyConnectionUpdateRef.current = (update: any) => {
    if (!update || typeof update !== 'object') {
      return
    }

    console.log('🔄 useWhatsAppConnection: applyConnectionUpdate called', {
      sessionId,
      updateKeys: Object.keys(update),
      connection: update.connection,
      status: update.status,
      hasQr: !!update.qr,
      qrLength: update.qr?.length || 0,
      fullUpdate: JSON.stringify(update, null, 2),
    })

    setState((prev) => {
      let nextStatus = prev.status

      if (typeof update.status === 'string') {
        nextStatus = normalizeStatus(update.status)
        console.log('🔄 useWhatsAppConnection: Status from update.status', {
          sessionId,
          updateStatus: update.status,
          normalizedStatus: nextStatus,
        })
      }

      if (typeof update.connection === 'string') {
        const beforeStatus = nextStatus
        nextStatus = mapConnectionValue(update.connection, nextStatus)
        console.log('🔄 useWhatsAppConnection: Status from update.connection', {
          sessionId,
          connection: update.connection,
          beforeStatus,
          afterStatus: nextStatus,
        })
      } else if (typeof update.connectionState?.connection === 'string') {
        const beforeStatus = nextStatus
        nextStatus = mapConnectionValue(update.connectionState.connection, nextStatus)
        console.log('🔄 useWhatsAppConnection: Status from update.connectionState.connection', {
          sessionId,
          connection: update.connectionState.connection,
          beforeStatus,
          afterStatus: nextStatus,
        })
      }

      // Set to qr_required if we have a QR code (unless already connected)
      // This matches the working version behavior - don't prevent setting to qr_required
      // when status is 'connecting' because connection.update events will override it
      if (typeof update.qr === 'string' && update.qr.length > 0 && nextStatus !== 'connected') {
        nextStatus = 'qr_required'
      }

      const socketStatus =
        typeof update.socketStatus === 'string'
          ? update.socketStatus
          : typeof update.connection === 'string'
            ? update.connection
            : prev.socketStatus ?? null

      const lastDisconnectReason = extractDisconnectReason(update) ?? prev.lastDisconnectReason ?? null

      // Clear QR code when connection becomes 'open' or 'connected'
      if (nextStatus === 'connected' || update.connection === 'open') {
        if (prev.status !== 'connected') {
          console.log('✅✅✅ useWhatsAppConnection: Connection established!', {
            sessionId,
            prevStatus: prev.status,
            nextStatus,
            connection: update.connection,
          })
        }
        // Always clear QR when connected, even if status was already connected
        // This handles cases where QR might still be in state
        if (lastQrCodeRef.current) {
          console.log('🧹 Clearing QR code after connection established', { sessionId })
          setQrCode(null)
          lastQrCodeRef.current = null
          qrCodeStableRef.current = false
        }
      }

      return {
        status: nextStatus,
        socketStatus,
        lastDisconnectReason,
      }
    })

    if (typeof update.qr === 'string' && update.qr.length > 0) {
      setQrCode(update.qr)
    }
  }

  // Track subscription to prevent duplicate subscriptions and re-subscription loops
  const subscriptionRef = useRef<(() => void) | null>(null)
  const subscribedChannelRef = useRef<string | null>(null)
  const subscriptionFailureCountRef = useRef<number>(0)
  const lastSubscriptionAttemptRef = useRef<number>(0)
  const subscriptionErrorRef = useRef<boolean>(false)
  const subscriptionSucceededRef = useRef<boolean>(false)
  const isSubscribingRef = useRef<boolean>(false)

  useEffect(() => {
    if (!sessionId || !isReady) {
      if (!isReady) {
        console.log('🔵 useWhatsAppConnection: Waiting for Soketi to be ready', { sessionId })
      }
      if (!sessionId) {
        console.log('🔵 useWhatsAppConnection: No sessionId provided', { isReady })
      }
      // Clean up subscription if sessionId or isReady changes
      if (subscriptionRef.current) {
        console.log('🔵 useWhatsAppConnection: Cleaning up subscription due to missing sessionId or isReady')
        subscriptionRef.current()
        subscriptionRef.current = null
        subscribedChannelRef.current = null
        subscriptionFailureCountRef.current = 0
        subscriptionErrorRef.current = false
        subscriptionSucceededRef.current = false
        isSubscribingRef.current = false
      }
      return
    }

    const channelName = buildWhatsAppChannel(sessionId)
    
    console.log('🔵 useWhatsAppConnection: Setting up WebSocket subscription', {
      sessionId,
      channelName,
      isReady,
      hasExistingSubscription: !!subscriptionRef.current,
      subscribedChannel: subscribedChannelRef.current,
    })
    
    // CRITICAL: Prevent duplicate subscriptions to the same channel
    // Only skip if we have an active subscription AND it succeeded (not in error state)
    // AND we're not currently in the process of subscribing
    if (subscribedChannelRef.current === channelName && 
        subscriptionRef.current && 
        !subscriptionErrorRef.current &&
        subscriptionSucceededRef.current &&
        !isSubscribingRef.current) {
      console.log('🔵 useWhatsAppConnection: Already successfully subscribed to channel, skipping', { 
        sessionId, 
        channelName,
        hasSubscription: !!subscriptionRef.current,
        succeeded: subscriptionSucceededRef.current,
      })
      return // Don't reset success flag - we're keeping the existing subscription
    }

    // Prevent rapid re-subscription attempts (exponential backoff)
    const now = Date.now()
    const timeSinceLastAttempt = now - lastSubscriptionAttemptRef.current
    const backoffDelay = Math.min(1000 * Math.pow(2, subscriptionFailureCountRef.current), 10000) // Max 10 seconds

    if (subscriptionErrorRef.current && timeSinceLastAttempt < backoffDelay && !isSubscribingRef.current) {
      console.log('useWhatsAppConnection: Backing off from re-subscription', {
        sessionId,
        channelName,
        timeSinceLastAttempt,
        backoffDelay,
        failureCount: subscriptionFailureCountRef.current,
      })
      return // Don't reset success flag - we're backing off
    }

    // Clean up previous subscription if channel changed
    if (subscriptionRef.current && subscribedChannelRef.current !== channelName) {
      console.log('useWhatsAppConnection: Channel changed, cleaning up previous subscription', {
        oldChannel: subscribedChannelRef.current,
        newChannel: channelName,
      })
      subscriptionRef.current()
      subscriptionRef.current = null
      subscriptionFailureCountRef.current = 0
      subscriptionErrorRef.current = false
      subscriptionSucceededRef.current = false
      isSubscribingRef.current = false
    }

    // Prevent concurrent subscription attempts
    if (isSubscribingRef.current) {
      console.log('useWhatsAppConnection: Already subscribing, skipping duplicate attempt', {
        sessionId,
        channelName,
      })
      return
    }

    console.log('useWhatsAppConnection: Subscribing to Soketi channel', { 
      sessionId, 
      channelName, 
      isReady,
      failureCount: subscriptionFailureCountRef.current,
      previouslySucceeded: subscriptionSucceededRef.current,
    })

    isSubscribingRef.current = true
    lastSubscriptionAttemptRef.current = now
    // Reset success flag when starting a new subscription attempt (only if we're actually subscribing)
    subscriptionSucceededRef.current = false

    const unsubscribe = subscribe({
      channelName,
      onGenericEvent: (eventName, payload) => {
        console.log('🔵 useWhatsAppConnection: WebSocket event received', {
          sessionId,
          channelName,
          eventName,
          hasPayload: !!payload,
          payloadKeys: payload ? Object.keys(payload) : [],
          payloadType: typeof payload,
        })
        
        // Reset error state on successful event
        if (subscriptionErrorRef.current) {
          subscriptionErrorRef.current = false
          subscriptionFailureCountRef.current = 0
        }
        
        if (eventName === 'connection.update') {
          console.log('🔵🔵🔵 useWhatsAppConnection: connection.update event received', {
            sessionId,
            payload,
            status: payload?.status,
            connection: payload?.connection,
            socketStatus: payload?.socketStatus,
            fullPayload: JSON.stringify(payload, null, 2),
            payloadKeys: payload ? Object.keys(payload) : [],
          })
          
          // Also log directly to console for easier inspection
          console.log('📋📋📋 CONNECTION.UPDATE FULL PAYLOAD:', JSON.stringify(payload, null, 2))
          
          // Use ref to avoid dependency issues
          applyConnectionUpdateRef.current?.(payload)
        } else if (eventName === 'qr.code' || eventName === 'qr_code') {
          console.log('🟢🟢🟢 useWhatsAppConnection: qr.code event received', {
            sessionId,
            eventName,
            hasQr: !!payload?.qr,
            qrLength: payload?.qr?.length || 0,
            payloadKeys: payload ? Object.keys(payload) : [],
            fullPayload: payload,
            timestamp: Date.now(),
          })
          if (payload?.qr && typeof payload.qr === 'string' && payload.qr.length > 0) {
            // Only update QR code if it's different from the last one
            if (payload.qr !== lastQrCodeRef.current) {
              const isFirstQr = lastQrCodeRef.current === null
              console.log('🟢🟢🟢 useWhatsAppConnection: Setting QR code', {
                sessionId,
                qrLength: payload.qr.length,
                isFirstQr,
                qrPreview: payload.qr.substring(0, 50) + '...',
              })
              setQrCode(payload.qr)
              lastQrCodeRef.current = payload.qr
              qrCodeStableRef.current = true
              setState((prev) => ({
                ...prev,
                status: 'qr_required',
              }))

              // Show success toast only on first QR
              if (isFirstQr) {
                toast?.success?.('Código QR recibido - escanéalo con WhatsApp')
              }
            } else {
              console.log('🟡 useWhatsAppConnection: QR code same as last one, skipping update', {
                sessionId,
              })
            }
          } else {
            console.warn('useWhatsAppConnection: qr.code event received but no valid QR in payload', {
              sessionId,
              eventName,
              hasQr: !!payload?.qr,
              qrType: typeof payload?.qr,
              payload,
            })
          }
        } else if (eventName === 'pusher:subscription_error') {
          // Track subscription errors to prevent loops
          subscriptionErrorRef.current = true
          subscriptionFailureCountRef.current += 1
          subscriptionSucceededRef.current = false // Reset success flag on error
          isSubscribingRef.current = false // Allow retry after backoff
          
          // Note: Don't clear refs here - let the backoff logic handle retries
          // The channel has been removed from RealtimeContext, but we keep our refs
          // to track the backoff state. The refs will be cleared on successful re-subscription.
          
          console.error('❌❌❌ useWhatsAppConnection: WebSocket subscription failed', {
            sessionId,
            channelName,
            failureCount: subscriptionFailureCountRef.current,
            error: payload,
            errorType: payload?.type,
            errorStatus: payload?.status,
            errorMessage: payload?.error || payload?.message,
          })
          
          // When WebSocket fails, rely more heavily on polling
          // The backend should store QR codes in metadata for polling fallback
          console.log('🔄 useWhatsAppConnection: WebSocket subscription failed - will rely on polling for QR codes', {
            sessionId,
            pollingInterval: '2s',
          })
        } else if (eventName === 'pusher:subscription_succeeded') {
          // Mark subscription as succeeded and reset error state
          subscriptionSucceededRef.current = true
          subscriptionErrorRef.current = false
          subscriptionFailureCountRef.current = 0
          isSubscribingRef.current = false // Allow future subscriptions if needed
          console.log('✅✅✅ useWhatsAppConnection: WebSocket subscription succeeded - ready to receive QR codes', {
            sessionId,
            channelName,
            timestamp: Date.now(),
          })
          
          // After subscription succeeds, immediately request QR code refresh from backend
          // This ensures we get the latest QR code even if it was broadcast before subscription
          setTimeout(async () => {
            console.log('🟡 useWhatsAppConnection: Subscription succeeded - refreshing status to get QR code', {
              sessionId,
              currentStatus: state.status,
              hasQrCode: !!qrCode,
            })
            // Refresh status to get QR code via polling (fallback)
            await loadStatus()
            
            // Also trigger a test QR to verify WebSocket flow if no QR yet
            if (!qrCode && state.status === 'connecting' && sessionId && token) {
              console.log('🟡 useWhatsAppConnection: No QR after refresh - triggering test QR', {
                sessionId,
              })
              try {
                const response = await authenticatedFetch('/api/whatsapp/test-qr', {
                  method: 'POST',
                  body: JSON.stringify({ sessionId }),
                }, token)
                
                if (response.ok) {
                  console.log('✅ useWhatsAppConnection: Test QR triggered successfully after subscription')
                } else {
                  console.warn('⚠️ useWhatsAppConnection: Failed to trigger test QR after subscription', {
                    status: response.status,
                  })
                }
              } catch (error) {
                console.warn('⚠️ useWhatsAppConnection: Error triggering test QR after subscription', error)
              }
            }
          }, 100) // Small delay to allow any pending broadcasts to arrive first
        }
      },
    })

    // Store subscription info
    subscriptionRef.current = unsubscribe
    subscribedChannelRef.current = channelName

    return () => {
      console.log('useWhatsAppConnection: Unsubscribing from channel', { sessionId, channelName })
      if (subscriptionRef.current) {
        subscriptionRef.current()
        subscriptionRef.current = null
        subscribedChannelRef.current = null
        subscriptionSucceededRef.current = false
        isSubscribingRef.current = false
        // Don't reset failure count on cleanup - let it persist for backoff
      }
    }
  }, [sessionId, isReady, subscribe]) // Removed applyConnectionUpdate from dependencies - using ref instead

  // Note: lastQrCodeRef and qrCodeStableRef are now defined above with applyConnectionUpdateRef

  const loadStatus = useCallback(async () => {
    if (!sessionId) {
      return
    }

    try {
      if (!token) {
        console.warn('[WhatsApp Connection] No auth token available for status check')
        return
      }
      
      const response = await authenticatedFetch(`/api/whatsapp/status?sessionId=${encodeURIComponent(sessionId)}`, { cache: 'no-store' }, token)
      if (!response.ok) {
        return
      }

      const data = await response.json()
      const normalizedStatus = normalizeStatus(data?.status)

      // Support both 'qr' and 'qrCode' fields from backend
      const qrCodeValue = data?.qrCode || data?.qr

      console.log('🟡🟡🟡 useWhatsAppConnection: loadStatus response', {
        sessionId,
        apiStatus: data?.status,
        normalizedStatus,
        socketStatus: data?.socketStatus,
        hasQrCode: !!qrCodeValue,
        qrCodeLength: qrCodeValue?.length || 0,
        isActive: data?.isActive,
        qrField: data?.qr ? 'qr' : data?.qrCode ? 'qrCode' : 'none',
      })

      // Always update state first
      setState((prev) => ({
        ...prev,
        status: normalizedStatus,
        socketStatus: typeof data?.socketStatus === 'string' ? data.socketStatus : null,
        lastDisconnectReason:
          typeof data?.errorMessage === 'string' && data.errorMessage.length > 0 ? data.errorMessage : null,
      }))

      // Handle QR code - only update if different to avoid redundant re-renders
      if (normalizedStatus === 'connected') {
        // Clear QR when connected
        if (lastQrCodeRef.current !== null) {
          setQrCode(null)
          lastQrCodeRef.current = null
          qrCodeStableRef.current = false
        }
      } else {
        // Support both 'qr' and 'qrCode' fields from backend
        const qrCodeValue = data?.qrCode || data?.qr
        if (typeof qrCodeValue === 'string' && qrCodeValue.length > 0) {
          // Only update QR code if it's different from the last one
          if (qrCodeValue !== lastQrCodeRef.current) {
            setQrCode(qrCodeValue)
            lastQrCodeRef.current = qrCodeValue
            // Mark QR as stable after first successful load
            qrCodeStableRef.current = true
          }
        }
        
        // If we have QR but status is connecting, keep it as connecting (QR might be scanned)
        // Only set to qr_required if status is not connecting and we have QR
        // This matches the working version behavior
        if (normalizedStatus === 'connecting' && qrCodeValue) {
          // Keep status as connecting - don't force to qr_required
          // The connection.update event will handle the transition to connected
        } else if (qrCodeValue && normalizedStatus !== 'connecting') {
          setState((prev) => ({
            ...prev,
            status: 'qr_required',
          }))
        }
        
        // If status is CONNECTING but no QR yet, keep polling more frequently
        // This helps when WebSocket subscription fails
        if (normalizedStatus === 'connecting' && !qrCodeValue) {
          // Status will remain 'connecting' - polling will continue
          // If WebSocket subscription failed, poll more aggressively
          const shouldPollFaster = subscriptionErrorRef.current
          console.log('🟡 useWhatsAppConnection: Status is CONNECTING but no QR code yet - will continue polling', {
            sessionId,
            willRetry: true,
            subscriptionFailed: subscriptionErrorRef.current,
            pollingFaster: shouldPollFaster,
          })
        }
      }
    } catch (error) {
      // Only log errors, not every status check
      console.error('useWhatsAppConnection: failed to load status', {
        sessionId,
        error: error instanceof Error ? error.message : 'unknown-error',
      })
    }
  }, [sessionId, token])

         useEffect(() => {
           if (!token) {
             // Don't poll if no token
             return
           }
           
           loadStatus()

           // Smart polling logic:
           // 1. Poll when connecting (waiting for QR) - every 2 seconds
           // 2. Poll when qr_required - every 2 seconds until QR is stable, then every 10 seconds
           // 3. Stop polling when connected
           const shouldPoll = state.status === 'connecting' || state.status === 'qr_required'

           if (shouldPoll) {
             // Use longer interval once QR is stable (to check for connection status changes)
             // Poll more frequently if WebSocket subscription failed
             const baseInterval = subscriptionErrorRef.current ? 1500 : 2000
             const pollInterval = (state.status === 'qr_required' && qrCodeStableRef.current) ? 10000 : baseInterval
             
             const interval = setInterval(() => {
               loadStatus()
             }, pollInterval)

             return () => {
               clearInterval(interval)
             }
           }
         }, [loadStatus, state.status, token])

  const connect = useCallback(async () => {
    if (!sessionId) {
      return
    }

    setLoading(true)
    setState((prev) => ({
      ...prev,
      status: 'connecting',
    }))

    console.log('🔌🔌🔌 useWhatsAppConnection: Starting connect call', { sessionId })

    try {
      console.log('🔌🔌🔌 useWhatsAppConnection: Calling /api/whatsapp/connect', { sessionId })

      if (!token) {
        throw new Error('Authentication required')
      }
      
      const response = await authenticatedFetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }, token)

      console.log('🔌🔌🔌 useWhatsAppConnection: Got response', {
        sessionId,
        status: response.status,
        ok: response.ok,
      })

      const data = await response.json().catch(() => ({}))
      console.log('🔌🔌🔌 useWhatsAppConnection: Response data', {
        sessionId,
        data,
        hasError: !!data?.error,
      })

      if (!response.ok) {
        console.log('🔌🔌🔌 useWhatsAppConnection: Response not OK', {
          sessionId,
          status: response.status,
          error: data?.error,
        })
        const errorMsg = data?.error || data?.details || 'Error al iniciar conexión'
        toast.error('Error de conexión', errorMsg)
        throw new Error(errorMsg)
      }

      console.log('🔌🔌🔌 useWhatsAppConnection: Connect call successful', { sessionId })
      toast.success('Conexión iniciada', 'La sesión se está conectando...')

      await loadStatus()
      console.log('🔌🔌🔌 useWhatsAppConnection: Status loaded after connect', { sessionId })
    } catch (error) {
      console.error('🔌🔌🔌 useWhatsAppConnection: connect error', {
        sessionId,
        error: error instanceof Error ? error.message : 'unknown-error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      if (!errorMsg.includes('Error de conexión')) {
        toast.error('Error de conexión', errorMsg)
      }
      setState((prev) => ({
        ...prev,
        status: 'error',
      }))
      throw error
    } finally {
      console.log('🔌🔌🔌 useWhatsAppConnection: Connect call finished', { sessionId })
      setLoading(false)
    }
  }, [sessionId, loadStatus])

  const disconnect = useCallback(async () => {
    if (!sessionId) {
      return
    }

    setLoading(true)
    try {
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const response = await authenticatedFetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }, token)

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const errorMsg = data?.error || 'Error al desconectar sesión'
        toast.error('Error de desconexión', errorMsg)
        throw new Error(errorMsg)
      }
      toast.success('Desconectado', 'La sesión se ha desconectado correctamente')

      setState({
        status: 'disconnected',
        socketStatus: 'disconnected',
        lastDisconnectReason: null,
      })
      setQrCode(null)
    } catch (error) {
      console.error('useWhatsAppConnection: disconnect error', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const testQR = useCallback(async () => {
    if (!sessionId) {
      console.warn('[WhatsApp Connection] No session ID for test QR')
      return
    }

    try {
      if (!token) {
        console.warn('[WhatsApp Connection] No auth token available for test QR')
        return
      }

      const response = await authenticatedFetch('/api/whatsapp/test-qr', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }, token)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to trigger test QR')
      }

      const data = await response.json()
      console.log('✅ Test QR triggered:', data)
      toast?.success?.('Test QR code broadcasted - check WebSocket events')
    } catch (error) {
      console.error('[WhatsApp Connection] Error triggering test QR:', error)
      toast?.error?.(error instanceof Error ? error.message : 'Failed to trigger test QR')
    }
  }, [sessionId, token])

  return {
    status: state.status,
    socketStatus: state.socketStatus,
    lastDisconnectReason: state.lastDisconnectReason,
    qrCode,
    loading,
    refresh: loadStatus,
    connect,
    disconnect,
    testQR,
  }
}

