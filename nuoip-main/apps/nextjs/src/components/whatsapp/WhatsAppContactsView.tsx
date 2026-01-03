'use client'

import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, MessageCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/stores'

export function WhatsAppContactsView() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSessionId) {
      loadContacts()
    }
  }, [selectedSessionId])

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

  const loadContacts = async () => {
    if (!selectedSessionId) return

    setLoading(true)
    try {
      const response = await authenticatedFetch(`/api/whatsapp/contacts?sessionId=${selectedSessionId}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
        if (data.contacts?.length === 0) {
          toast.info('Sin contactos', 'No hay contactos disponibles para esta sesión')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar los contactos')
      }
    } catch (error) {
      console.error('Failed to load contacts', error)
      toast.error('Error', 'Error al cargar los contactos')
    } finally {
      setLoading(false)
    }
  }

  const loadContactMessages = async (contactId: string) => {
    setLoadingMessages(true)
    try {
      const response = await authenticatedFetch(`/api/whatsapp/chat-messages?contactId=${encodeURIComponent(contactId)}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        if (data.messages?.length === 0) {
          toast.info('Sin mensajes', `No hay mensajes para este contacto`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'No se pudieron cargar los mensajes')
      }
    } catch (error) {
      console.error('Failed to load messages', error)
      toast.error('Error', 'Error al cargar los mensajes')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact)
    // Use chatbotContact ID if available, otherwise use WhatsAppContact ID
    const contactId = contact.chatbotContact?.id || contact.id
    loadContactMessages(contactId)
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
    setMessages([])
  }

  const filteredContacts = contacts.filter((contact) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.phoneNumber?.toLowerCase().includes(query) ||
        contact.jid?.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (loading && contacts.length === 0) {
    return (
      <Alert className="bg-white border-gray-200">
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <AlertDescription className="text-black">Cargando contactos...</AlertDescription>
      </Alert>
    )
  }

  if (selectedContact) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToContacts}
              className="bg-white text-black border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Contactos
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-black">Mensajes de {selectedContact.name || selectedContact.jid}</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Historial de mensajes con este contacto
          </p>
        </div>

        {/* Message History */}
        {loadingMessages ? (
          <Alert className="bg-white border-gray-200">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            <AlertDescription className="text-black">Cargando mensajes...</AlertDescription>
          </Alert>
        ) : messages.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6 bg-white">
              <div className="text-center text-gray-600">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400" />
                <p className="text-black">No hay mensajes disponibles</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id} className={message.fromMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}>
                <CardHeader className={message.fromMe ? 'bg-blue-50' : 'bg-white'}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium text-black">{message.fromMe ? 'Enviado' : 'Recibido'}</CardTitle>
                      <Badge variant={message.fromMe ? 'default' : 'outline'} className={message.fromMe ? 'bg-green-600 text-white' : 'bg-white text-black border-gray-300'}>
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
          <Users className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-black">Contactos</h2>
        </div>
        <p className="text-gray-600 mt-1">
          Lista de contactos y grupos de WhatsApp. Haz clic en un contacto para ver el historial de mensajes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contactos..."
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
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 bg-white">
            <div className="text-center text-gray-600">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400" />
              <p className="text-black">No hay contactos disponibles</p>
              {searchQuery && <p className="text-sm mt-2 text-gray-600">Intenta con otros términos de búsqueda</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card
              key={contact.id}
              className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleContactClick(contact)}
            >
              <CardHeader className="bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 text-black">
                      {contact.name || contact.jid}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {contact.phoneNumber || contact.jid}
                    </CardDescription>
                  </div>
                  {contact.isGroup && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Grupo</Badge>
                  )}
                  {contact.isBusiness && (
                    <Badge variant="outline" className="bg-white text-black border-gray-300">Negocio</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>{contact.unreadCount || 0} sin leer</span>
                  </div>
                  {contact.lastMessageAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(contact.lastMessageAt).toLocaleDateString()}
                    </span>
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
