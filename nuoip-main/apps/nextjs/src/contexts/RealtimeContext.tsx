"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type Pusher from 'pusher-js'
import type { Channel, PresenceChannel } from 'pusher-js'
import { useAuthStore, useChatAuthStore } from '@/stores'

// Types for events
export interface TenantUserThreadEvent {
  id: string
  tenantId: string
  threadKey: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}

export interface TenantUserThreadReadEvent {
  tenantId: string
  threadKey: string
  readerId: string
  messageIds: string[]
  readAt: string
}

export interface TenantUserThreadDeliveredEvent {
  tenantId: string
  threadKey: string
  recipientId: string
  messageIds: string[]
  deliveredAt: string
}

export interface TypingEvent {
  userId: string
  isTyping: boolean
}

export interface PaymentNotificationEvent {
  type: 'payment'
  id?: string
  amount: number | string
  currency?: string
  customer?: {
    name?: string
    email?: string
  }
  link?: {
    id?: string
    description?: string
  }
  mode?: string
  timestamp?: string
  tenantId?: string
}

export interface RealtimeConfig {
  key: string
  host: string
  port: number
  useTLS: boolean
  appId: string
  cluster: string
}

type EventHandler<T = any> = (data: T) => void
type GlobalEventHandler = (eventName: string, data: any) => void

interface SubscriptionOptions {
  channelName: string
  onMessage?: EventHandler<TenantUserThreadEvent>
  onReadReceipt?: EventHandler<TenantUserThreadReadEvent>
  onDeliveryReceipt?: EventHandler<TenantUserThreadDeliveredEvent>
  onTyping?: EventHandler<TypingEvent>
  onPresenceUpdate?: (memberIds: string[]) => void
  onPaymentNotification?: EventHandler<PaymentNotificationEvent>
  onGenericEvent?: GlobalEventHandler
}

interface RealtimeContextValue {
  isConnected: boolean
  isReady: boolean
  pusherClient: Pusher | null
  subscribe: (options: SubscriptionOptions) => () => void
  unsubscribe: (channelName: string) => void
  triggerTyping: (channelName: string, isTyping: boolean) => void
  getPresenceMembers: (channelName: string) => string[]
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const pusherRef = useRef<Pusher | null>(null)
  const subscribedChannelsRef = useRef<Map<string, Channel | PresenceChannel>>(new Map())
  const configSignatureRef = useRef<string | null>(null)
  const eventHandlersRef = useRef<Map<string, Map<string, Set<EventHandler>>>>(new Map())
  const initializingRef = useRef<boolean>(false)

  // Get auth from Zustand (primary auth for admin panel)
  const { user: nextAuthUser, isLoading: nextAuthStatus } = useAuthStore()

  const chatSessionToken = useChatAuthStore(state => state.sessionToken)
  const chatTenantId = useChatAuthStore(state => state.tenantId)
  const chatLinkedUserId = useChatAuthStore(state => state.linkedUserId ?? state.userId)
  const chatEmail = useChatAuthStore(state => state.email)
  const chatStatus = useChatAuthStore(state => state.status)
  const chatIsHydrated = useChatAuthStore(state => state.isHydrated)

  // Extract user data from Zustand auth
  const userId = nextAuthUser?.id
  const tenantId = nextAuthUser?.tenantId
  const userEmail = nextAuthUser?.email

  // Only initialize Soketi if we have a valid auth session
  const hasValidSession = !nextAuthStatus && nextAuthUser

  const hasChatIdentity = Boolean(
    chatSessionToken &&
    chatTenantId &&
    chatLinkedUserId &&
    chatIsHydrated &&
    chatStatus !== 'unauthenticated',
  )

  type ActiveIdentity =
    | {
      type: 'nextauth'
      userId: string
      tenantId: string
      email: string | null | undefined
    }
    | {
      type: 'chat'
      userId: string
      tenantId: string
      email: string | null | undefined
    }
    | null

