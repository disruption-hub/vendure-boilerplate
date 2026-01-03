"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast, useAuthStore } from '@/stores'
import { useRealtime } from '@/contexts/RealtimeContext'
import { buildWhatsAppChannel } from '@/lib/whatsapp/integration/soketi-emitter'

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
    console.warn('[WhatsApp Sessions] No auth token available for request:', url)
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

const DEFAULT_SESSION_REFRESH_INTERVAL_MS = 60000
const parsedSessionRefreshInterval =
  typeof process.env.NEXT_PUBLIC_WHATSAPP_SESSIONS_REFRESH_MS === 'string'
    ? Number(process.env.NEXT_PUBLIC_WHATSAPP_SESSIONS_REFRESH_MS)
    : NaN
const SESSION_REFRESH_INTERVAL_MS =
  Number.isFinite(parsedSessionRefreshInterval) && parsedSessionRefreshInterval >= 15000
    ? Math.floor(parsedSessionRefreshInterval)
    : parsedSessionRefreshInterval === 0
      ? 0
      : DEFAULT_SESSION_REFRESH_INTERVAL_MS

export interface WhatsAppSessionRuntimeSocket {
  status: string
  isActuallyConnected: boolean
  socketExists: boolean
  hasCredentials: boolean
  lastConnectionEventAt: string | Date | null
  lastDisconnectReason: string | null
  lastQRCodeDetectedAt: string | Date | null
  reconnectAttempts: number
}

export interface WhatsAppSessionOverview {
  id: string
  sessionId: string
  name: string | null
  phoneNumber: string | null
  status: string
  lastConnected: string | Date | null
  errorMessage: string | null
  config: any
  stats: {
    messages: number
    contacts: number
  }
  timestamps: {
    createdAt: string | Date
    updatedAt: string | Date
  }
  runtime: {
    socket: WhatsAppSessionRuntimeSocket
  }
}

export interface WhatsAppSessionsSummary {
  total: number
  connected: number
  qrRequired: number
  connecting: number
}

interface FetchOptions {
  silent?: boolean
}

const DEFAULT_SUMMARY: WhatsAppSessionsSummary = {
  total: 0,
  connected: 0,
  qrRequired: 0,
  connecting: 0,
}

function normalizeSummary(summary?: Partial<WhatsAppSessionsSummary>): WhatsAppSessionsSummary {
  if (!summary) {
    return DEFAULT_SUMMARY
  }
  return {
    total: summary.total ?? 0,
    connected: summary.connected ?? 0,
    qrRequired: summary.qrRequired ?? 0,
    connecting: summary.connecting ?? 0,
  }
}

