'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores'
import { toast } from '@/stores'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Ticket,
  Search,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  MessageSquare,
  Calendar,
  Tag as TagIcon,
  Smile,
  Meh,
  Frown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createCrmFacade } from '@/domains/crm/facade'
import { createHttpCrmGateway } from '@/domains/crm/adapters/http-crm-gateway'
import type { TicketSummary, TicketDetails, TicketType, TicketStatus, TicketPriority, TicketSentiment } from '@/domains/crm/contracts'

type TicketSessionContext = {
  sessionId?: string
  totalMessages?: number
  selectedMessages?: number
  conversationStart?: string
}

const normalizeSessionContext = (raw: unknown): TicketSessionContext => {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const record = raw as Record<string, unknown>

  return {
    sessionId: typeof record.sessionId === 'string' ? record.sessionId : undefined,
    totalMessages: typeof record.totalMessages === 'number' ? record.totalMessages : undefined,
    selectedMessages: typeof record.selectedMessages === 'number' ? record.selectedMessages : undefined,
    conversationStart: typeof record.conversationStart === 'string' ? record.conversationStart : undefined,
  }
}

// Note: SupportTicket interface removed - now using TicketSummary and TicketDetails from contracts

const TICKET_TYPES: Array<{ id: TicketType; label: string; icon: string; color: string }> = [
  { id: 'help_desk', label: 'Soporte al Cliente', icon: '🎧', color: 'bg-blue-500' },
  { id: 'system_feature', label: 'Nueva Funcionalidad', icon: '✨', color: 'bg-purple-500' },
  { id: 'system_bug', label: 'Error del Sistema', icon: '🐛', color: 'bg-red-500' },
]

const TICKET_STATUSES: Array<{ id: TicketStatus; label: string; color: string; bgColor: string }> = [
  { id: 'open', label: 'Abierto', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'in_progress', label: 'En Progreso', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'resolved', label: 'Resuelto', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'closed', label: 'Cerrado', color: 'text-gray-600', bgColor: 'bg-gray-100' },
]

