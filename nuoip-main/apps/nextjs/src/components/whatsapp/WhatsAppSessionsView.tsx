'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plug,
  QrCode,
  RefreshCw,
  Trash2,
  Smartphone,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWhatsAppSessions, WhatsAppSessionOverview } from '@/hooks/use-whatsapp-sessions'
import { useWhatsAppConnection } from '@/hooks/use-whatsapp-connection'
import { toast } from '@/stores'
import { cn } from '@/lib/utils'

type SessionStatusKey = 'CONNECTED' | 'CONNECTING' | 'QR_REQUIRED' | 'DISCONNECTED' | 'ERROR'

const STATUS_CONFIG: Record<
  SessionStatusKey,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CONNECTED: {
    label: 'Conectado',
    badgeClass: 'bg-green-50 text-green-700 border border-green-200',
    icon: CheckCircle2,
  },
  CONNECTING: {
    label: 'Conectando',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: Loader2,
  },
  QR_REQUIRED: {
    label: 'QR pendiente',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: QrCode,
  },
  DISCONNECTED: {
    label: 'Desconectado',
    badgeClass: 'bg-gray-50 text-gray-700 border border-gray-200',
    icon: Plug,
  },
  ERROR: {
    label: 'Error',
    badgeClass: 'bg-red-50 text-red-700 border border-red-200',
    icon: AlertTriangle,
  },
}

function normalizeStatus(value: string | null | undefined): SessionStatusKey {
  if (!value) return 'DISCONNECTED'

  const safe = value.toUpperCase()

  // Check direct match first
  if (safe in STATUS_CONFIG) {
    return safe as SessionStatusKey
  }

  // Map common variations to standard keys
  const statusMap: Record<string, SessionStatusKey> = {
    'QR-REQUIRED': 'QR_REQUIRED',
    'QR': 'QR_REQUIRED',
    'CONNECTING': 'CONNECTING',
    'CONNECTED': 'CONNECTED',
    'DISCONNECTED': 'DISCONNECTED',
    'ERROR': 'ERROR',
  }

  // Check mapped variations
  if (safe in statusMap) {
    return statusMap[safe]
  }

  // Handle lowercase variations
  const lower = value.toLowerCase()
  if (lower === 'qr_required' || lower === 'qr-required' || lower === 'qr required') {
    return 'QR_REQUIRED'
  }
  if (lower === 'connecting') {
    return 'CONNECTING'
  }
  if (lower === 'connected') {
    return 'CONNECTED'
  }
  if (lower === 'disconnected') {
    return 'DISCONNECTED'
  }
  if (lower === 'error') {
    return 'ERROR'
  }

  return 'DISCONNECTED'
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return 'Nunca'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nunca'
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return 'Reciente'
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Hace unos segundos'
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  const months = Math.floor(days / 30)
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  tone,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  description: string
  tone: 'slate' | 'emerald' | 'amber' | 'blue'
}) {
  const toneClasses: Record<typeof tone, { badge: string; icon: string; accent: string }> = {
    slate: {
      badge: 'bg-gray-50 text-gray-600 border border-gray-200',
      icon: 'text-gray-500',
      accent: 'text-gray-600',
    },
    emerald: {
      badge: 'bg-green-50 text-green-600 border border-green-200',
      icon: 'text-green-600',
      accent: 'text-green-600',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-600 border border-amber-200',
      icon: 'text-amber-600',
      accent: 'text-amber-600',
    },
    blue: {
      badge: 'bg-blue-50 text-blue-600 border border-blue-200',
      icon: 'text-blue-600',
      accent: 'text-blue-600',
    },
  }

  const styles = toneClasses[tone]

  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="flex items-center justify-between gap-4 py-4 bg-white">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-black">{new Intl.NumberFormat('es-PE').format(value)}</p>
          <p className={cn('text-xs', styles.accent)}>{description}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-full bg-white', styles.badge)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
      </CardContent>
    </Card>
  )
}