export function useWhatsAppSessions() {
  const { isReady: realtimeReady, subscribe } = useRealtime()
  const { token } = useAuthStore()

  const [sessions, setSessions] = useState<WhatsAppSessionOverview[]>([])
  const [summary, setSummary] = useState<WhatsAppSessionsSummary>(DEFAULT_SUMMARY)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())

  const [creatingSession, setCreatingSession] = useState<boolean>(false)
  const [connectingSessionId, setConnectingSessionId] = useState<string | null>(null)
  const [disconnectingSessionId, setDisconnectingSessionId] = useState<string | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false)

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionSubscriptionsRef = useRef<Map<string, () => void>>(new Map())
  const sessionsRef = useRef<WhatsAppSessionOverview[]>(sessions)
  const fetchSessionsRef = useRef<(options?: FetchOptions) => Promise<void>>(null!)

  // Keep sessionsRef in sync with sessions state
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])
  const lastFetchRef = useRef<number>(0)
  const fetchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSessions = useCallback(
    async (options: FetchOptions = {}) => {
      if (!options.silent) {
        setLoading(true)
      }
      setError(null)

      try {
        if (!token) {
          console.warn('[WhatsApp Sessions] No auth token available, skipping fetch')
          setError('Authentication required')
          setLoading(false)
          return
        }

        console.log('📱 fetchSessions: Fetching sessions from API...')
        const response = await authenticatedFetch('/api/whatsapp/sessions', { cache: 'no-store' }, token)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Error al obtener sesiones')
        }

        const fetchedSessions: WhatsAppSessionOverview[] = Array.isArray(data.sessions) ? data.sessions : []

        console.log('📱 fetchSessions: Received sessions from API', {
          count: fetchedSessions.length,
          sessions: fetchedSessions.map(s => ({
            id: s.sessionId,
            phone: s.phoneNumber,
            status: s.status
          }))
        })

        // Server response is the source of truth - don't preserve local-only sessions
        // If a session was deleted on the server, it should disappear from the UI
        // Use ref to access current sessions without adding to dependencies
        const currentSessions = sessionsRef.current
        const mergedFetchedSessions = fetchedSessions.map(serverSession => {
          const localSession = currentSessions.find(s => s.sessionId === serverSession.sessionId)
          if (localSession && localSession.phoneNumber && !serverSession.phoneNumber) {
            console.log('📱 fetchSessions: Preserving local phone number for session', {
              sessionId: serverSession.sessionId,
              phone: localSession.phoneNumber
            })
            return {
              ...serverSession,
              phoneNumber: localSession.phoneNumber,
              status: 'CONNECTED' // Assume connected if we have phone
            }
          }
          return serverSession
        })

        // Identify local sessions that:
        // 1. Are NOT in the server response
        // 2. Are "young" (created recently)
        const now = Date.now()
        const youngLocalSessions = currentSessions.filter(localSession => {
          const isMissing = !fetchedSessions.find(s => s.sessionId === localSession.sessionId)
          if (!isMissing) return false

          const createdAt = new Date(localSession.timestamps.createdAt).getTime()
          const ageSession = now - createdAt

          // Keep if less than 10 seconds old and in a transient state
          const isYoung = ageSession < 10000
          const isTransient = localSession.status === 'CONNECTING' || localSession.status === 'QR_REQUIRED'

          if (isYoung && isTransient) {
            console.log('📱 fetchSessions: Preserving young local session', {
              sessionId: localSession.sessionId,
              ageMs: ageSession
            })
            return true
          }

          return false
        })

        // Merge young local sessions with server sessions
        const finalSessions = [...youngLocalSessions, ...mergedFetchedSessions]

        console.log('📱 fetchSessions: Setting sessions from server', {
          count: finalSessions.length,
          preserved: youngLocalSessions.length
        })

        setSessions(finalSessions)
        setSummary(normalizeSummary(data.summary))
        setSelectedSessionId((current) => {
          if (finalSessions.length === 0 && current === null) {
            return null
          }
          if (current) {
            // Check if current selection still exists on server (or is preserved)
            const stillExists = finalSessions.find(s => s.sessionId === current)
            if (stillExists) {
              return current
            }
            // Current selection was deleted, select first available
            return finalSessions[0]?.sessionId ?? null
          }
          return finalSessions[0]?.sessionId ?? null
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener sesiones'
        console.error('📱 fetchSessions: Error', message)
        setError(message)
        toast.error(message)
      } finally {
        if (!options.silent) {
          setLoading(false)
        }
      }
    },
    [token], // Removed sessions from deps - using sessionsRef instead to prevent infinite loop
  )

  // Keep fetchSessionsRef in sync
  useEffect(() => {
    fetchSessionsRef.current = fetchSessions
  }, [fetchSessions])

  const refresh = useCallback(async () => {
    console.log('📱 refresh: Manual refresh triggered')
    await fetchSessions()
  }, [fetchSessions])

  const scheduleAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }

    // Check if there are active sessions (CONNECTING, QR_REQUIRED, CONNECTED)
    // Use ref to avoid recreating this callback on every session update
    const currentSessions = sessionsRef.current
    const hasActiveSessions = currentSessions.some(
      (s) => s.status === 'CONNECTING' || s.status === 'QR_REQUIRED' || s.status === 'CONNECTED'
    )

    // Use shorter interval (5 seconds) for active sessions, longer (60 seconds) for inactive
    const refreshInterval = hasActiveSessions ? 5000 : SESSION_REFRESH_INTERVAL_MS

    if (refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        // Use ref to call the latest fetchSessions
        fetchSessionsRef.current?.({ silent: true }).catch(() => {
          /* errors handled inside fetchSessions */
        })
      }, refreshInterval)
    }
  }, []) // No deps - uses refs for everything

  // Initial fetch on mount only
  useEffect(() => {
    fetchSessions().catch(() => {
      /* handled inside fetchSessions */
    })

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current)
      }
      if (sessionSubscriptionsRef.current) {
        for (const cleanup of sessionSubscriptionsRef.current.values()) {
          cleanup()
        }
        sessionSubscriptionsRef.current.clear()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - fetchSessions reference is stable via useCallback

  // Schedule auto-refresh on mount only
  useEffect(() => {
    scheduleAutoRefresh()
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [scheduleAutoRefresh])

  // Reschedule auto-refresh when sessions change (to adjust interval)
  useEffect(() => {
    scheduleAutoRefresh()
  }, [sessions, scheduleAutoRefresh])

  useEffect(() => {
    const subscriptions = sessionSubscriptionsRef.current

    if (!realtimeReady) {
      for (const cleanup of subscriptions.values()) {
        cleanup()
      }
      subscriptions.clear()
      return
    }

    const activeSessionIds = new Set(sessions.map((session) => session.sessionId))

    for (const [sessionId, cleanup] of Array.from(subscriptions.entries())) {
      if (!activeSessionIds.has(sessionId)) {
        cleanup()
        subscriptions.delete(sessionId)
      }
    }

    sessions.forEach((session) => {
      if (!subscriptions.has(session.sessionId)) {
        const cleanup = subscribe({
          channelName: buildWhatsAppChannel(session.sessionId),
          onGenericEvent: (eventName, payload) => {
            console.log('📱 useWhatsAppSessions: Event received', {
              sessionId: session.sessionId,
              eventName,
              payload
            })

            // Update session data in real-time based on event type
            setSessions((prev) => prev.map((s) => {
              if (s.sessionId !== session.sessionId) {
                return s
              }

              // Handle connection updates
              if (eventName === 'connection.update') {
                const updates: Partial<WhatsAppSessionOverview> = {}

                if (payload?.phoneNumber) {
                  updates.phoneNumber = payload.phoneNumber
                }

                if (payload?.accountName) {
                  updates.name = payload.accountName
                }

                if (payload?.status) {
                  // Map status values to match API format
                  const statusMap: Record<string, string> = {
                    'connected': 'CONNECTED',
                    'disconnected': 'DISCONNECTED',
                    'connecting': 'CONNECTING',
                    'qr_required': 'QR_REQUIRED',
                  }
                  updates.status = statusMap[payload.status] || payload.status.toUpperCase() || s.status
                }

                if (payload?.connection === 'open' && !updates.status) {
                  updates.status = 'CONNECTED'
                }

                if (Object.keys(updates).length > 0) {
                  console.log('📱 useWhatsAppSessions: Updating connection status', {
                    sessionId: session.sessionId,
                    updates
                  })

                  // Update runtime socket status too if available
                  const updatedRuntime = { ...s.runtime };
                  if (payload?.connection) {
                    updatedRuntime.socket = {
                      ...updatedRuntime.socket,
                      status: payload.connection === 'open' ? 'connected' : payload.connection === 'close' ? 'disconnected' : payload.connection,
                      isActuallyConnected: payload.connection === 'open',
                      socketExists: true,
                    };
                  }

                  return { ...s, ...updates, runtime: updatedRuntime }
                }
              }

              // Handle QR code updates - update status and lastQRCodeDetectedAt
              if (eventName === 'qr.code') {
                console.log('📱 useWhatsAppSessions: QR code received', {
                  sessionId: session.sessionId
                })
                return {
                  ...s,
                  status: 'QR_REQUIRED',
                  runtime: {
                    ...s.runtime,
                    socket: {
                      ...s.runtime.socket,
                      status: 'qr_required',
                      lastQRCodeDetectedAt: new Date().toISOString(),
                      socketExists: true,
                    }
                  }
                }
              }

              // Handle new messages - increment message count
              if (eventName === 'message.received' || eventName === 'message.sent') {
                console.log('📱 useWhatsAppSessions: Incrementing message count', {
                  sessionId: session.sessionId,
                  eventName
                })
                return {
                  ...s,
                  stats: {
                    ...s.stats,
                    messages: (s.stats.messages || 0) + 1
                  }
                }
              }

              // Handle new contacts - increment contact count
              if (eventName === 'contact.created' || eventName === 'contact.updated') {
                // Only increment if it's a new contact (not an update)
                if (eventName === 'contact.created') {
                  console.log('📱 useWhatsAppSessions: Incrementing contact count', {
                    sessionId: session.sessionId
                  })
                  return {
                    ...s,
                    stats: {
                      ...s.stats,
                      contacts: (s.stats.contacts || 0) + 1
                    }
                  }
                }
              }

              // Handle stats update events (if backend sends them)
              if (eventName === 'stats.update' && payload?.stats) {
                console.log('📱 useWhatsAppSessions: Updating stats from event', {
                  sessionId: session.sessionId,
                  stats: payload.stats
                })
                return {
                  ...s,
                  stats: {
                    messages: payload.stats.messages ?? s.stats.messages,
                    contacts: payload.stats.contacts ?? s.stats.contacts,
                  }
                }
              }

              return s
            }))

            // Debounce API refresh to avoid excessive calls
            // Only refresh if it's been more than 2 seconds since last fetch
            const now = Date.now()
            const timeSinceLastFetch = now - lastFetchRef.current

            if (timeSinceLastFetch > 2000) {
              lastFetchRef.current = now
              fetchSessions({ silent: true }).catch(() => {
                /* handled inside fetchSessions */
              })
            } else {
              // Debounce: schedule a refresh after a short delay
              if (fetchDebounceTimerRef.current) {
                clearTimeout(fetchDebounceTimerRef.current)
              }
              fetchDebounceTimerRef.current = setTimeout(() => {
                const timeSinceLastFetch = Date.now() - lastFetchRef.current
                if (timeSinceLastFetch > 2000) {
                  lastFetchRef.current = Date.now()
                  fetchSessions({ silent: true }).catch(() => {
                    /* handled inside fetchSessions */
                  })
                }
              }, 2000 - timeSinceLastFetch)
            }
          },
        })

        subscriptions.set(session.sessionId, cleanup)
      }
    })

    return () => {
      // Do not clear subscriptions here (they are managed incrementally)
    }
  }, [sessions, realtimeReady, subscribe, fetchSessions])

  useEffect(() => {
    return () => {
      if (fetchDebounceTimerRef.current) {
        clearTimeout(fetchDebounceTimerRef.current)
      }
      const subscriptions = sessionSubscriptionsRef.current
      for (const cleanup of subscriptions.values()) {
        cleanup()
      }
      subscriptions.clear()
    }
  }, [])

  const selectSession = useCallback((sessionId: string | null) => {
    setSelectedSessionId(sessionId)
  }, [])

  const createSession = useCallback(async () => {
    console.log('📱📱📱 createSession: Starting session creation')

    if (creatingSession) {
      console.log('📱📱📱 createSession: Already creating, skipping')
      return
    }

    setCreatingSession(true)
    const sessionId = `session-${Date.now()}`
    console.log('📱📱📱 createSession: Generated sessionId', { sessionId })

    // Pre-create session object BEFORE calling connect API
    // This ensures Soketi subscription is established before QR is broadcast
    const newSession: WhatsAppSessionOverview = {
      id: sessionId,
      sessionId,
      name: `Sesión ${new Date().toLocaleString()}`,
      phoneNumber: null,
      status: 'CONNECTING',
      lastConnected: new Date().toISOString(),
      errorMessage: null,
      config: {},
      stats: { messages: 0, contacts: 0 },
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      runtime: {
        socket: {
          status: 'connecting',
          lastQRCodeDetectedAt: null,
          reconnectAttempts: 0,
          lastDisconnectReason: null,
          isActuallyConnected: false,
          socketExists: true,
          hasCredentials: false,
          lastConnectionEventAt: new Date().toISOString(),
        },
      },
    }

    // Add session to state FIRST - this triggers Soketi subscription
    setSessions((prev) => {
      if (prev.find((s) => s.sessionId === sessionId)) {
        return prev
      }
      console.log('📱📱📱 createSession: Pre-adding session to state for Soketi subscription', { sessionId })
      return [newSession, ...prev]
    })
    setSelectedSessionId(sessionId)
    console.log('📱📱📱 createSession: Session pre-selected, Soketi subscription should be ready', { sessionId })

    // Small delay to ensure Soketi subscription is established
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      if (!token) {
        throw new Error('Authentication required')
      }

      console.log('📱📱📱 createSession: Calling /api/whatsapp/connect')
      const response = await authenticatedFetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: `Sesión ${new Date().toLocaleString()}`,
        }),
      }, token)

      const data = await response.json().catch(() => ({}))

      console.log('📱📱📱 createSession: Got response', {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (!response.ok) {
        console.log('📱📱📱 createSession: Response not OK', {
          status: response.status,
          data,
        })
        // Remove the pre-added session on error
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Failed to crear sesión WhatsApp', { sessionId, response: data })
        }
        throw new Error(data?.error || data?.details || 'No se pudo crear la sesión')
      }

      console.log('📱📱📱 createSession: Session created successfully', {
        sessionId,
        data,
      })

      toast.success('Sesión creada, esperando conexión…')

      // Session was pre-added before API call, just log completion
      console.log('📱📱📱 createSession: Session creation complete', { sessionId })
      console.log('📱📱📱 createSession: Soketi subscription should receive QR code events')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear sesión'
      // Remove the pre-added session on error
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
      toast.error(message)
    } finally {
      setCreatingSession(false)
    }
  }, [creatingSession, fetchSessions])

  const connectSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      setConnectingSessionId(sessionId)

      try {
        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await authenticatedFetch('/api/whatsapp/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }, token)

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('Failed to conectar sesión WhatsApp', { sessionId, response: data })
          }
          throw new Error(data?.error || data?.details || 'Error al conectar sesión')
        }

        toast.success('Solicitando conexión de Baileys…')
        await fetchSessions({ silent: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al conectar sesión'
        toast.error(message)
      } finally {
        setConnectingSessionId(null)
      }
    },
    [fetchSessions],
  )

  const disconnectSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      setDisconnectingSessionId(sessionId)

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
          throw new Error(data?.error || 'Error al desconectar sesión')
        }

        toast.success('Sesión desconectada')
        await fetchSessions({ silent: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al desconectar sesión'
        toast.error(message)
      } finally {
        setDisconnectingSessionId(null)
      }
    },
    [fetchSessions],
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      setDeletingSessionId(sessionId)

      try {
        if (!token) {
          throw new Error('Authentication required')
        }

        const response = await authenticatedFetch(`/api/whatsapp/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
          method: 'DELETE',
        }, token)

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data?.error || 'Error al eliminar sesión')
        }

        toast.success('Sesión eliminada')
        setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
        await fetchSessions({ silent: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar sesión'
        toast.error(message)
      } finally {
        setDeletingSessionId(null)
      }
    },
    [fetchSessions],
  )

  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  )

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedSessionIds(new Set(sessions.map(s => s.sessionId)))
  }, [sessions])

  const deselectAll = useCallback(() => {
    setSelectedSessionIds(new Set())
  }, [])

  const bulkDeleteSessions = useCallback(
    async () => {
      if (selectedSessionIds.size === 0) return

      setBulkDeleting(true)
      const idsToDelete = Array.from(selectedSessionIds)

      try {
        if (!token) {
          throw new Error('Authentication required')
        }

        // Delete sessions in parallel
        const deletePromises = idsToDelete.map(sessionId =>
          authenticatedFetch(`/api/whatsapp/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
          }, token)
        )

        const responses = await Promise.allSettled(deletePromises)

        const successCount = responses.filter(r => r.status === 'fulfilled').length
        const failCount = responses.length - successCount

        if (successCount > 0) {
          toast.success(`${successCount} sesión(es) eliminada(s)`)
        }
        if (failCount > 0) {
          toast.error(`${failCount} sesión(es) fallaron al eliminar`)
        }

        deselectAll()
        await fetchSessions({ silent: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar sesiones'
        toast.error(message)
      } finally {
        setBulkDeleting(false)
      }
    },
    [selectedSessionIds, token, fetchSessions, deselectAll],
  )

  return {
    sessions,
    summary,
    loading,
    error,
    selectedSessionId,
    selectedSession,
    selectedSessionIds,
    creatingSession,
    connectingSessionId,
    disconnectingSessionId,
    deletingSessionId,
    bulkDeleting,
    refresh,
    selectSession,
    createSession,
    connectSession,
    disconnectSession,
    deleteSession,
    toggleSessionSelection,
    selectAll,
    deselectAll,
    bulkDeleteSessions,
  }
}


