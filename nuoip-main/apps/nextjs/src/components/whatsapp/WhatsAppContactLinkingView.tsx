'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { authenticatedFetch } from '@/features/admin/api/admin-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Link2, Search, UserPlus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/stores'

export function WhatsAppContactLinkingView() {
  const { user } = useAuthStore()
  const [contacts, setContacts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [chatbotContacts, setChatbotContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [linkingMode, setLinkingMode] = useState<'user' | 'chatbot'>('user')

  useEffect(() => {
    loadSessions()
  }, [user])

  useEffect(() => {
    if (selectedSessionId) {
      loadContacts()
      loadUsers()
      loadChatbotContacts()
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
      }
    } catch (error) {
      console.error('Failed to load sessions', error)
    }
  }

  const loadContacts = async () => {
    if (!selectedSessionId) return

    try {
      const response = await authenticatedFetch(`/api/whatsapp/contacts?sessionId=${selectedSessionId}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to load contacts', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await authenticatedFetch('/api/user/list')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users', error)
    }
  }

  const loadChatbotContacts = async () => {
    try {
      const response = await authenticatedFetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setChatbotContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to load chatbot contacts', error)
    }
  }

  const handleLink = async (whatsappContactId: string, targetId: string) => {
    try {
      const response = await authenticatedFetch('/api/whatsapp/contacts/link', {
        method: 'POST',
        body: JSON.stringify({
          whatsappContactId,
          targetId,
          targetType: linkingMode,
        }),
      })

      if (response.ok) {
        toast.success('Contacto vinculado exitosamente')
        await loadContacts()
      } else {
        toast.error('Error al vincular contacto')
      }
    } catch (error) {
      toast.error('Error al vincular contacto')
    }
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando contactos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vinculación de Contactos</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Vincula contactos de WhatsApp con usuarios o contactos de FlowBot
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
            <SelectTrigger id="whatsapp-session-select" name="sessionId" className="w-[200px]">
              <SelectValue placeholder="Seleccionar sesión" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.sessionId} value={s.sessionId}>
                  {s.name || s.sessionId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={linkingMode} onValueChange={(v: 'user' | 'chatbot') => setLinkingMode(v)}>
            <SelectTrigger id="linking-mode-select" name="linkingMode" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuarios</SelectItem>
              <SelectItem value="chatbot">FlowBot</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          id="whatsapp-contacts-search"
          name="searchQuery"
          placeholder="Buscar contactos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-slate-500">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay contactos disponibles</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{contact.name || contact.jid}</CardTitle>
                    <CardDescription className="text-gray-700 dark:text-gray-300">
                      {contact.phoneNumber || contact.jid}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.userId && (
                      <Badge variant="default">Vinculado a Usuario</Badge>
                    )}
                    {contact.chatbotContactId && (
                      <Badge variant="secondary">Vinculado a FlowBot</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {contact.userId || contact.chatbotContactId ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Ya está vinculado
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor={`link-select-${contact.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Vincular a {linkingMode === 'user' ? 'Usuario' : 'Contacto FlowBot'}
                    </label>
                    <div className="flex gap-2">
                      {linkingMode === 'user' ? (
                        <Select
                          onValueChange={(userId) => handleLink(contact.id, userId)}
                        >
                          <SelectTrigger id={`link-select-${contact.id}`} name="targetId" className="flex-1">
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          onValueChange={(contactId) => handleLink(contact.id, contactId)}
                        >
                          <SelectTrigger id={`link-select-${contact.id}`} name="targetId" className="flex-1">
                            <SelectValue placeholder="Seleccionar contacto FlowBot" />
                          </SelectTrigger>
                          <SelectContent>
                            {chatbotContacts.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