function SessionsList({
  sessions,
  selectedSessionId,
  selectedSessionIds,
  onSelect,
  onToggleSelection,
}: {
  sessions: WhatsAppSessionOverview[]
  selectedSessionId: string | null
  selectedSessionIds: Set<string>
  onSelect: (sessionId: string) => void
  onToggleSelection: (sessionId: string) => void
}) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-white border-gray-200 border-dashed">
        <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center bg-white">
          <QrCode className="h-10 w-10 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-black">No hay sesiones registradas</p>
            <p className="text-xs text-gray-600">
              Crea una nueva sesión para iniciar la vinculación con WhatsApp (Baileys).
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.map((session) => {
        const statusKey = normalizeStatus(session.status)
        const statusConfig = STATUS_CONFIG[statusKey]
        const isSelected = selectedSessionId === session.sessionId
        const isChecked = selectedSessionIds.has(session.sessionId)

        return (
          <div
            key={session.sessionId}
            className={cn(
              'rounded-lg border bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md',
              isSelected ? 'border-green-600 ring-1 ring-green-200' : 'border-gray-200',
            )}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox for multi-select */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation()
                  onToggleSelection(session.sessionId)
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />

              {/* Session details - clickable area */}
              <button
                type="button"
                onClick={() => onSelect(session.sessionId)}
                className="flex-1 text-left focus:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-black">
                      {session.name || session.sessionId.replace(/^session-/, 'Sesión ')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {session.phoneNumber ? `+${session.phoneNumber}` : 'Sin número aún'}
                    </p>
                  </div>
                  <Badge className={cn('flex items-center gap-1', statusConfig.badgeClass)}>
                    <statusConfig.icon className="h-3.5 w-3.5" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span>Última conexión: {formatRelativeTime(session.lastConnected)}</span>
                  <span>Mensajes: {session.stats.messages}</span>
                  <span>Contactos: {session.stats.contacts}</span>
                </div>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SessionDetail({
  session,
  connectionStatus,
  socketStatus,
  qrImage,
  qrRaw,
  connectLoading,
  onConnect,
  onDisconnect,
  onDelete,
  onTestQR,
  lastDisconnectReason,
}: {
  session: WhatsAppSessionOverview
  connectionStatus: string
  socketStatus?: string | null
  qrImage: string | null
  qrRaw: string | null
  connectLoading: boolean
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  onDelete: () => Promise<void>
  onTestQR?: () => Promise<void>
  lastDisconnectReason?: string | null
}) {
  // Determine status: prioritize socketStatus if available, then connectionStatus, then session.status
  // If socketStatus is disconnected, we should not show as connected
  let derivedStatus = connectionStatus || session.status
  if (socketStatus === 'disconnected' && (connectionStatus === 'connected' || session.status === 'CONNECTED')) {
    // Socket is disconnected but status says connected - this is inconsistent, trust the socket
    derivedStatus = 'disconnected'
  } else if (socketStatus && socketStatus !== 'disconnected') {
    // If socketStatus is available and not disconnected, use it
    derivedStatus = socketStatus
  }
  const statusKey = normalizeStatus(derivedStatus)

  // Debug logging - always log, not just in development
  console.log('🎯 SessionDetail: Status calculation', {
    connectionStatus,
    socketStatus,
    sessionStatus: session.status,
    derivedStatus,
    statusKey,
    hasQrImage: !!qrImage,
    hasQrRaw: !!qrRaw,
    qrImageLength: qrImage?.length || 0,
    shouldShowQR: !!qrImage,
  })
  const statusConfig = STATUS_CONFIG[statusKey]

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-black">
              <statusConfig.icon className="h-5 w-5 text-green-600" />
              {session.name || session.sessionId.replace(/^session-/, 'Sesión ')}
            </CardTitle>
            <CardDescription className="mt-1 text-black">
              ID: <span className="font-mono text-xs text-gray-600">{session.sessionId}</span>
            </CardDescription>
          </div>
          <Badge className={cn('flex items-center gap-1 px-3 py-1 text-xs', statusConfig.badgeClass)}>
            <statusConfig.icon className="h-3.5 w-3.5" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Número asociado" value={session.phoneNumber ? `+${session.phoneNumber}` : 'Sin número aún'} />
          <InfoItem
            label="Estado del socket"
            value={
              socketStatus
                ? socketStatus === 'connected' ? 'Conectado' :
                  socketStatus === 'connecting' ? 'Conectando' :
                    socketStatus === 'qr_required' ? 'QR requerido' :
                      socketStatus === 'disconnected' ? 'Desconectado' :
                        socketStatus
                : connectionStatus === 'connected' ? 'Conectado' :
                  connectionStatus === 'connecting' ? 'Conectando' :
                    connectionStatus === 'qr_required' ? 'QR requerido' :
                      connectionStatus === 'disconnected' ? 'Desconectado' :
                        session.runtime.socket.status ?? '—'
            }
          />
          <InfoItem label="Última conexión" value={formatDateTime(session.lastConnected)} hint={formatRelativeTime(session.lastConnected)} />
          <InfoItem label="Último error" value={lastDisconnectReason || session.errorMessage || '—'} />
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button onClick={onConnect} disabled={connectLoading} className="bg-green-600 text-white hover:bg-green-700">
            {connectLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plug className="mr-2 h-4 w-4" />
                Reconectar Baileys
              </>
            )}
          </Button>
          {onTestQR && (
            <Button
              variant="outline"
              onClick={onTestQR}
              disabled={connectLoading}
              className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800"
              title="Test WebSocket QR code broadcast"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Test QR
            </Button>
          )}
          <Button variant="outline" onClick={onDisconnect} disabled={connectLoading} className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black">
            <Plug className="mr-2 h-4 w-4 rotate-45" />
            Desconectar
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={connectLoading}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar sesión
          </Button>
        </div>

        {/* Debug logging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <div>Status: {connectionStatus} → {statusKey}</div>
            <div>QR Code: {qrRaw ? `Yes (${qrRaw.length} chars)` : 'No'}</div>
            <div>QR Image: {qrImage ? 'Yes' : 'No'}</div>
            <div>Should show QR: {qrImage && (statusKey === 'QR_REQUIRED' || statusKey === 'CONNECTING') ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Show QR if available - always show when qrImage exists */}
        {qrImage && (
          <Alert className="bg-amber-50 border-amber-200">
            <QrCode className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-black">
              <h3 className="text-sm font-semibold text-black mb-1">Escanea el código QR con WhatsApp</h3>
              <p className="text-xs text-gray-600 mb-4">Abre WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo.</p>
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={qrImage}
                    alt="Código QR de WhatsApp"
                    className="h-56 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-sm"
                  />
                  {statusKey === 'CONNECTING' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/10">
                      <div className="rounded bg-white px-2 py-1 text-xs font-medium text-black">
                        Esperando conexión...
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-600">
                  {qrRaw?.length ? `Código activo (${qrRaw.length} caracteres)` : 'El código se actualiza periódicamente.'}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Show loading state when connecting but QR not yet available */}
        {statusKey === 'CONNECTING' && !qrImage && (
          <Alert className="bg-blue-50 border-blue-200">
            <QrCode className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-black">
              <h3 className="text-sm font-semibold text-black mb-1">Esperando código QR...</h3>
              <p className="text-xs text-gray-600">
                El sistema está generando el código QR. Por favor espera unos segundos.
                <span className="block mt-1 text-amber-600">
                  Nota: Si el código no aparece, la conexión WebSocket puede no estar disponible. El sistema seguirá intentando.
                </span>
              </p>
            </AlertDescription>
          </Alert>
        )}

        {statusKey === 'QR_REQUIRED' && !qrImage && !connectLoading && (
          <Alert className="bg-gray-50 border-gray-200 border-dashed">
            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            <AlertDescription className="text-black">
              <h3 className="text-sm font-semibold text-black mb-1">Esperando código QR...</h3>
              <p className="text-xs text-gray-600">
                Generando código QR. Por favor espera...
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-sm font-semibold text-black">Diagnóstico Baileys</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-50">
            <div className="grid gap-3 sm:grid-cols-2">
              <DiagnosticItem
                icon={Activity}
                label="Socket en vivo"
                value={
                  socketStatus === 'connected' ||
                    socketStatus === 'connecting' ||
                    socketStatus === 'qr_required'
                    ? 'Sí'
                    : 'No'
                }
              />
              <DiagnosticItem
                icon={Clock}
                label="Último QR detectado"
                value={qrRaw ? 'Ahora' : formatRelativeTime(session.runtime.socket.lastQRCodeDetectedAt)}
              />
              <DiagnosticItem
                icon={RefreshCw}
                label="Intentos de reconexión"
                value={String(session.runtime.socket.reconnectAttempts ?? 0)}
              />
              <DiagnosticItem
                icon={AlertTriangle}
                label="Último motivo de desconexión"
                value={lastDisconnectReason || session.runtime.socket.lastDisconnectReason || '—'}
              />
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Estado en tiempo real: <span className="font-medium text-black">{connectionStatus}</span>
              {socketStatus && socketStatus !== connectionStatus && (
                <>
                  {' • '}
                  Socket: <span className="font-medium text-black">{socketStatus}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

function InfoItem({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase text-gray-600">{label}</p>
      <p className="text-sm font-medium text-black">{value}</p>
      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
  )
}

function DiagnosticItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-gray-600" />
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-medium text-black">{value}</p>
      </div>
    </div>
  )
}

export function WhatsAppSessionsView() {
  const {
    sessions,
    summary,
    loading,
    selectedSession,
    selectedSessionId,
    selectedSessionIds,
    selectSession,
    refresh,
    createSession,
    deleteSession,
    creatingSession,
    deletingSessionId,
    bulkDeleting,
    toggleSessionSelection,
    selectAll,
    deselectAll,
    bulkDeleteSessions,
  } = useWhatsAppSessions()

  const {
    status: connectionStatus,
    socketStatus,
    qrCode,
    loading: connectionLoading,
    lastDisconnectReason,
    connect,
    disconnect,
    refresh: refreshConnection,
    testQR,
  } = useWhatsAppConnection(selectedSessionId)

  const [qrImage, setQrImage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    console.log('🖼️ WhatsAppSessionsView: QR code effect triggered', {
      hasQrCode: !!qrCode,
      qrCodeLength: qrCode?.length || 0,
      connectionStatus,
    })

    if (!qrCode) {
      console.log('🖼️ WhatsAppSessionsView: No QR code, clearing image')
      setQrImage(null)
      return undefined
    }

    console.log('🖼️ WhatsAppSessionsView: Converting QR code to image', {
      qrCodeLength: qrCode.length,
      qrCodePreview: qrCode.substring(0, 50) + '...',
    })

    QRCode.toDataURL(qrCode, {
      width: 320,
      errorCorrectionLevel: 'M',
      margin: 2,
    })
      .then((dataUrl) => {
        if (!cancelled) {
          console.log('🖼️ WhatsAppSessionsView: QR code converted to image successfully', {
            dataUrlLength: dataUrl.length,
            dataUrlPreview: dataUrl.substring(0, 50) + '...',
          })
          setQrImage(dataUrl)
        } else {
          console.log('🖼️ WhatsAppSessionsView: QR code conversion cancelled')
        }
      })
      .catch((error) => {
        console.error('🖼️ WhatsAppSessionsView: failed to render QR', {
          error: error instanceof Error ? error.message : 'unknown-error',
          stack: error instanceof Error ? error.stack : undefined,
          qrCodeLength: qrCode.length,
        })
        if (!cancelled) {
          setQrImage(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [qrCode, connectionStatus])

  const handleRefresh = useCallback(async () => {
    await refresh().catch(() => {
      /* handled inside hook */
    })
    await refreshConnection().catch(() => {
      /* handled inside hook */
    })
  }, [refresh, refreshConnection])

  const handleConnectSelected = useCallback(async () => {
    if (!selectedSession) return
    try {
      await connect()
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo conectar la sesión'
      toast.error(message)
    }
  }, [connect, refresh, selectedSession])

  const handleDisconnectSelected = useCallback(async () => {
    if (!selectedSession) return
    try {
      await disconnect()
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo desconectar la sesión'
      toast.error(message)
    }
  }, [disconnect, refresh, selectedSession])

  const handleTestQR = useCallback(async () => {
    if (!selectedSessionId) return
    try {
      await testQR()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo generar QR de prueba'
      toast.error(message)
    }
  }, [testQR, selectedSessionId])

  const handleDeleteSelected = useCallback(async () => {
    if (!selectedSession) return
    try {
      await deleteSession(selectedSession.sessionId)
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar la sesión'
      toast.error(message)
    }
  }, [deleteSession, refresh, selectedSession])

  const connectBusy = connectionLoading || (selectedSession ? deletingSessionId === selectedSession.sessionId : false)

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-semibold text-black">Sesiones de WhatsApp (Baileys)</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las conexiones directas vía Baileys. Escanea el código QR y supervisa el estado del socket en tiempo real.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedSessionIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedSessionIds.size} seleccionada(s)
                </span>
                <Button
                  variant="outline"
                  onClick={deselectAll}
                  className="bg-white text-black border-gray-300 hover:bg-gray-50"
                >
                  Deseleccionar
                </Button>
                <Button
                  variant="destructive"
                  onClick={bulkDeleteSessions}
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar seleccionadas
                    </>
                  )}
                </Button>
              </>
            )}
            {sessions.length > 0 && selectedSessionIds.size === 0 && (
              <Button
                variant="outline"
                onClick={selectAll}
                className="bg-white text-black border-gray-300 hover:bg-gray-50"
              >
                Seleccionar todas
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </>
              )}
            </Button>
            <Button
              onClick={createSession}
              disabled={creatingSession}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {creatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plug className="mr-2 h-4 w-4" />
                  Nueva sesión
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Sesiones totales"
            value={summary.total}
            icon={Activity}
            tone="slate"
            description="Registradas"
          />
          <SummaryCard
            title="Conectadas"
            value={summary.connected}
            icon={CheckCircle2}
            tone="emerald"
            description="Listas para enviar"
          />
          <SummaryCard
            title="QR pendiente"
            value={summary.qrRequired}
            icon={QrCode}
            tone="amber"
            description="Requieren escanear"
          />
          <SummaryCard
            title="Conectando"
            value={summary.connecting}
            icon={RefreshCw}
            tone="blue"
            description="En progreso"
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <SessionsList
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          selectedSessionIds={selectedSessionIds}
          onSelect={selectSession}
          onToggleSelection={toggleSessionSelection}
        />

        {(() => {
          console.log('🔍 WhatsAppSessionsView: Rendering session detail', {
            hasSelectedSession: !!selectedSession,
            selectedSessionId,
            sessionsCount: sessions.length,
            sessionIds: sessions.map(s => s.sessionId),
            hasQrCode: !!qrCode,
            hasQrImage: !!qrImage,
          })

          return selectedSession ? (
            <SessionDetail
              session={selectedSession}
              connectionStatus={connectionStatus}
              socketStatus={socketStatus}
              qrImage={qrImage}
              qrRaw={qrCode}
              connectLoading={connectBusy}
              onConnect={handleConnectSelected}
              onDisconnect={handleDisconnectSelected}
              onDelete={handleDeleteSelected}
              onTestQR={handleTestQR}
              lastDisconnectReason={lastDisconnectReason}
            />
          ) : (
            <Card className="bg-white border-gray-200 border-dashed">
              <CardContent className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-center bg-white">
                <Plug className="h-10 w-10 text-gray-300" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-black">Selecciona una sesión</p>
                  <p className="text-xs text-gray-600">
                    Elige una sesión en el panel izquierdo para ver el estado del socket, escanear el QR y administrar la conexión.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>
    </div>
  )
}