  const activeIdentity: ActiveIdentity = useMemo(() => {
    if (hasValidSession && userId && tenantId) {
      return {
        type: 'nextauth',
        userId,
        tenantId,
        email: userEmail,
      }
    }

    if (hasChatIdentity && chatTenantId && chatLinkedUserId) {
      return {
        type: 'chat',
        userId: chatLinkedUserId,
        tenantId: chatTenantId,
        email: chatEmail,
      }
    }

    return null
  }, [
    chatEmail,
    chatIsHydrated,
    chatLinkedUserId,
    chatSessionToken,
    chatStatus,
    chatTenantId,
    hasChatIdentity,
    hasValidSession,
    tenantId,
    userEmail,
    userId,
  ])

  const hasIdentity = Boolean(activeIdentity)

  const authorizationHeader = useMemo(() => {
    if (activeIdentity?.type === 'chat' && chatSessionToken) {
      return `Bearer ${chatSessionToken}`
    }
    return null
  }, [activeIdentity?.type, chatSessionToken])

  // Only log auth status changes, not every render (commented out to reduce console spam)
  // console.log('RealtimeProvider: Auth status', {
  //   nextAuthStatus,
  //   hasValidSession,
  //   hasIdentity,
  //   identityType: activeIdentity?.type ?? null,
  //   nextAuthUserId: userId,
  //   nextAuthTenantId: tenantId,
  //   nextAuthEmail: userEmail,
  //   chatStatus,
  //   chatIsHydrated,
  //   chatSessionToken: Boolean(chatSessionToken),
  //   chatTenantId,
  //   chatLinkedUserId,
  // })


  const createChannelAuthorizer = useCallback(
    () =>
      (channel: { name: string }) => ({
        authorize: async (socketId: string, callback: (error: any, authData: any) => void) => {
          try {
            // Use cookies for NextAuth authentication (sent automatically)
            const response = await fetch('/api/chat/realtime/auth', {
              method: 'POST',
              credentials: activeIdentity?.type === 'nextauth' ? 'include' : 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })

            const raw = await response.text()
            let payload: any = null

            try {
              payload = raw ? JSON.parse(raw) : null
            } catch (parseError) {
              payload = raw
            }

            if (!response.ok || !payload) {
              const normalizedPayload =
                payload && typeof payload === 'object' ? payload : payload ? { message: String(payload) } : null
              const message =
                (normalizedPayload && typeof normalizedPayload.error === 'string' && normalizedPayload.error) ||
                `Authorization failed with status ${response.status}`

              console.warn('RealtimeProvider: authorizer warning', {
                channel: channel?.name ?? 'unknown',
                status: response.status,
                error: message,
                payload: normalizedPayload,
              })

              // Only trigger session refresh on 401 (Unauthorized), not 403 (Forbidden)
              // 403 typically indicates Soketi is not configured or permission issues, not invalid session
              if (response.status === 401) {
                const { loadSession, logout } = useChatAuthStore.getState()
                try {
                  const refreshed = await loadSession()
                  if (!refreshed) {
                    await logout()
                  }
                } catch (refreshError) {
                  console.warn('RealtimeProvider: failed to refresh chat session after auth error', refreshError)
                }
              }

              const error = new Error(message)
              callback(error, normalizedPayload ?? { status: response.status, error: message })
              return
            }

            callback(null, payload)
          } catch (error) {
            console.warn('RealtimeProvider: authorizer exception', {
              channel: channel?.name ?? 'unknown',
              error,
            })
            callback(error, null)
          }
        },
      }),
    [activeIdentity?.type, authorizationHeader],
  )

