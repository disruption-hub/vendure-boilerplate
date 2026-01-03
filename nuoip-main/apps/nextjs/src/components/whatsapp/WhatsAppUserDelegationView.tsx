'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserCheck, Bot, User, Loader2 } from 'lucide-react'
import { toast } from '@/stores'

interface WhatsAppMessage {
  id: string
  messageId: string
  remoteJid: string
  content: string | null
  fromMe: boolean
  timestamp: Date
  status: string
}

export function WhatsAppUserDelegationView() {
  const { user } = useAuthStore()
  const [pendingMessages, setPendingMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingMessages()
    // Refresh every 10 seconds
    const interval = setInterval(loadPendingMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingMessages = async () => {
    try {
      // Get messages that need user attention
      const response = await authenticatedFetch('/api/whatsapp/messages?status=PENDING&limit=50')
      if (response.ok) {
        const data = await response.json()
        // Filter messages that are not from me (incoming messages)
        const incoming = (data.messages || []).filter((m: WhatsAppMessage) => !m.fromMe)
        setPendingMessages(incoming)
      }
    } catch (error) {
      console.error('Failed to load pending messages', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelegateToFlowBot = async (messageId: string, jid: string) => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/delegate', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          jid,
          action: 'delegate-to-flowbot',
        }),
      })

      if (response.ok) {
        toast.success('Mensaje delegado a FlowBot')
        await loadPendingMessages()
      } else {
        toast.error('Error al delegar mensaje')
      }
    } catch (error) {
      toast.error('Error al delegar mensaje')
    }
  }

  const handleTakeControl = async (messageId: string, jid: string) => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/delegate', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          jid,
          action: 'take-control',
        }),
      })

      if (response.ok) {
        toast.success('Control del mensaje tomado')
        await loadPendingMessages()
      } else {
        toast.error('Error al tomar control')
      }
    } catch (error) {
      toast.error('Error al tomar control')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-black">Delegación de Mensajes</h2>
        </div>
        <Alert className="bg-white border-gray-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-black">Cargando mensajes...</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg">
      <div className="flex items-center gap-2">
        <UserCheck className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold text-black">Delegación de Mensajes</h2>
      </div>
      <p className="text-gray-600">
        Gestiona mensajes que requieren atención manual o delegación a FlowBot
      </p>

      {pendingMessages.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400" />
              <p className="text-black">No hay mensajes pendientes</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingMessages.map((message) => (
            <Card key={message.id} className="bg-white border-gray-200">
              <CardHeader className="bg-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-black">{message.remoteJid}</CardTitle>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendiente</Badge>
                </div>
                <CardDescription className="text-gray-600">
                  {new Date(message.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white">
                <p className="text-sm mb-4 text-black">{message.content || '(Sin contenido)'}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelegateToFlowBot(message.messageId, message.remoteJid)}
                    className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Delegar a FlowBot
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleTakeControl(message.messageId, message.remoteJid)}
                    className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Tomar Control
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