const TICKET_PRIORITIES: Array<{ id: TicketPriority; label: string; color: string; bgColor: string }> = [
  { id: 'low', label: 'Baja', color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'medium', label: 'Media', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { id: 'high', label: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { id: 'urgent', label: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-100' },
]

const SENTIMENT_META: Record<TicketSentiment, { label: string; color: string; bgColor: string; Icon: typeof Smile }> = {
  positive: { label: 'Positivo', color: 'text-emerald-600', bgColor: 'bg-emerald-100', Icon: Smile },
  neutral: { label: 'Neutral', color: 'text-slate-600', bgColor: 'bg-slate-200', Icon: Meh },
  negative: { label: 'Negativo', color: 'text-rose-600', bgColor: 'bg-rose-100', Icon: Frown },
}

export function TicketManager() {
  const { user } = useAuthStore()
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TicketType | 'all'>('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)

  const crmFacade = useMemo(
    () => createCrmFacade({ gateway: createHttpCrmGateway() }),
    []
  )

  // Load tickets from API
  const loadTickets = useCallback(async () => {
    if (!user?.tenantId) return

    setLoading(true)
    try {
      const query: any = {
        tenantId: user.tenantId,
        limit: 100,
      }
      if (statusFilter !== 'all') query.status = statusFilter
      if (typeFilter !== 'all') query.type = typeFilter
      if (searchTerm) query.search = searchTerm

      const fetchedTickets = await crmFacade.listTickets(query)
      setTickets(fetchedTickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }, [crmFacade, user?.tenantId, statusFilter, typeFilter, searchTerm])

  // Load ticket details
  const loadTicketDetails = useCallback(async (ticketId: string) => {
    if (!user?.tenantId) return

    try {
      const details = await crmFacade.getTicket(ticketId, user.tenantId)
      setSelectedTicket(details)
      setShowTicketDialog(true)
    } catch (error) {
      console.error('Error loading ticket details:', error)
      toast.error('Error al cargar detalles del ticket')
    }
  }, [crmFacade, user?.tenantId])

  // Load tickets on mount and when filters change
  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Filtering is now done in the API query, so just return tickets
  const filteredTickets = tickets

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    const priorityData = TICKET_PRIORITIES.find(p => p.id === priority)
    return priorityData?.color || 'text-gray-600'
  }

  const handleStatusChange = useCallback(async (ticketId: string, newStatus: TicketStatus) => {
    if (!user?.tenantId || !user.id) return

    try {
      await crmFacade.updateTicket({
        ticketId,
        tenantId: user.tenantId,
        userId: user.id,
        status: newStatus,
      })

      // Update local state optimistically
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
          : ticket
      ))

      toast.success('Estado del ticket actualizado')
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Error al actualizar el estado del ticket')
    }
  }, [crmFacade, user?.tenantId, user?.id])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Tickets</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión completa de soporte al cliente con análisis inteligente
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1">
            {filteredTickets.length} tickets
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="tickets-search"
                  name="ticketsSearch"
                  placeholder="Buscar tickets por título, cliente o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: TicketStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="tickets-status-filter" name="statusFilter" className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TICKET_STATUSES.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: TicketType | 'all') => setTypeFilter(value)}>
                <SelectTrigger id="tickets-type-filter" name="typeFilter" className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TICKET_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTickets.map((ticket) => {
          const ticketType = TICKET_TYPES.find(t => t.id === ticket.type)
          const ticketStatus = TICKET_STATUSES.find(s => s.id === ticket.status)
          const sentimentInfo = ticket.sentiment ? SENTIMENT_META[ticket.sentiment] : null
          const SentimentIcon = sentimentInfo?.Icon

          return (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{ticketType?.icon}</span>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{ticket.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {ticketType?.label}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", ticketStatus?.color)}
                  >
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{ticketStatus?.label}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{ticket.customerName}</span>
                  {ticket.customerEmail && (
                    <span className="text-gray-400">• {ticket.customerEmail}</span>
                  )}
                </div>

                {/* AI Summary */}
                {ticket.summary && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-purple-600 dark:text-purple-400">🤖</span>
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Resumen IA</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {ticket.summary}
                    </p>
                  </div>
                )}

                {/* Priority and Assignment */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", getPriorityColor(ticket.priority))}>
                      Prioridad: {TICKET_PRIORITIES.find(p => p.id === ticket.priority)?.label}
                    </span>
                    {ticket.assignedTo && (
                      <Badge variant="secondary" className="text-xs">
                        Asignado: {ticket.assignedTo}
                      </Badge>
                    )}
                  </div>
                </div>

                {sentimentInfo && SentimentIcon ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={cn('flex items-center gap-1 px-2 py-1 border-transparent', sentimentInfo.bgColor)}
                    >
                      <SentimentIcon className={cn('h-3 w-3', sentimentInfo.color)} />
                      <span className={sentimentInfo.color}>{sentimentInfo.label}</span>
                    </Badge>
                    {ticket.sentimentSummary ? (
                      <span className="text-gray-500 line-clamp-1">{ticket.sentimentSummary}</span>
                    ) : null}
                  </div>
                ) : null}

                {/* Session Context */}
                {(() => {
                  const sessionContext = normalizeSessionContext(ticket.sessionContext)
                  if (
                    !sessionContext.sessionId &&
                    sessionContext.totalMessages == null
                  ) {
                    return null
                  }

                  return (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        {sessionContext.sessionId ? (
                          <div>
                            Sesión: {sessionContext.sessionId.slice(-6)}
                          </div>
                        ) : null}
                        {sessionContext.totalMessages != null ? (
                          <div>Mensajes: {sessionContext.totalMessages}</div>
                        ) : null}
                      </div>
                    </div>
                  )
                })()}

                {/* Tags */}
                {ticket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {ticket.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{ticket.tags.length - 3} más
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(ticket.updatedAt)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadTicketDetails(ticket.id)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Select
                      value={ticket.status}
                      onValueChange={(value: TicketStatus) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TICKET_STATUSES.map(status => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron tickets
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay tickets creados aún'
            }
          </p>
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Ticket className="h-5 w-5" />
              <span>Detalles del Ticket</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {TICKET_TYPES.find(t => t.id === selectedTicket.type)?.icon}{' '}
                    {TICKET_TYPES.find(t => t.id === selectedTicket.type)?.label}
                  </p>
                  {selectedTicket.assignedToName ? (
                    <p className="text-xs text-gray-500 mt-2">
                      Asignado a: <span className="font-medium text-gray-700">{selectedTicket.assignedToName}</span>
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    "mb-2",
                    TICKET_STATUSES.find(s => s.id === selectedTicket.status)?.bgColor,
                    TICKET_STATUSES.find(s => s.id === selectedTicket.status)?.color
                  )}>
                    {TICKET_STATUSES.find(s => s.id === selectedTicket.status)?.label}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Prioridad: <span className={getPriorityColor(selectedTicket.priority)}>
                      {TICKET_PRIORITIES.find(p => p.id === selectedTicket.priority)?.label}
                    </span>
                  </p>
                </div>
              </div>

              {selectedTicket.sentiment ? (() => {
                const sentimentInfo = SENTIMENT_META[selectedTicket.sentiment]
                const SentimentIcon = sentimentInfo?.Icon
                if (!sentimentInfo || !SentimentIcon) {
                  return null
                }
                return (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SentimentIcon className={cn('h-4 w-4', sentimentInfo.color)} />
                        <span className="text-sm font-semibold text-gray-700">
                          Sentimiento detectado: <span className={sentimentInfo.color}>{sentimentInfo.label}</span>
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[11px] border-gray-200 text-gray-600">
                        Análisis IA
                      </Badge>
                    </div>
                    {selectedTicket.sentimentSummary ? (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selectedTicket.sentimentSummary}
                      </p>
                    ) : null}
                  </div>
                )
              })() : null}

              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Nombre:</strong> {selectedTicket.customerName}</div>
                  <div><strong>Email:</strong> {selectedTicket.customerEmail || 'No disponible'}</div>
                  <div><strong>ID:</strong> {selectedTicket.customerId}</div>
                  <div><strong>Creado:</strong> {formatDate(selectedTicket.createdAt)}</div>
                </div>
              </div>

              {/* AI Summary */}
              {selectedTicket.summary && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium mb-2 flex items-center text-purple-700 dark:text-purple-300">
                    <span className="text-lg mr-2">🤖</span>
                    Resumen Inteligente (IA)
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {selectedTicket.summary}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Descripción del Problema
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Session Context */}
              {(() => {
                const sessionContext = normalizeSessionContext(selectedTicket.sessionContext)
                const hasSessionContext =
                  sessionContext.sessionId ||
                  sessionContext.totalMessages != null ||
                  sessionContext.selectedMessages != null ||
                  sessionContext.conversationStart

                if (!hasSessionContext) {
                  return null
                }

                return (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium mb-2 flex items-center text-blue-700 dark:text-blue-300">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contexto de la Conversación
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {sessionContext.sessionId ? (
                        <div>
                          <strong>Sesión:</strong><br />
                          <span className="font-mono text-xs">{sessionContext.sessionId}</span>
                        </div>
                      ) : null}
                      {sessionContext.totalMessages != null ? (
                        <div>
                          <strong>Total Mensajes:</strong><br />
                          {sessionContext.totalMessages}
                        </div>
                      ) : null}
                      {sessionContext.selectedMessages != null ? (
                        <div>
                          <strong>Mensajes Seleccionados:</strong><br />
                          {sessionContext.selectedMessages}
                        </div>
                      ) : null}
                      {sessionContext.conversationStart ? (
                        <div>
                          <strong>Inicio:</strong><br />
                          {formatDate(sessionContext.conversationStart)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })()}

              {/* Tags */}
              {selectedTicket.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2" />
                    Etiquetas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    // Handle ticket update logic here
                    setShowTicketDialog(false)
                    toast.success('Funcionalidad de edición próximamente disponible')
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
