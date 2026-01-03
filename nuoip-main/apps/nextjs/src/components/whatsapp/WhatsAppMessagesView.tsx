'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MessageSquare, Search, Send, ArrowUpDown, MessageCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/stores'

export function WhatsAppMessagesView() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedContactJid, setSelectedContactJid] = useState<string | null>(null)
  const [contactMessages, setContactMessages] = useState<any[]>([])
  const [loadingContactMessages, setLoadingContactMessages] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [user])

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages()
    }
  }, [selectedSessionId, filterStatus])

  const loadSessions = async () => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        if (data.sessions?.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].sessionId)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar las sesiones')
      }
    } catch (error) {
      console.error('Failed to load sessions', error)
      toast.error('Error', 'Error al cargar las sesiones de WhatsApp')
    }
  }

  const loadMessages = async () => {
    if (!selectedSessionId) return

    setLoading(true)
    try {
      const response = await authenticatedFetch(`/api/whatsapp/messages?sessionId=${selectedSessionId}&status=${filterStatus}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        if (data.messages?.length === 0 && filterStatus !== 'all') {
          toast.info('Sin mensajes', `No hay mensajes con estado ${filterStatus}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar los mensajes')
      }
    } catch (error) {
      console.error('Failed to load messages', error)
      toast.error('Error', 'Error al cargar los mensajes')
    } finally {
      setLoading(false)
    }
  }

  const loadContactMessages = async (remoteJid: string) => {
    setLoadingContactMessages(true)
    setSelectedContactJid(remoteJid)
    try {
      // Find the contact by JID to get the contactId
      const contactsResponse = await authenticatedFetch(`/api/whatsapp/contacts?sessionId=${selectedSessionId}`)
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        const contact = contactsData.contacts?.find((c: any) => c.jid === remoteJid)
        if (contact) {
          // Use chatbotContact ID if available, otherwise use WhatsAppContact ID
          const contactId = contact.chatbotContact?.id || contact.id
          const response = await authenticatedFetch(`/api/whatsapp/chat-messages?contactId=${encodeURIComponent(contactId)}`)
          if (response.ok) {
            const data = await response.json()
            setContactMessages(data.messages || [])
          } else {
            toast.error('Error', 'No se pudieron cargar los mensajes del contacto')
          }
        } else {
          toast.error('Error', 'No se encontró el contacto')
        }
      }
    } catch (error) {
      console.error('Failed to load contact messages', error)
      toast.error('Error', 'Error al cargar los mensajes del contacto')
    } finally {
      setLoadingContactMessages(false)
    }
  }

  const handleBackToMessages = () => {
    setSelectedContactJid(null)
    setContactMessages([])
  }

  const filteredMessages = messages.filter((msg) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        msg.content?.toLowerCase().includes(query) ||
        msg.remoteJid?.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (loading && messages.length === 0) {
    return (
      <Alert className="bg-white border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <AlertDescription className="text-black">Cargando mensajes...</AlertDescription>
      </Alert>
    )
  }

  if (selectedContactJid) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToMessages}
              className="bg-white text-black border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Mensajes
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-black">Conversación con {selectedContactJid}</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Historial completo de mensajes con este contacto
          </p>
        </div>

        {/* Contact Messages */}
        {loadingContactMessages ? (
          <Alert className="bg-white border-gray-200">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            <AlertDescription className="text-black">Cargando conversación...</AlertDescription>
          </Alert>
        ) : contactMessages.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6 bg-white">
              <div className="text-center text-gray-600">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400" />
                <p className="text-black">No hay mensajes en esta conversación</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contactMessages.map((message) => (
              <Card key={message.id} className={message.fromMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}>
                <CardHeader className={message.fromMe ? 'bg-blue-50' : 'bg-white'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-black">{message.fromMe ? 'Enviado' : 'Recibido'}</CardTitle>
                      <Badge
                        variant={
                          message.status === 'READ'
                            ? 'default'
                            : message.status === 'DELIVERED'
                              ? 'secondary'
                              : message.status === 'FAILED'
                                ? 'destructive'
                                : 'outline'
                        }
                        className={
                          message.status === 'READ'
                            ? 'bg-green-600 text-white'
                            : message.status === 'DELIVERED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : message.status === 'FAILED'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-white text-black border-gray-300'
                        }
                      >
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={message.fromMe ? 'bg-blue-50' : 'bg-white'}>
                  <p className="text-sm mb-2 text-black">{message.content || '(Sin contenido)'}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{new Date(message.timestamp).toLocaleString()}</span>
                    {message.messageType !== 'TEXT' && (
                      <Badge variant="outline" className="text-xs bg-white text-black border-gray-300">
                        {message.messageType}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-black">Mensajes enviados</h2>
        </div>
        <p className="text-gray-600 mt-1">
          Historial completo de mensajes enviados de WhatsApp. Haz clic en un mensaje para ver la conversación completa.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar mensajes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-black border-gray-300"
            />
          </div>
        </div>
        <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white text-black border-gray-300">
            <SelectValue placeholder="Seleccionar sesión" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            {sessions.map((s) => (
              <SelectItem key={s.sessionId} value={s.sessionId} className="text-black">
                {s.name || s.sessionId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white text-black border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all" className="text-black">Todos</SelectItem>
            <SelectItem value="PENDING" className="text-black">Pendientes</SelectItem>
            <SelectItem value="SENT" className="text-black">Enviados</SelectItem>
            <SelectItem value="DELIVERED" className="text-black">Entregados</SelectItem>
            <SelectItem value="READ" className="text-black">Leídos</SelectItem>
            <SelectItem value="FAILED" className="text-black">Fallidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 bg-white">
            <div className="text-center text-gray-600">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400" />
              <p className="text-black">No hay mensajes disponibles</p>
              {searchQuery && <p className="text-sm mt-2 text-gray-600">Intenta con otros términos de búsqueda</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`${message.fromMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => loadContactMessages(message.remoteJid)}
            >
              <CardHeader className={message.fromMe ? 'bg-blue-50' : 'bg-white'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-black">{message.remoteJid}</CardTitle>
                    <Badge variant={message.fromMe ? 'default' : 'outline'} className={message.fromMe ? 'bg-green-600 text-white' : 'bg-white text-black border-gray-300'}>
                      {message.fromMe ? 'Enviado' : 'Recibido'}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      message.status === 'READ'
                        ? 'default'
                        : message.status === 'DELIVERED'
                          ? 'secondary'
                          : message.status === 'FAILED'
                            ? 'destructive'
                            : 'outline'
                    }
                    className={
                      message.status === 'READ'
                        ? 'bg-green-600 text-white'
                        : message.status === 'DELIVERED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : message.status === 'FAILED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-white text-black border-gray-300'
                    }
                  >
                    {message.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className={message.fromMe ? 'bg-blue-50' : 'bg-white'}>
                <p className="text-sm mb-2 text-black">{message.content || '(Sin contenido)'}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{new Date(message.timestamp).toLocaleString()}</span>
                  {message.messageType !== 'TEXT' && (
                    <Badge variant="outline" className="text-xs bg-white text-black border-gray-300">
                      {message.messageType}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