  // Initialize Pusher client
  useEffect(() => {
    let cancelled = false

    const initializePusher = async () => {
      // Prevent re-initialization if already initialized and connected
      if (pusherRef.current && isReady && isConnected && hasIdentity) {
        return
      }

      // Prevent concurrent initializations
      if (initializingRef.current) {
        return
      }

      if (!hasIdentity) {
        // Only log if we're actually cleaning up (not just on initial render)
        if (pusherRef.current || isReady) {
          console.log('RealtimeProvider: No valid session, cannot initialize Pusher', {
            nextAuthStatus,
            hasValidSession,
            hasIdentity,
            identityType: activeIdentity?.type ?? null,
            userId,
            tenantId,
            chatStatus,
            chatTenantId,
            chatLinkedUserId,
          })
        }
        // Clean up if identity is lost
        initializingRef.current = false
        setIsReady(false)
        setIsConnected(false)
        configSignatureRef.current = null
        if (pusherRef.current) {
          for (const [channelName, channel] of subscribedChannelsRef.current) {
            channel?.unbind_all?.()
            pusherRef.current.unsubscribe(channelName)
          }
          subscribedChannelsRef.current.clear()
          eventHandlersRef.current.clear()
          pusherRef.current.connection.unbind_all()
          pusherRef.current.disconnect()
          pusherRef.current = null
        }
        return
      }

      initializingRef.current = true
      // Reduced logging - only log errors

      try {
        // Use cookies for NextAuth authentication (sent automatically)
        const configRequest: RequestInit = {
          credentials: activeIdentity?.type === 'nextauth' ? 'include' : 'same-origin',
        }

        if (authorizationHeader) {
          configRequest.headers = {
            Authorization: authorizationHeader,
          }
        }

        const response = await fetch('/api/chat/realtime/config', configRequest)

        if (!response.ok) {
          console.error('RealtimeProvider: Failed to fetch realtime config', {
            status: response.status,
            statusText: response.statusText,
          })
          setIsReady(false)
          return
        }

        const data = await response.json()
        const configData = data // Assuming configResponse was a typo and it should use the 'data' from the response

        if (!configData.success || !configData.config) {
          // Realtime is optional for development, so we use console.log instead of warn
          console.log('RealtimeProvider: Realtime features disabled (optional for development)')
          // setConnectionError(null) // setConnectionError is not defined in the provided context.
          // The original code had a closing parenthesis for the console.warn call,
          // followed by setIsReady(false) and return.
          // The provided edit has a malformed line `return  hasConfig: !!data.config,`
          // and then `message: data.message,` followed by `})`.
          // I will reconstruct this to be syntactically correct based on the intent to suppress the warning
          // and disable realtime features.
          setIsReady(false)
          return
        }

        const signature = `${data.config.key}|${data.config.host}|${data.config.port}|${data.config.useTLS}|${data.config.cluster ?? ''}`
        if (signature === configSignatureRef.current && pusherRef.current) {
          setIsReady(true)
          initializingRef.current = false
          return
        }

        const { default: PusherClient } = await import('pusher-js')
        if (cancelled) return

        // Clean up old connection
        if (pusherRef.current) {
          for (const [channelName, channel] of subscribedChannelsRef.current) {
            channel?.unbind_all?.()
            pusherRef.current.unsubscribe(channelName)
          }
          subscribedChannelsRef.current.clear()
          eventHandlersRef.current.clear()
          pusherRef.current.connection.unbind_all()
          pusherRef.current.disconnect()
        }

        const useTLS = Boolean(data.config.useTLS)
        const client = new PusherClient(data.config.key, {
          cluster: data.config.cluster ?? 'mt1',
          wsHost: data.config.host,
          wsPort: data.config.port,
          forceTLS: useTLS,
          disableStats: true,
          authorizer: createChannelAuthorizer(),
        })

        client.connection.bind('connected', () => {
          setIsConnected(true)
          console.log('✅ RealtimeProvider: Pusher connected successfully', {
            socketId: client.connection.socket_id,
            state: client.connection.state,
            host: data.config.host,
            port: data.config.port,
          })
        })

        client.connection.bind('disconnected', () => {
          setIsConnected(false)
        })

        client.connection.bind('error', (err: any) => {
          // Filter out non-critical errors that auto-recover
          const errorType = err?.type
          const errorData = err?.data
          const errorCode = errorData?.code
          const errorStatus = errorData?.status
          
          // Skip logging for transient errors that don't affect functionality
          const isTransientError = 
            errorType === 'TransportUnavailable' ||
            errorType === 'TransportClosed' ||
            (errorCode === 1006 && client.connection.state === 'connecting') || // WebSocket closed during connection (will retry)
            (errorCode === 1000 && client.connection.state === 'connecting') // Normal closure during connection (will retry)
          
          // Only log errors that are actually problematic
          if (!isTransientError) {
            // Check if connection is still working despite the error
            const isStillConnected = client.connection.state === 'connected' || client.connection.state === 'connecting'
            
            if (isStillConnected && errorType !== 'AuthError' && errorStatus !== 401 && errorStatus !== 403) {
              // Connection is working, this is likely a transient error - log as warning instead
              console.warn('RealtimeProvider: Pusher connection warning (connection still active)', {
                error: err,
                type: errorType,
                data: errorData,
                connectionState: client.connection.state,
              })
            } else {
              // This is a real error that needs attention
              console.error('RealtimeProvider: Pusher connection error', {
                error: err,
                type: errorType,
                data: errorData,
                connectionState: client.connection.state,
              })
            }
          }
        })

        client.connection.bind('state_change', (states: any) => {
          // State change - silently update state without logging
          if (states.current === 'connected') {
            setIsConnected(true)
          } else if (states.current === 'disconnected') {
            setIsConnected(false)
          }
        })

        pusherRef.current = client
        configSignatureRef.current = signature
        setIsReady(true)
        initializingRef.current = false
        // Pusher initialized - no need to log every time
      } catch (error) {
        console.error('Failed to initialize realtime:', error)
        setIsReady(false)
        initializingRef.current = false
      }
    }

    initializePusher()

    return () => {
      cancelled = true
    }
  }, [
    activeIdentity,
    authorizationHeader,
    hasIdentity,
    nextAuthUser,
    nextAuthStatus,
    tenantId,
    userEmail,
    userId,
  ])

