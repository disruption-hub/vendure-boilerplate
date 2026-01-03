"use client"

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDomainStore } from '@/state/hooks'
import { shallow } from 'zustand/shallow'
import QRCode from 'qrcode'
import { CheckCircle2, XCircle, Loader2, QrCode as QrCodeIcon, Smartphone } from 'lucide-react'
import { useRealtimeChannel } from '@/contexts/RealtimeContext'

type WhatsAppStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_REQUIRED' | 'ERROR'

interface WhatsAppConnectionPanelProps {
    sessionId?: string
}

export function WhatsAppConnectionPanel({ sessionId }: WhatsAppConnectionPanelProps) {
    const [status, setStatus] = useState<WhatsAppStatus>('DISCONNECTED')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const { tenantId, sessionToken } = useDomainStore(
        'chatAuth',
        state => ({
            tenantId: state.tenantId,
            sessionToken: state.sessionToken,
        }),
        shallow,
    )

    // Use prop sessionId or fallback to tenantId from store
    const activeSessionId = sessionId || tenantId

    // Generate QR code image from string
    useEffect(() => {
        if (qrCode) {
            QRCode.toDataURL(qrCode, { width: 300, margin: 2 })
                .then(setQrDataUrl)
                .catch(err => console.error('Error generating QR code:', err))
        } else {
            setQrDataUrl(null)
        }
    }, [qrCode])

    // Fetch current status
    const fetchStatus = useCallback(async () => {
        if (!tenantId || !activeSessionId) return

        try {
            const response = await fetch(`/api/whatsapp/status?sessionId=${activeSessionId}`, {
                headers: {
                    Authorization: `Bearer ${sessionToken}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch status')
            }

            const data = await response.json()
            setStatus(data.status)
            setQrCode(data.qr || data.qrCode || null)
            setError(null)
        } catch (err) {
            console.error('Error fetching WhatsApp status:', err)
            setError('Failed to fetch connection status')
        }
    }, [tenantId, activeSessionId, sessionToken])

    // Auto-refresh status when QR_REQUIRED or CONNECTING
    useEffect(() => {
        if (status === 'QR_REQUIRED' || status === 'CONNECTING') {
            const interval = setInterval(fetchStatus, 3000)
            return () => clearInterval(interval)
        }
    }, [status, fetchStatus])

    // Initial status fetch
    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    // Subscribe to real-time updates
    useRealtimeChannel({
        channelName: `whatsapp.${activeSessionId}`,
        onGenericEvent: (eventName, data) => {
            console.log('WhatsApp event received:', eventName, data)

            if (eventName === 'connection.update') {
                const newStatus = data.status?.toUpperCase()
                if (newStatus) {
                    if (newStatus === 'CONNECTED') {
                        setStatus('CONNECTED')
                        setQrCode(null)
                        setError(null)
                    } else if (newStatus === 'DISCONNECTED') {
                        setStatus('DISCONNECTED')
                        setError(data.reason ? `Desconectado: ${data.reason}` : null)
                    } else if (newStatus === 'CONNECTING') {
                        setStatus('CONNECTING')
                    }
                }
            } else if (eventName === 'qr.code') {
                if (data.qr) {
                    setStatus('QR_REQUIRED')
                    setQrCode(data.qr)
                    setError(null)
                }
            }
        }
    })

    const handleConnect = async () => {
        if (!activeSessionId) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({ sessionId: activeSessionId }),
            })

            if (!response.ok) {
                throw new Error('Failed to connect')
            }

            const data = await response.json()
            if (!data.success) {
                throw new Error(data.message || 'Connection failed')
            }

            // Fetch status after connecting to get QR code
            await fetchStatus()
        } catch (err) {
            console.error('Error connecting WhatsApp:', err)
            setError(err instanceof Error ? err.message : 'Failed to connect')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!activeSessionId) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({ sessionId: activeSessionId }),
            })

            if (!response.ok) {
                throw new Error('Failed to disconnect')
            }

            const data = await response.json()
            if (!data.success) {
                throw new Error(data.message || 'Disconnection failed')
            }

            setStatus('DISCONNECTED')
            setQrCode(null)
        } catch (err) {
            console.error('Error disconnecting WhatsApp:', err)
            setError(err instanceof Error ? err.message : 'Failed to disconnect')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'CONNECTED':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'ERROR':
            case 'DISCONNECTED':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'CONNECTING':
            case 'QR_REQUIRED':
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            default:
                return <XCircle className="h-5 w-5 text-gray-400" />
        }
    }

    const getStatusLabel = () => {
        switch (status) {
            case 'CONNECTED':
                return 'Conectado'
            case 'CONNECTING':
                return 'Conectando...'
            case 'QR_REQUIRED':
                return 'Esperando escaneo de QR'
            case 'DISCONNECTED':
                return 'Desconectado'
            case 'ERROR':
                return 'Error'
            default:
                return 'Desconocido'
        }
    }

    if (!activeSessionId) {
        return (
            <div className="rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">
                    No hay sesión de WhatsApp configurada. Por favor contacte al administrador.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">WhatsApp Business</h3>
                        <p className="text-sm text-muted-foreground">
                            Conecta tu cuenta de WhatsApp para recibir y enviar mensajes
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-sm font-medium">{getStatusLabel()}</span>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {status === 'QR_REQUIRED' && qrDataUrl && (
                    <div className="mb-6 flex flex-col items-center gap-4 rounded-lg bg-muted/50 p-6">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Smartphone className="h-5 w-5" />
                            <span>Escanea este código QR con tu WhatsApp</span>
                        </div>
                        <div className="rounded-lg bg-white p-4">
                            <img src={qrDataUrl} alt="WhatsApp QR Code" className="h-[300px] w-[300px]" />
                        </div>
                        <div className="max-w-md space-y-2 text-center text-sm text-muted-foreground">
                            <p>1. Abre WhatsApp en tu teléfono</p>
                            <p>2. Ve a Configuración → Dispositivos vinculados</p>
                            <p>3. Toca en "Vincular un dispositivo"</p>
                            <p>4. Escanea este código QR</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {status === 'CONNECTED' ? (
                        <Button onClick={handleDisconnect} disabled={loading} variant="destructive">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Desconectar
                        </Button>
                    ) : (
                        <Button onClick={handleConnect} disabled={loading || status === 'CONNECTING'}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {status === 'QR_REQUIRED' ? 'Reintentar' : 'Conectar'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