  // Subscribe to a channel
  const subscribe = useCallback((options: SubscriptionOptions) => {
    const { channelName, onMessage, onReadReceipt, onDeliveryReceipt, onTyping, onPresenceUpdate, onPaymentNotification, onGenericEvent } = options

    if (!pusherRef.current || !isReady) {
      console.warn('Cannot subscribe: Pusher not ready')
      return () => { }
    }

    let channel = subscribedChannelsRef.current.get(channelName)

    if (!channel) {
      console.log('RealtimeProvider: Subscribing to', channelName)
      channel = pusherRef.current.subscribe(channelName)
      subscribedChannelsRef.current.set(channelName, channel)

      // Initialize event handlers map for this channel
      if (!eventHandlersRef.current.has(channelName)) {
        eventHandlersRef.current.set(channelName, new Map())
      }

      channel.bind('pusher:subscription_succeeded', () => {
        console.log('✅ RealtimeProvider: Subscription succeeded', {
          channelName,
          socketId: pusherRef.current?.connection.socket_id,
        })

        // Call presence update if it's a presence channel
        if (channelName.startsWith('presence-') && onPresenceUpdate) {
          const presenceChannel = channel as PresenceChannel
          const memberIds = Object.keys(presenceChannel.members.members)
          onPresenceUpdate(memberIds)
        }
      })

      channel.bind('pusher:subscription_error', (status: any) => {
        console.warn('RealtimeProvider: Subscription error', {
          channelName,
          status,
        })

        // Always remove channel on error to allow hook to retry
        // The hook implements exponential backoff to prevent rapid re-subscription loops
        if (channel) {
          try {
            channel.unbind_all()
          } catch (unbindError) {
            console.warn('RealtimeProvider: Failed to unbind channel after subscription error', {
              channelName,
              error: unbindError,
            })
          }
        }

        try {
          pusherRef.current?.unsubscribe(channelName)
        } catch (unsubscribeError) {
          console.warn('RealtimeProvider: Failed to unsubscribe after subscription error', {
            channelName,
            error: unsubscribeError,
          })
        }

        subscribedChannelsRef.current.delete(channelName)
        eventHandlersRef.current.delete(channelName)

        console.log('RealtimeProvider: Channel removed after subscription error - hook will retry with backoff', {
          channelName,
          isAuthError: status?.status === 401 || status?.type === 'AuthError',
        })
      })

      // Bind presence events if it's a presence channel
      if (channelName.startsWith('presence-')) {
        const presenceChannel = channel as PresenceChannel

        const handlePresenceChange = () => {
          if (onPresenceUpdate) {
            const memberIds = Object.keys(presenceChannel.members.members)
            onPresenceUpdate(memberIds)
          }
        }

        presenceChannel.bind('pusher:member_added', handlePresenceChange)
        presenceChannel.bind('pusher:member_removed', handlePresenceChange)
      }
    }

    const channelHandlers = eventHandlersRef.current.get(channelName)!

    // Register handlers
    if (onMessage) {
      if (!channelHandlers.has('tenant-user-message')) {
        channelHandlers.set('tenant-user-message', new Set())
      }
      channelHandlers.get('tenant-user-message')!.add(onMessage)
      channel.bind('tenant-user-message', onMessage)
    }

    if (onReadReceipt) {
      if (!channelHandlers.has('tenant-user-message-read')) {
        channelHandlers.set('tenant-user-message-read', new Set())
      }
      channelHandlers.get('tenant-user-message-read')!.add(onReadReceipt)
      channel.bind('tenant-user-message-read', onReadReceipt)
    }

    if (onDeliveryReceipt) {
      if (!channelHandlers.has('tenant-user-message-delivered')) {
        channelHandlers.set('tenant-user-message-delivered', new Set())
      }
      channelHandlers.get('tenant-user-message-delivered')!.add(onDeliveryReceipt)
      channel.bind('tenant-user-message-delivered', onDeliveryReceipt)
    }

    if (onTyping) {
      if (!channelHandlers.has('client-typing')) {
        channelHandlers.set('client-typing', new Set())
      }
      channelHandlers.get('client-typing')!.add(onTyping)
      channel.bind('client-typing', onTyping)
    }

    if (onPaymentNotification) {
      if (!channelHandlers.has('payment-notification')) {
        channelHandlers.set('payment-notification', new Set())
      }
      channelHandlers.get('payment-notification')!.add(onPaymentNotification)
      channel.bind('payment-notification', onPaymentNotification)
    }

    if (onGenericEvent) {
      // Bind to all events (useful for debugging or catch-all handlers)
      const globalHandler = (eventName: string, data: any) => {
        // Log QR-related events with more detail
        if (eventName === 'qr.code' || eventName === 'qr_code' || eventName?.includes('qr')) {
          console.log('🔍 RealtimeProvider: QR-related event detected via bind_global', {
            channelName,
            eventName,
            hasData: !!data,
            hasQr: !!data?.qr,
            qrLength: data?.qr?.length || 0,
            timestamp: Date.now(),
          })
        }
        console.log('🌐 RealtimeProvider: bind_global event received', {
          channelName,
          eventName,
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
        })
        onGenericEvent(eventName, data)
      }
      channel.bind_global(globalHandler)

      // Also bind specifically to qr.code event to ensure it's captured
      // Some Pusher/Soketi implementations may not trigger bind_global for all events
      const qrCodeHandler = (data: any) => {
        console.log('🟢🟢🟢 RealtimeProvider: qr.code event received via specific bind', {
          channelName,
          hasData: !!data,
          hasQr: !!data?.qr,
          qrLength: data?.qr?.length || 0,
          dataKeys: data ? Object.keys(data) : [],
          fullData: data,
          timestamp: Date.now(),
        })
        onGenericEvent('qr.code', data)
      }
      channel.bind('qr.code', qrCodeHandler)

      // Also try alternative event name in case backend uses different format
      channel.bind('qr_code', (data: any) => {
        console.log('🟢🟢🟢 RealtimeProvider: qr_code event received (alternative name)', {
          channelName,
          hasData: !!data,
          hasQr: !!data?.qr,
        })
        onGenericEvent('qr.code', data)
      })

      // Bind to connection.update as well
      channel.bind('connection.update', (data: any) => {
        console.log('🔵 RealtimeProvider: connection.update event received via specific bind', {
          channelName,
          hasData: !!data,
        })
        onGenericEvent('connection.update', data)
      })
    }

    // Return cleanup function
    return () => {
      if (onMessage) {
        channel?.unbind('tenant-user-message', onMessage)
        channelHandlers.get('tenant-user-message')?.delete(onMessage)
      }
      if (onReadReceipt) {
        channel?.unbind('tenant-user-message-read', onReadReceipt)
        channelHandlers.get('tenant-user-message-read')?.delete(onReadReceipt)
      }
      if (onDeliveryReceipt) {
        channel?.unbind('tenant-user-message-delivered', onDeliveryReceipt)
        channelHandlers.get('tenant-user-message-delivered')?.delete(onDeliveryReceipt)
      }
      if (onTyping) {
        channel?.unbind('client-typing', onTyping)
        channelHandlers.get('client-typing')?.delete(onTyping)
      }
      if (onPaymentNotification) {
        channel?.unbind('payment-notification', onPaymentNotification)
        channelHandlers.get('payment-notification')?.delete(onPaymentNotification)
      }
      if (onGenericEvent) {
        channel?.unbind_global(onGenericEvent)
        // Also unbind specific events we bound
        channel?.unbind('qr.code')
        channel?.unbind('qr_code')
        channel?.unbind('connection.update')
      }
    }
  }, [isReady])

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channelName: string) => {
    if (!pusherRef.current) return

    const channel = subscribedChannelsRef.current.get(channelName)
    if (channel) {
      console.log('RealtimeProvider: Unsubscribing from', channelName)
      channel.unbind_all()
      pusherRef.current.unsubscribe(channelName)
      subscribedChannelsRef.current.delete(channelName)
      eventHandlersRef.current.delete(channelName)
    }
  }, [])

  // Trigger typing event
  const triggerTyping = useCallback((channelName: string, isTyping: boolean) => {
    if (!pusherRef.current || !userId) return

    const channel = subscribedChannelsRef.current.get(channelName)
    if (channel && channelName.startsWith('presence-')) {
      const presenceChannel = channel as PresenceChannel
      presenceChannel.trigger('client-typing', {
        userId: userId,
        isTyping,
      })
    }
  }, [userId])

  // Get presence members
  const getPresenceMembers = useCallback((channelName: string): string[] => {
    const channel = subscribedChannelsRef.current.get(channelName)
    if (channel && channelName.startsWith('presence-')) {
      const presenceChannel = channel as PresenceChannel
      return Object.keys(presenceChannel.members.members)
    }
    return []
  }, [])

  const value: RealtimeContextValue = useMemo(() => ({
    isConnected,
    isReady,
    pusherClient: pusherRef.current,
    subscribe,
    unsubscribe,
    triggerTyping,
    getPresenceMembers,
  }), [isConnected, isReady, subscribe, unsubscribe, triggerTyping, getPresenceMembers])

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

// Custom hooks for common use cases
export function useRealtimeChannel(options: SubscriptionOptions) {
  const { subscribe, unsubscribe, isReady } = useRealtime()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!isReady) return

    cleanupRef.current = subscribe(options)

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      unsubscribe(options.channelName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, options.channelName])
}

export function useRealtimeTyping(channelName: string) {
  const { triggerTyping } = useRealtime()

  return useCallback((isTyping: boolean) => {
    triggerTyping(channelName, isTyping)
  }, [channelName, triggerTyping])
}

