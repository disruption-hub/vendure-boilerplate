"use client"

import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  UserPlus,
  Share2,
  Smile,
  Meh,
  Frown,
  Loader2,
  UserCheck,
  FileText,
  Paperclip,
  X,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createCrmFacade } from '../facade'
import { createHttpCrmGateway } from '../adapters/http-crm-gateway'
import type { CrmContactProfile } from './CrmChatPanel'
import type {
  TicketSummary,
  TicketDetails,
  TicketType,
  TicketPriority,
  TicketStatus,
  CrmCustomerSummary,
  TicketSentiment,
  TicketRealtimeEvent,
  TicketRealtimeListener,
  ListTicketsQuery,
} from '../contracts'
import { toast } from '@/stores'
import { formatTicketNumber, formatTicketUpdateCode } from '@/domains/crm/utils/ticket-number'
import { FileValidator } from '@/lib/utils/file-validator'

type TicketPanelTab = 'list' | 'create' | 'detail'

export interface TicketPanelCommand {
  id: string
  type: 'open-create'
  payload?: {
    title?: string
    description?: string
    priority?: TicketPriority
    tags?: string[]
  }
}

type ConversationSnippet = { role: 'user' | 'assistant'; content: string; timestamp?: string }

interface TicketPanelProps {
  tenantId: string
  sessionToken: string | null
  currentUserId: string
  currentUserName: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  contactProfile?: CrmContactProfile | null
  onRegisterContact?: () => Promise<CrmCustomerSummary | null>
  registerContactLoading?: boolean
  onOpenContactUpdate?: () => void
  updateContactLoading?: boolean
  onRedirectToAdmin?: () => void
  hideContactCard?: boolean
  customers: CrmCustomerSummary[]
  loadingCustomers: boolean
  onSelectCustomer: (customerId: string) => void
  onCreateCustomer: (input: { name: string; email: string; phone: string }) => Promise<CrmCustomerSummary | null>
  onInsertTicketMessage: (message: string) => void
  assignees: Array<{ id: string; name: string; email?: string | null }>
  conversationMessages?: ConversationSnippet[]
  registerTicketEventListener?: (listener: TicketRealtimeListener) => () => void
  command?: TicketPanelCommand | null
  onCommandHandled?: (commandId: string) => void
}

const TICKET_TYPES: Array<{ value: TicketType; label: string; icon: string; bgColor: string }> = [
  { value: 'help_desk', label: 'Soporte al Cliente', icon: '🎧', bgColor: 'bg-blue-600' },
  { value: 'system_feature', label: 'Nueva Funcionalidad', icon: '✨', bgColor: 'bg-purple-700' },
  { value: 'system_bug', label: 'Error del Sistema', icon: '🐛', bgColor: 'bg-red-600' },
]

const TICKET_PRIORITIES: Array<{ value: TicketPriority; label: string; color: string }> = [
  { value: 'low', label: 'Baja', color: 'text-green-600' },
  { value: 'medium', label: 'Media', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
]

const PRIORITY_SORT_ORDER: Record<TicketPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const TICKET_STATUSES: Array<{ value: TicketStatus; label: string; icon: LucideIcon; color: string }> = [
  { value: 'open', label: 'Abierto', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'in_progress', label: 'En Progreso', icon: Clock, color: 'text-blue-500' },
  { value: 'resolved', label: 'Resuelto', icon: CheckCircle, color: 'text-green-500' },
  { value: 'closed', label: 'Cerrado', icon: XCircle, color: 'text-gray-500' },
]

const STATUS_FILTER_OPTIONS: Array<{ value: TicketStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  ...TICKET_STATUSES.map(status => ({ value: status.value, label: status.label })),
]

const PRIORITY_FILTER_OPTIONS: Array<{ value: TicketPriority | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  ...TICKET_PRIORITIES.map(priority => ({ value: priority.value, label: priority.label })),
]

const SORT_OPTIONS: Array<{ value: 'recent' | 'oldest' | 'priority'; label: string }> = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'priority', label: 'Mayor prioridad' },
]

const SENTIMENT_META: Record<TicketSentiment, { label: string; color: string; bg: string; Icon: LucideIcon }> = {
  positive: { label: 'Positivo', color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: Smile },
  neutral: { label: 'Neutral', color: 'text-slate-600', bg: 'bg-slate-200', Icon: Meh },
  negative: { label: 'Negativo', color: 'text-rose-600', bg: 'bg-rose-100', Icon: Frown },
}

export function TicketPanel({
  tenantId,
  sessionToken,
  currentUserId,
  currentUserName,
  customerId,
  customerName,
  customerEmail,
  customerPhone,
  contactProfile,
  onRegisterContact,
  registerContactLoading,
  onOpenContactUpdate,
  updateContactLoading,
  hideContactCard,
  customers,
  loadingCustomers,
  onSelectCustomer,
  onCreateCustomer,
  onInsertTicketMessage,
  assignees,
  conversationMessages,
  registerTicketEventListener,
  command,
  onCommandHandled,
  onRedirectToAdmin,
}: TicketPanelProps) {
  const handleRegisterClick = useCallback(() => {
    if (onRegisterContact && !registerContactLoading) {
      void onRegisterContact()
    }
  }, [onRegisterContact, registerContactLoading])

  const handleOpenUpdateContact = useCallback(() => {
    if (onOpenContactUpdate && !updateContactLoading) {
      onOpenContactUpdate()
    }
  }, [onOpenContactUpdate, updateContactLoading])

  const handleRedirectToAdmin = useCallback(() => {
    if (onRedirectToAdmin) {
      onRedirectToAdmin()
    }
  }, [onRedirectToAdmin])

  const showContactProfileCard = useMemo(() => {
    if (hideContactCard) return false
    return Boolean(contactProfile && contactProfile.type !== 'flowbot')
  }, [contactProfile, hideContactCard])

  const contactRegistrationLabel = useMemo(() => {
    if (!contactProfile) {
      return null
    }
    if (contactProfile.type === 'flowbot') {
      return 'FlowBot'
    }
    if (contactProfile.isRegistered) {
      return 'Registrado en CRM'
    }
    if (contactProfile.canRegister) {
      return 'Sin registrar'
    }
    return 'Contacto CRM'
  }, [contactProfile])

  const contactEmail = contactProfile?.email?.trim() || null
  const contactPhone = contactProfile?.phone?.trim() || null
  const missingIdentifiers = useMemo(() => {
    if (!contactProfile) {
      return false
    }
    return !contactEmail && !contactPhone
  }, [contactProfile, contactEmail, contactPhone])

  const [activeTab, setActiveTab] = useState<TicketPanelTab>('list')
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'priority'>('priority')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    type: 'help_desk' as TicketType,
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    tags: [] as string[],
  })

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    content: '',
    isInternal: false,
  })

  const [commentAttachments, setCommentAttachments] = useState<File[]>([])
  const [isUploadingCommentAttachments, setIsUploadingCommentAttachments] = useState(false)
  const MAX_COMMENT_ATTACHMENTS = 5
  const [aiDraftLoading, setAiDraftLoading] = useState(false)

  const [assigneeId, setAssigneeId] = useState(currentUserId)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [prefillApplied, setPrefillApplied] = useState(false)
  const [autoSelectionApplied, setAutoSelectionApplied] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null)
  const customerStateRef = useRef<Record<string, { activeTab: TicketPanelTab; selectedTicketId?: string }>>({})
  const lastCustomerIdRef = useRef<string | undefined>(undefined)

  const sortTicketSummaries = useCallback(
    (input: TicketSummary[]): TicketSummary[] => {
      const entries = [...input]
      switch (sortOption) {
        case 'oldest':
          return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        case 'priority':
          return entries.sort(
            (a, b) => (PRIORITY_SORT_ORDER[b.priority] ?? 0) - (PRIORITY_SORT_ORDER[a.priority] ?? 0),
          )
        case 'recent':
        default:
          return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    },
    [sortOption],
  )

  type SlaInfo = {
    satisfied: boolean
    overdue: boolean
    remainingMs: number | null
  }

  const getSlaInfo = useCallback((targetIso?: string | null, satisfiedAt?: string | null, overrideSatisfied = false): SlaInfo | null => {
    if (!targetIso) {
      return null
    }

    const target = new Date(targetIso)
    if (Number.isNaN(target.getTime())) {
      return null
    }

    const satisfied = overrideSatisfied || Boolean(satisfiedAt)
    const remainingMs = satisfied ? 0 : target.getTime() - Date.now()

    return {
      satisfied,
      overdue: !satisfied && remainingMs < 0,
      remainingMs,
    }
  }, [])

  const getResponseSlaInfo = useCallback(
    (ticket: { responseTargetAt?: string | null; firstResponseAt?: string | null }): SlaInfo | null => {
      return getSlaInfo(ticket.responseTargetAt, ticket.firstResponseAt)
    },
    [getSlaInfo],
  )

  const getResolutionSlaInfo = useCallback(
    (ticket: { resolvedTargetAt?: string | null; resolvedAt?: string | null; status: TicketStatus }): SlaInfo | null => {
      const satisfied = ticket.status === 'resolved' || ticket.status === 'closed'
      return getSlaInfo(ticket.resolvedTargetAt, ticket.resolvedAt, satisfied)
    },
    [getSlaInfo],
  )

  const formatDuration = useCallback((ms: number) => {
    const absolute = Math.abs(ms)
    const minutes = Math.round(absolute / 60000)
    if (minutes < 1) {
      return '<1 min'
    }
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours < 24) {
      return `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ''}`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days} d${remainingHours ? ` ${remainingHours} h` : ''}`
  }, [])

  const describeSla = useCallback(
    (info: SlaInfo | null, label: string) => {
      if (!info) {
        return null
      }

      if (info.satisfied) {
        return {
          text: `${label}: cumplido`,
          className: 'text-emerald-300 border-emerald-500/40',
        }
      }

      const remaining = info.remainingMs ?? 0
      const durationLabel = formatDuration(Math.abs(remaining))

      if (info.overdue) {
        return {
          text: `${label}: vencido hace ${durationLabel}`,
          className: 'text-rose-300 border-rose-500/40',
        }
      }

      return {
        text: `${label}: restan ${durationLabel}`,
        className: 'text-sky-300 border-sky-500/40',
      }
    },
    [formatDuration],
  )

  const crmFacade = useMemo(
    () => createCrmFacade({ gateway: createHttpCrmGateway({ sessionToken }) }),
    [sessionToken]
  )

  useEffect(() => {
    if (prefillApplied) {
      return
    }

    if (!customerName && !customerEmail && !customerPhone) {
      return
    }

    setCustomerForm({
      name: customerName ?? '',
      email: customerEmail ?? '',
      phone: customerPhone ?? '',
    })
    setPrefillApplied(true)
  }, [customerName, customerEmail, customerPhone, prefillApplied])

  const activeCustomer = useMemo<CrmCustomerSummary | null>(() => {
    if (!customerId) {
      return null
    }
    const existing = customers.find(item => item.id === customerId)
    if (existing) {
      return existing
    }
    return {
      id: customerId,
      tenantId,
      name: customerName ?? 'Cliente sin nombre',
      email: customerEmail ?? null,
      phone: customerPhone ?? null,
      type: 'lead',
      status: null,
    }
  }, [customerId, customers, tenantId, customerName, customerEmail, customerPhone])

  useEffect(() => {
    if (autoSelectionApplied) {
      return
    }

    if (customerId) {
      setAutoSelectionApplied(true)
      return
    }

    if (!customers.length) {
      return
    }

    const normalizePhone = (value: string | null | undefined) =>
      value ? value.replace(/[^0-9+]/g, '') : ''

    const normalizedEmail = customerEmail?.trim().toLowerCase()
    const normalizedPhone = normalizePhone(customerPhone)

    const match = customers.find((candidate) => {
      const candidateEmail = candidate.email?.trim().toLowerCase()
      const candidatePhone = normalizePhone(candidate.phone)
      return Boolean(
        (normalizedEmail && candidateEmail === normalizedEmail) ||
        (normalizedPhone && candidatePhone === normalizedPhone && normalizedPhone.length >= 6)
      )
    })

    if (match) {
      onSelectCustomer(match.id)
      setAutoSelectionApplied(true)
      setShowCustomerForm(false)
    }
  }, [autoSelectionApplied, customerId, customers, customerEmail, customerPhone, onSelectCustomer])

  const loadTicketDetails = useCallback(async (ticketId: string) => {
    setLoading(true)
    try {
      const details = await crmFacade.getTicket(ticketId, tenantId)
      setSelectedTicket(details)
      setActiveTab('detail')
    } catch (error) {
      console.error('Failed to load ticket details:', error)
      toast.error('Error al cargar detalles del ticket')
    } finally {
      setLoading(false)
    }
  }, [crmFacade, tenantId])

  useEffect(() => {
    if (lastCustomerIdRef.current === customerId) {
      return
    }

    lastCustomerIdRef.current = customerId

    const key = customerId ?? '__none__'
    const snapshot = customerStateRef.current[key]

    setSelectedTicket(null)

    if (snapshot) {
      if (snapshot.activeTab && snapshot.activeTab !== activeTab) {
        setActiveTab(snapshot.activeTab)
      }

      if (snapshot.selectedTicketId) {
        if (snapshot.selectedTicketId !== selectedTicket?.id) {
          void loadTicketDetails(snapshot.selectedTicketId)
        }
      }
    } else {
      if (activeTab !== 'list') {
        setActiveTab('list')
      }
    }
  }, [customerId, activeTab, selectedTicket, loadTicketDetails, command])

  const lastHandledCommandIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!command || command.id === lastHandledCommandIdRef.current) {
      return
    }

    if (command.type === 'open-create') {
      setActiveTab('create')

      setCreateForm(prev => ({
        ...prev,
        title: command.payload?.title?.trim() || prev.title,
        description: command.payload?.description?.trim() || prev.description,
        priority: command.payload?.priority ?? prev.priority,
        tags: command.payload?.tags ?? prev.tags,
      }))

      requestAnimationFrame(() => {
        commentInputRef.current?.focus()
      })
    }

    lastHandledCommandIdRef.current = command.id
    onCommandHandled?.(command.id)
  }, [command, onCommandHandled])

  useEffect(() => {
    const key = customerId ?? '__none__'
    customerStateRef.current[key] = {
      activeTab,
      selectedTicketId: selectedTicket?.id,
    }
  }, [customerId, activeTab, selectedTicket?.id])

  const assigneeOptions = useMemo(() => {
    const deduped = new Map<string, { id: string; name: string; email?: string | null }>()

    assignees.forEach(option => {
      if (!option?.id) return
      const name = option.name?.trim() || option.email?.trim() || 'Sin nombre'
      deduped.set(option.id, { id: option.id, name, email: option.email ?? null })
    })

    if (currentUserId) {
      const name = currentUserName?.trim() || 'Yo'
      const existing = deduped.get(currentUserId)
      if (!existing) {
        deduped.set(currentUserId, { id: currentUserId, name, email: null })
      } else if (!existing.name && name) {
        deduped.set(currentUserId, { ...existing, name })
      }
    }

    return Array.from(deduped.values())
  }, [assignees, currentUserId, currentUserName])

  useEffect(() => {
    if (!assigneeOptions.length) {
      setAssigneeId(currentUserId)
      return
    }

    if (!assigneeOptions.some(option => option.id === assigneeId)) {
      setAssigneeId(assigneeOptions[0].id)
    }
  }, [assigneeOptions, assigneeId, currentUserId])

  // Load tickets for customer
  const loadTickets = useCallback(async () => {
    if (!customerId) {
      return
    }

    setLoading(true)
    try {
      const query: ListTicketsQuery = {
        tenantId,
        customerId,
        limit: 20,
      }

      if (statusFilter !== 'all') {
        query.status = statusFilter
      }
      if (priorityFilter !== 'all') {
        query.priority = priorityFilter
      }

      const fetchedTickets = await crmFacade.listTickets(query)
      setTickets(sortTicketSummaries(fetchedTickets))
    } catch (error) {
      console.error('Failed to load tickets:', error)
      toast.error('Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }, [customerId, crmFacade, priorityFilter, sortTicketSummaries, statusFilter, tenantId])

  // Auto-load tickets when customer or filters change
  useEffect(() => {
    if (!customerId) {
      setTickets([])
      return
    }
    void loadTickets()
  }, [customerId, statusFilter, priorityFilter, loadTickets])


  useEffect(() => {
    if (!registerTicketEventListener) {
      return
    }

    const listener: TicketRealtimeListener = (event: TicketRealtimeEvent) => {
      if (event.tenantId !== tenantId) {
        return
      }

      const ticketMatchesSelection = selectedTicket?.id === event.ticketId

      switch (event.type) {
        case 'created': {
          const matchesCustomer = !customerId || event.customerId === customerId
          if (matchesCustomer) {
            void loadTickets()
          }
          break
        }
        case 'updated':
        case 'comment_added': {
          void loadTickets()
          break
        }
        default:
          break
      }

      if (ticketMatchesSelection) {
        void loadTicketDetails(event.ticketId)
      }
    }

    const unsubscribe = registerTicketEventListener(listener)
    return () => {
      unsubscribe?.()
    }
  }, [
    registerTicketEventListener,
    tenantId,
    customerId,
    selectedTicket?.id,
    loadTickets,
    loadTicketDetails,
  ])

  const handleCreateCustomerInline = useCallback(async () => {
    const name = customerForm.name.trim()
    const email = customerForm.email.trim()
    const phone = customerForm.phone.trim()

    if (!name || !email || !phone) {
      toast.error('Completa los datos del cliente', 'Nombre, correo y teléfono son obligatorios.')
      return
    }

    if (!tenantId) {
      toast.error('Configuración inválida', 'No se pudo determinar el tenant del ticket.')
      return
    }

    setCreatingCustomer(true)
    try {
      const customer = await onCreateCustomer({ name, email, phone })
      if (customer) {
        setCustomerForm({ name: '', email: '', phone: '' })
        setShowCustomerForm(false)
        onSelectCustomer(customer.id)
        toast.success('Cliente registrado', `${customer.name} está listo para recibir seguimiento.`)
      }
    } catch (error) {
      console.error('TicketPanel: failed to create customer', error)
      toast.error('No se pudo crear el cliente', 'Intenta de nuevo o revisa los datos ingresados.')
    } finally {
      setCreatingCustomer(false)
    }
  }, [customerForm, onCreateCustomer, onSelectCustomer, tenantId, toast])

  const resolveTicketNumber = useCallback((ticket: { ticketNumber?: string | null; id: string; createdAt?: string }) => {
    if (ticket.ticketNumber && ticket.ticketNumber.trim()) {
      return ticket.ticketNumber.trim()
    }
    return formatTicketNumber(ticket.id, ticket.createdAt ?? new Date())
  }, [])

  const buildCustomerPortalUrl = useCallback((ticketId: string, phone?: string | null) => {
    const baseUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL?.replace(/\/$/, '')
    if (!baseUrl) {
      return null
    }
    const search = phone ? `?phone=${encodeURIComponent(phone)}` : ''
    return `${baseUrl}/tickets/${ticketId}${search}`
  }, [])

  const buildTicketShareMessage = useCallback((ticket: TicketDetails) => {
    const ticketNumber = resolveTicketNumber({ ticketNumber: ticket.ticketNumber, id: ticket.id, createdAt: ticket.createdAt })
    const portalUrl = buildCustomerPortalUrl(ticket.id, ticket.customerPhone)
    const priorityLabel = TICKET_PRIORITIES.find(item => item.value === ticket.priority)?.label ?? ticket.priority
    const statusLabel = TICKET_STATUSES.find(item => item.value === ticket.status)?.label ?? ticket.status
    const linkLine = portalUrl ? `\nConsulta tu caso en el portal: ${portalUrl}` : ''
    const summaryLine = ticket.summary || ticket.description
      ? `\nResumen: ${(ticket.summary || ticket.description || '').trim()}`
      : ''
    const followUpLine = '\nSi necesitas aclaraciones, responde en este chat y FlowBot registrará la actualización.'
    const updateCode = formatTicketUpdateCode(ticketNumber, 1)
    return `Ticket ${updateCode} creado (${statusLabel} • Prioridad ${priorityLabel}): ${ticket.title}${summaryLine}${linkLine}${followUpLine}`
  }, [buildCustomerPortalUrl, resolveTicketNumber])

  const handleShareTicketMessage = useCallback((ticket: TicketDetails) => {
    onInsertTicketMessage(buildTicketShareMessage(ticket))
    toast.success('Ticket preparado para compartir', 'Revisa el compositor del chat antes de enviarlo al cliente.')
  }, [buildTicketShareMessage, onInsertTicketMessage, toast])
  // Create ticket
  const handleCreateTicket = useCallback(async () => {
    const trimmedTitle = createForm.title.trim()
    const trimmedDescription = createForm.description.trim()

    if (!trimmedTitle || !trimmedDescription) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      let customer = activeCustomer

      if (!customer && contactProfile?.canRegister && onRegisterContact && !registerContactLoading) {
        try {
          const createdCustomer = await onRegisterContact()
          if (createdCustomer) {
            customer = createdCustomer
          }
        } catch (registerError) {
          console.error('Failed to auto-register contact before ticket creation:', registerError)
          toast.error('No se pudo registrar el cliente', 'Actualiza los datos e intenta de nuevo.')
        }
      }

      if (!customer) {
        toast.error('Selecciona un cliente', 'Vincula el ticket a un cliente antes de crearlo.')
        return
      }

      const ticket = await crmFacade.createTicket({
        tenantId,
        type: createForm.type,
        title: trimmedTitle,
        description: trimmedDescription,
        priority: createForm.priority,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email ?? undefined,
        customerPhone: customer.phone ?? undefined,
        createdById: currentUserId,
        assignedToId: assigneeId || currentUserId,
        tags: createForm.tags.length ? createForm.tags : undefined,
      })

      toast.success('Ticket creado exitosamente')
      setCreateForm({
        type: 'help_desk',
        title: '',
        description: '',
        priority: 'medium',
        tags: [],
      })
      setSelectedTicket(ticket)
      setActiveTab('detail')
      onInsertTicketMessage(buildTicketShareMessage(ticket))
      await loadTickets()
    } catch (error) {
      console.error('Failed to create ticket:', error)
      toast.error('Error al crear ticket')
    } finally {
      setLoading(false)
    }
  }, [
    crmFacade,
    tenantId,
    createForm,
    activeCustomer,
    currentUserId,
    assigneeId,
    loadTickets,
    onInsertTicketMessage,
    buildTicketShareMessage,
    toast,
    contactProfile,
    onRegisterContact,
    registerContactLoading,
  ])

  const handlePrefillWithAi = useCallback(async () => {
    if (!tenantId || !currentUserId) {
      toast.error('No se pudo determinar el contexto del ticket')
      return
    }

    setAiDraftLoading(true)
    try {
      const recentTickets = tickets.slice(0, 5).map(ticket => ({
        title: ticket.title,
        summary: ticket.summary,
        status: ticket.status,
        priority: ticket.priority,
      }))

      const conversationContext = (conversationMessages ?? [])
        .slice(-12)
        .map(message => ({
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        }))

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }

      const response = await fetch('/api/crm/tickets/draft', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          tenantId,
          currentUserId,
          customer: activeCustomer
            ? {
              id: activeCustomer.id,
              name: activeCustomer.name,
              email: activeCustomer.email,
              phone: activeCustomer.phone,
            }
            : null,
          existingDraft: {
            title: createForm.title,
            description: createForm.description,
            priority: createForm.priority,
            tags: createForm.tags,
          },
          recentTickets,
          conversationContext,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `HTTP ${response.status}`)
      }

      const payload = await response.json()
      const suggestion = payload?.suggestion ?? null

      if (!suggestion) {
        toast.error('No se pudo generar el borrador', 'Intenta nuevamente más tarde.')
        return
      }

      const normalizedPriority = (suggestion.priority ?? '').toLowerCase().trim()
      const isValidPriority = ['low', 'medium', 'high', 'urgent'].includes(normalizedPriority)

      setCreateForm(prev => {
        const nextTags = Array.isArray(suggestion.tags)
          ? suggestion.tags
            .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(Boolean)
          : prev.tags

        return {
          ...prev,
          title: suggestion.title?.trim() || prev.title,
          description: suggestion.description?.trim() || prev.description,
          priority: (isValidPriority ? normalizedPriority : prev.priority) as TicketPriority,
          tags: nextTags,
        }
      })

      toast.success('Borrador generado', 'Revisa los campos antes de crear el ticket.')
    } catch (error) {
      console.error('TicketPanel: AI draft failed', error)
      toast.error('No se pudo generar el borrador', error instanceof Error ? error.message : 'Intenta nuevamente.')
    } finally {
      setAiDraftLoading(false)
    }
  }, [tenantId, currentUserId, tickets, activeCustomer, createForm, toast, conversationMessages, sessionToken])

  const uploadCommentAttachments = useCallback(async () => {
    if (!commentAttachments.length) {
      return []
    }

    setIsUploadingCommentAttachments(true)
    try {
      const formData = new FormData()
      commentAttachments.forEach(file => formData.append('files', file))

      const headers: Record<string, string> = {}
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'No se pudieron subir los adjuntos')
      }

      const data = await response.json()
      const files = Array.isArray(data?.files) ? data.files : []

      return files.map((file: any) => ({
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        url: file.url,
      }))
    } catch (error) {
      console.error('TicketPanel: failed to upload comment attachments', error)
      toast.error('No se pudieron subir los adjuntos', error instanceof Error ? error.message : 'Intenta nuevamente')
      throw error
    } finally {
      setIsUploadingCommentAttachments(false)
    }
  }, [commentAttachments, sessionToken, toast])

  const triggerCommentAttachmentDialog = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt'
    input.onchange = event => {
      const target = event.target as HTMLInputElement
      const files = target.files ? Array.from(target.files) : []
      target.value = ''

      if (!files.length) {
        return
      }

      const validation = FileValidator.validateFiles(files)
      if (!validation.valid) {
        toast.error('Archivos inválidos', validation.error || 'Formato de archivo no permitido')
        return
      }

      setCommentAttachments(prev => {
        const merged = [...prev]

        files.forEach(file => {
          const exists = merged.some(existing => existing.name === file.name && existing.size === file.size)
          if (!exists) {
            merged.push(file)
          }
        })

        if (merged.length > MAX_COMMENT_ATTACHMENTS) {
          toast.error(`Máximo ${MAX_COMMENT_ATTACHMENTS} adjuntos por comentario`)
          return prev
        }

        return merged
      })
    }
    input.click()
  }, [MAX_COMMENT_ATTACHMENTS, toast])

  const handleRemoveCommentAttachment = useCallback((index: number) => {
    setCommentAttachments(prev => prev.filter((_, idx) => idx !== index))
  }, [])

  // Add comment
  const handleAddComment = useCallback(async () => {
    if (!selectedTicket || !commentForm.content.trim()) {
      toast.error('Escribe un comentario')
      return
    }

    if (isUploadingCommentAttachments) {
      return
    }

    setLoading(true)
    try {
      const attachments = await uploadCommentAttachments()

      await crmFacade.addTicketComment({
        ticketId: selectedTicket.id,
        tenantId,
        authorId: currentUserId,
        content: commentForm.content.trim(),
        isInternal: commentForm.isInternal,
        attachments: attachments.length ? attachments : undefined,
      })

      toast.success('Comentario agregado')
      setCommentForm({ content: '', isInternal: false })
      setCommentAttachments([])
      await loadTicketDetails(selectedTicket.id)
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Error al agregar comentario')
    } finally {
      setLoading(false)
    }
  }, [
    crmFacade,
    tenantId,
    currentUserId,
    selectedTicket,
    commentForm,
    loadTicketDetails,
    uploadCommentAttachments,
    isUploadingCommentAttachments,
    toast,
  ])

  // Update ticket status
  const handleUpdateStatus = useCallback(async (status: string) => {
    if (!selectedTicket) return

    setLoading(true)
    try {
      await crmFacade.updateTicket({
        ticketId: selectedTicket.id,
        tenantId,
        userId: currentUserId,
        status: status as any,
      })

      toast.success('Estado actualizado')
      await loadTicketDetails(selectedTicket.id)
      await loadTickets()
    } catch (error) {
      console.error('Failed to update ticket:', error)
      toast.error('Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }, [crmFacade, tenantId, currentUserId, selectedTicket, loadTicketDetails, loadTickets, toast])

  const handleAssignToMe = useCallback(async () => {
    if (!selectedTicket || !currentUserId) {
      return
    }

    if (selectedTicket.assignedToId === currentUserId) {
      toast.info('Ya eres el asignado', 'Este ticket ya está asignado a tu usuario.')
      return
    }

    setLoading(true)
    try {
      await crmFacade.updateTicket({
        ticketId: selectedTicket.id,
        tenantId,
        userId: currentUserId,
        assignedToId: currentUserId,
      })

      toast.success('Ticket asignado', 'Ahora eres responsable de este ticket.')
      await loadTicketDetails(selectedTicket.id)
      await loadTickets()
    } catch (error) {
      console.error('Failed to self-assign ticket:', error)
      toast.error('No se pudo asignar', 'Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }, [crmFacade, currentUserId, selectedTicket, tenantId, loadTicketDetails, loadTickets, toast])

  const handleStartInternalNote = useCallback(() => {
    setCommentForm(form => ({ ...form, isInternal: true }))
    commentInputRef.current?.focus()
  }, [])

  const filteredTickets = useMemo(() => {
    return sortTicketSummaries(tickets).filter(ticket => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false
      }

      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
        return false
      }

      return true
    })
  }, [tickets, statusFilter, priorityFilter, sortTicketSummaries])

  // Load tickets on mount
  useEffect(() => {
    if (customerId) {
      loadTickets()
    }
  }, [customerId, loadTickets])

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const selectedTicketSentiment = selectedTicket?.sentiment ? SENTIMENT_META[selectedTicket.sentiment] : null
  const SelectedSentimentIcon = selectedTicketSentiment?.Icon
  const selectedTicketResponseDescriptor = selectedTicket
    ? describeSla(getResponseSlaInfo(selectedTicket), 'Respuesta')
    : null
  const selectedTicketResolutionDescriptor = selectedTicket
    ? describeSla(getResolutionSlaInfo(selectedTicket), 'Resolución')
    : null

  return (
    <Fragment>
      {showContactProfileCard ? (
        <Card className="mb-4 border border-white/15 bg-slate-900/80 text-white">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {contactProfile?.name?.trim() || 'Contacto sin nombre'}
                </h3>
                <div className="mt-1 space-y-0.5 text-xs text-slate-200/80">
                  <p>{contactEmail || 'Sin correo registrado'}</p>
                  <p>{contactPhone || 'Sin teléfono registrado'}</p>
                </div>
              </div>
              {contactRegistrationLabel ? (
                <Badge
                  variant="outline"
                  className="border-transparent bg-white/10 text-[10px] uppercase tracking-wide text-white"
                >
                  {contactRegistrationLabel}
                </Badge>
              ) : null}
            </div>

            {missingIdentifiers && contactProfile?.canRegister ? (
              <p className="text-xs text-amber-300/80">
                Agrega correo o teléfono desde el panel de contacto para habilitar el registro.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {contactProfile?.canRegister ? (
                <Button
                  type="button"
                  onClick={handleRegisterClick}
                  className="h-8 rounded-full bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400"
                  disabled={Boolean(registerContactLoading)}
                >
                  {registerContactLoading ? 'Registrando…' : 'Registrar en CRM'}
                </Button>
              ) : null}
              {contactProfile?.canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenUpdateContact}
                  className="h-8 rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
                  disabled={Boolean(updateContactLoading)}
                >
                  {updateContactLoading ? 'Abriendo…' : 'Actualizar datos'}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Customer Selection - hidden when embedded in CrmChatPanel */}
      {!hideContactCard && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                  {activeCustomer ? 'Cliente CRM seleccionado' : 'Asignar cliente CRM'}
                </h3>
                {!activeCustomer ? (
                  <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    El ticket se registrará para el cliente elegido y seguirá las reglas del CRM.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onRedirectToAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRedirectToAdmin}
                    className="gap-2 border-white/20 text-white hover:bg-white/10"
                  >
                    Actualizar detalles (admin)
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomerForm(prev => !prev)}
                  className="gap-2 border-white/15 text-white hover:bg-white/10"
                >
                  <UserPlus className="h-4 w-4" />
                  {showCustomerForm ? 'Ocultar formulario' : 'Nuevo cliente'}
                </Button>
              </div>
            </div>

            {loadingCustomers ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            ) : customers.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                    Selecciona un cliente existente
                  </label>
                  <Select
                    value={customerId ?? ''}
                    onValueChange={value => {
                      if (value) {
                        onSelectCustomer(value)
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/15 text-white hover:bg-white/10">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto border border-white/10 bg-slate-950/95 text-white shadow-xl backdrop-blur">
                      {customers.map(customer => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id}
                          className="flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-sm text-white transition-colors focus:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[state=checked]:bg-white/15 data-[state=checked]:text-white"
                        >
                          <span className="font-medium text-white">{customer.name}</span>
                          <span className="text-xs text-white/70">{customer.email ?? 'Sin correo'}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeCustomer ? (
                  <div
                    className="rounded-xl border p-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderColor: 'var(--chatbot-sidebar-border)',
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                      <div><strong>Nombre:</strong> {activeCustomer.name}</div>
                      <div><strong>Email:</strong> {activeCustomer.email ?? 'Sin registro'}</div>
                      <div><strong>Teléfono:</strong> {activeCustomer.phone ?? 'Sin registro'}</div>
                      <div><strong>Tipo:</strong> {activeCustomer.type === 'lead' ? 'Lead' : 'Contacto'}</div>
                      {activeCustomer.status ? (
                        <div><strong>Estado:</strong> {activeCustomer.status}</div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border p-3 text-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderColor: 'var(--chatbot-sidebar-border)',
                      color: 'var(--chatbot-sidebar-secondary)',
                    }}
                  >
                    No hay un cliente seleccionado. Registra uno nuevo o elige de la lista.
                  </div>
                )}
              </div>
            ) : !showCustomerForm ? (
              <div
                className="flex flex-col items-start gap-2 rounded-xl border p-3 text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'var(--chatbot-sidebar-border)',
                  color: 'var(--chatbot-sidebar-secondary)',
                }}
              >
                <p>No se encontraron clientes CRM vinculados a este contacto.</p>
                {onRedirectToAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRedirectToAdmin}
                    className="gap-2 border-white/20 text-white hover:bg-white/10"
                  >
                    Solicitar actualización en Admin
                  </Button>
                ) : null}
              </div>
            ) : null}

            {showCustomerForm && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    id="customer-inline-name"
                    name="name"
                    value={customerForm.name}
                    onChange={event => setCustomerForm(form => ({ ...form, name: event.target.value }))}
                    placeholder="Nombre completo"
                    aria-label="Nombre completo"
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                  />
                  <Input
                    id="customer-inline-email"
                    name="email"
                    type="email"
                    value={customerForm.email}
                    onChange={event => setCustomerForm(form => ({ ...form, email: event.target.value }))}
                    placeholder="Correo electrónico"
                    aria-label="Correo electrónico"
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                  />
                  <Input
                    id="customer-inline-phone"
                    name="phone"
                    value={customerForm.phone}
                    onChange={event => setCustomerForm(form => ({ ...form, phone: event.target.value }))}
                    placeholder="Teléfono"
                    aria-label="Teléfono"
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleCreateCustomerInline}
                    disabled={creatingCustomer}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {creatingCustomer ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {creatingCustomer ? 'Guardando...' : 'Registrar cliente'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className="flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition"
          style={{
            borderColor: 'var(--chatbot-sidebar-border)',
            background: activeTab === 'list' ? 'var(--chatbot-sidebar-pill-bg)' : 'transparent',
            color: activeTab === 'list' ? 'var(--chatbot-sidebar-text)' : 'var(--chatbot-sidebar-secondary)',
          }}
        >
          <Ticket className="inline h-3 w-3 mr-1" />
          Tickets ({filteredTickets.length}/{tickets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition"
          style={{
            borderColor: 'var(--chatbot-sidebar-border)',
            background: activeTab === 'create' ? 'var(--chatbot-sidebar-pill-bg)' : 'transparent',
            color: activeTab === 'create' ? 'var(--chatbot-sidebar-text)' : 'var(--chatbot-sidebar-secondary)',
          }}
        >
          <Plus className="inline h-3 w-3 mr-1" />
          Crear
        </button>
      </div>

      {/* List View */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Collapsible Filters */}
          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--chatbot-sidebar-border)',
            }}
          >
            {/* Filter Header - Always visible */}
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-white/5 transition"
              style={{ color: 'var(--chatbot-sidebar-text)' }}
            >
              <span className="flex items-center gap-2">
                <span>Filtros</span>
                {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">
                    {[statusFilter !== 'all' && 'Estado', priorityFilter !== 'all' && 'Prioridad'].filter(Boolean).join(', ')}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                  {filteredTickets.length}/{tickets.length}
                </span>
                <span className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}>▼</span>
              </span>
            </button>

            {/* Expandable Filters Content */}
            {filtersExpanded && (
              <div className="flex flex-wrap gap-2 px-3 py-3 border-t" style={{ borderColor: 'var(--chatbot-sidebar-border)' }}>
                <div className="min-w-[140px] flex-1 sm:flex-none">
                  <label
                    className="mb-1 block text-[11px] uppercase tracking-wide"
                    style={{ color: 'var(--chatbot-sidebar-secondary)' }}
                  >
                    Estado
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={value => setStatusFilter(value as TicketStatus | 'all')}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                      {STATUS_FILTER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px] flex-1 sm:flex-none">
                  <label
                    className="mb-1 block text-[11px] uppercase tracking-wide"
                    style={{ color: 'var(--chatbot-sidebar-secondary)' }}
                  >
                    Prioridad
                  </label>
                  <Select
                    value={priorityFilter}
                    onValueChange={value => setPriorityFilter(value as TicketPriority | 'all')}
                  >
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                      {PRIORITY_FILTER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[140px] flex-1 sm:flex-none">
                  <label
                    className="mb-1 block text-[11px] uppercase tracking-wide"
                    style={{ color: 'var(--chatbot-sidebar-secondary)' }}
                  >
                    Ordenar
                  </label>
                  <Select value={sortOption} onValueChange={value => setSortOption(value as 'recent' | 'oldest' | 'priority')}>
                    <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div
                className="h-6 w-6 animate-spin rounded-full border-b-2"
                style={{ borderColor: 'var(--chatbot-sidebar-accent)' }}
              ></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div
              className="rounded-2xl border px-4 py-8 text-sm text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.02)', // TODO: theme
                borderColor: 'var(--chat-panel-text-dim)',
                color: 'var(--chat-panel-text-dim)',
              }}
            >
              <Ticket className="mx-auto mb-2 h-12 w-12 opacity-40" />
              <p>No hay tickets que coincidan con los filtros.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const statusInfo = TICKET_STATUSES.find(s => s.value === ticket.status)
              const StatusIcon = statusInfo?.icon || AlertCircle
              const priorityInfo = TICKET_PRIORITIES.find(p => p.value === ticket.priority)
              const sentimentMeta = ticket.sentiment ? SENTIMENT_META[ticket.sentiment] : null
              const SentimentIcon = sentimentMeta?.Icon
              const responseDescriptor = describeSla(getResponseSlaInfo(ticket), 'Respuesta')
              const resolutionDescriptor = describeSla(getResolutionSlaInfo(ticket), 'Resolución')

              // Check if ticket is overdue (either response or resolution SLA)
              const responseInfo = getResponseSlaInfo(ticket)
              const resolutionInfo = getResolutionSlaInfo(ticket)
              const isOverdue = (responseInfo?.overdue || resolutionInfo?.overdue) && ticket.status !== 'resolved' && ticket.status !== 'closed'

              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => loadTicketDetails(ticket.id)}
                  className={`group w-full rounded-xl border p-3 text-left transition hover:bg-black/5 dark:hover:bg-white/5 ${isOverdue ? 'ring-1 ring-red-500/50' : ''}`}
                  style={{
                    borderColor: isOverdue ? 'rgb(239 68 68 / 0.6)' : 'var(--chat-panel-text-dim)',
                    background: isOverdue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4
                      className="line-clamp-1 text-sm font-semibold transition-colors"
                      style={{ color: 'var(--chat-panel-text)' }}
                    >
                      {ticket.title}
                    </h4>
                    <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusInfo?.color} transition-colors`} />
                  </div>
                  <div className="mb-1 text-[11px] font-mono transition-colors" style={{ color: 'var(--chat-panel-text-dim)' }}>
                    #{ticket.ticketNumber ?? ticket.id.slice(-8).toUpperCase()}
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-2 text-xs transition-colors"
                    style={{ color: 'var(--chat-panel-text-dim)' }}
                  >
                    <span className={priorityInfo?.color}>{priorityInfo?.label}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    {isOverdue && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-red-400 group-hover:text-red-600">VENCIDO</span>
                      </>
                    )}
                    {ticket.assignedToName ? (
                      <>
                        <span>•</span>
                        <span>Asignado: {ticket.assignedToName}</span>
                      </>
                    ) : null}
                    {ticket.unreadComments > 0 ? (
                      <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/40 text-[10px]">
                        {ticket.unreadComments} sin leer
                      </Badge>
                    ) : null}
                  </div>
                  {(responseDescriptor || resolutionDescriptor || sentimentMeta) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {responseDescriptor ? (
                        <span className={`rounded-full border px-2 py-0.5 ${responseDescriptor.className}`}>
                          {responseDescriptor.text}
                        </span>
                      ) : null}
                      {resolutionDescriptor ? (
                        <span className={`rounded-full border px-2 py-0.5 ${resolutionDescriptor.className}`}>
                          {resolutionDescriptor.text}
                        </span>
                      ) : null}
                      {sentimentMeta && SentimentIcon ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-white/80">
                          <SentimentIcon className={`h-3 w-3 ${sentimentMeta.color}`} />
                          <span className={sentimentMeta.color}>{sentimentMeta.label}</span>
                        </span>
                      ) : null}
                    </div>
                  )}
                  {ticket.summary ? (
                    <p
                      className="mt-2 line-clamp-2 text-[13px] leading-relaxed"
                      style={{ color: 'var(--chat-panel-text-dim)' }}
                    >
                      {ticket.summary}
                    </p>
                  ) : null}
                </button>
              )
            })
          )}
        </div>
      )
      }

      {/* Create View */}
      {
        activeTab === 'create' && (
          <div className="space-y-4">
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-3"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--chatbot-sidebar-border)',
              }}
            >
              <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                Completa manualmente o genera un borrador con IA usando el contexto del cliente.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handlePrefillWithAi}
                disabled={aiDraftLoading || loading}
                className="bg-purple-600 text-white hover:bg-purple-500"
              >
                {aiDraftLoading ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                )}
                Rellenar con IA
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Tipo de Ticket
              </label>
              <Select
                value={createForm.type}
                onValueChange={(value: TicketType) => setCreateForm({ ...createForm, type: value })}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                  {TICKET_TYPES.map(type => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Prioridad
              </label>
              <Select
                value={createForm.priority}
                onValueChange={(value: TicketPriority) => setCreateForm({ ...createForm, priority: value })}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                  {TICKET_PRIORITIES.map(priority => (
                    <SelectItem
                      key={priority.value}
                      value={priority.value}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Asignar a
              </label>
              <Select
                value={assigneeId ?? ''}
                onValueChange={value => setAssigneeId(value)}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue placeholder="Selecciona un operador" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                  {assigneeOptions.map(option => (
                    <SelectItem
                      key={option.id}
                      value={option.id}
                      className="text-white hover:bg-zinc-700 focus:bg-zinc-700"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{option.name}</span>
                        {option.email ? (
                          <span className="text-[10px] text-white/50">{option.email}</span>
                        ) : null}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="ticket-title" className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Título
              </label>
              <Input
                id="ticket-title"
                name="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Resumen breve del problema..."
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="ticket-desc" className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Descripción
              </label>
              <Textarea
                id="ticket-desc"
                name="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe el problema en detalle..."
                rows={4}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="ticket-tags" className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Etiquetas (separadas por coma)
              </label>
              <Input
                id="ticket-tags"
                name="tags"
                value={createForm.tags.join(', ')}
                onChange={event => {
                  const raw = event.target.value
                  const nextTags = raw
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(Boolean)
                  setCreateForm(form => ({ ...form, tags: nextTags }))
                }}
                placeholder="prioridad, urgente, onboarding"
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
              />
              {createForm.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {createForm.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-white/20 bg-white/5 text-[11px] uppercase tracking-wide text-white/80"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateTicket}
              disabled={loading || !createForm.title.trim() || !createForm.description.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? 'Creando...' : 'Crear Ticket'}
            </Button>
          </div>
        )
      }

      {/* Detail View */}
      {
        activeTab === 'detail' && selectedTicket && (
          <div className="space-y-4">
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'var(--chatbot-sidebar-border)',
              }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                {selectedTicket.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                <span className="font-mono" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                  #{resolveTicketNumber({ ticketNumber: selectedTicket.ticketNumber, id: selectedTicket.id, createdAt: selectedTicket.createdAt })}
                </span>
                {buildCustomerPortalUrl(selectedTicket.id, selectedTicket.customerPhone) ? (
                  <>
                    <a
                      href={buildCustomerPortalUrl(selectedTicket.id, selectedTicket.customerPhone) ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20"
                    >
                      Abrir en portal
                    </a>
                    <span className="text-[11px] text-white/70">
                      El cliente verificará con su teléfono cuando quiera revisar el ticket.
                    </span>
                  </>
                ) : null}
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                {selectedTicket.description}
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                <span>{TICKET_TYPES.find(t => t.value === selectedTicket.type)?.icon}</span>
                <span>{TICKET_PRIORITIES.find(p => p.value === selectedTicket.priority)?.label}</span>
                <span>•</span>
                <span>{formatDate(selectedTicket.createdAt)}</span>
              </div>
              {(selectedTicketResponseDescriptor || selectedTicketResolutionDescriptor) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {selectedTicketResponseDescriptor ? (
                    <span className={`rounded-full border px-2 py-0.5 ${selectedTicketResponseDescriptor.className}`}>
                      {selectedTicketResponseDescriptor.text}
                    </span>
                  ) : null}
                  {selectedTicketResolutionDescriptor ? (
                    <span className={`rounded-full border px-2 py-0.5 ${selectedTicketResolutionDescriptor.className}`}>
                      {selectedTicketResolutionDescriptor.text}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {selectedTicket.attachments.length > 0 && (
              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'var(--chatbot-sidebar-border)',
                }}
              >
                <h4 className="mb-2 text-xs font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                  Adjuntos ({selectedTicket.attachments.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.attachments.map(attachment => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white/80 transition hover:border-white/30 hover:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="max-w-[180px] truncate">{attachment.originalName}</span>
                      <span className="text-[10px] text-white/60">{FileValidator.formatFileSize(attachment.size)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedTicketSentiment && SelectedSentimentIcon ? (
              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'var(--chatbot-sidebar-border)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SelectedSentimentIcon className={`h-4 w-4 ${selectedTicketSentiment.color}`} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                      Sentimiento detectado: <span className={selectedTicketSentiment.color}>{selectedTicketSentiment.label}</span>
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[11px] border-transparent"
                    style={{ color: selectedTicketSentiment.color, background: 'rgba(255,255,255,0.05)' }}
                  >
                    Análisis IA
                  </Badge>
                </div>
                {selectedTicket.sentimentSummary ? (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    {selectedTicket.sentimentSummary}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Status Update */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Estado
              </label>
              <Select value={selectedTicket.status} onValueChange={handleUpdateStatus}>
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700" style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}>
                  {TICKET_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value} className="text-white hover:bg-zinc-700 focus:bg-zinc-700">
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAssignToMe}
                disabled={!selectedTicket || selectedTicket.assignedToId === currentUserId || loading}
                className="border-white/15 text-white hover:bg-white/10"
              >
                <UserCheck className="mr-1 h-3.5 w-3.5" />
                Asignar a mí
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => selectedTicket ? void loadTicketDetails(selectedTicket.id) : undefined}
                disabled={loading || !selectedTicket}
                className="text-white/70 hover:text-white"
              >
                <RefreshCcw className="mr-1 h-3.5 w-3.5" />
                Actualizar
              </Button>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                Comentarios ({selectedTicket.comments.length})
              </h4>
              <div className="space-y-2 mb-3">
                {selectedTicket.comments.map(comment => (
                  <div
                    key={comment.id}
                    className="rounded-lg border p-3"
                    style={{
                      background: comment.isInternal ? 'rgba(255, 200, 0, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: comment.isInternal ? 'rgba(255, 200, 0, 0.3)' : 'var(--chatbot-sidebar-border)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                        {comment.authorName}
                      </span>
                      <div className="flex items-center gap-2">
                        {comment.updateCode && (
                          <span className="text-[10px] font-mono text-white/60">
                            {comment.updateCode}
                          </span>
                        )}
                        {comment.isInternal && (
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            Interno
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                      {comment.content}
                    </p>
                    {comment.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map(attachment => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-white/80 transition hover:border-white/30 hover:text-white"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="max-w-[140px] truncate">{attachment.originalName}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] mt-1 block" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  ref={commentInputRef}
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  placeholder="Agregar comentario..."
                  rows={3}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 text-xs resize-none"
                />
                {commentAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {commentAttachments.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white"
                      >
                        <FileText className="h-3.5 w-3.5 text-white/70" />
                        <span className="max-w-[160px] truncate">{file.name}</span>
                        <span className="text-[10px] text-white/60">{FileValidator.formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommentAttachment(index)}
                          className="text-white/60 transition hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={triggerCommentAttachmentDialog}
                    disabled={isUploadingCommentAttachments}
                    className="text-white/70 hover:text-white"
                  >
                    <Paperclip className="mr-1 h-3.5 w-3.5" />
                    Adjuntar ({commentAttachments.length}/{MAX_COMMENT_ATTACHMENTS})
                  </Button>
                  <label
                    className="flex items-center gap-1.5 text-xs cursor-pointer"
                    style={{ color: 'var(--chatbot-sidebar-text)' }}
                  >
                    <input
                      type="checkbox"
                      checked={commentForm.isInternal}
                      onChange={(e) => setCommentForm({ ...commentForm, isInternal: e.target.checked })}
                      className="rounded"
                    />
                    <span>Interno</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleStartInternalNote}
                    className="text-white/70 hover:text-white"
                  >
                    Nota interna
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    {isUploadingCommentAttachments ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                    ) : null}
                    <Button
                      onClick={handleAddComment}
                      disabled={
                        loading ||
                        isUploadingCommentAttachments ||
                        !commentForm.content.trim()
                      }
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleShareTicketMessage(selectedTicket)}
                className="border-white/10 text-white hover:bg-white/10 sm:flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Insertar enlace + OTP
              </Button>
              <Button
                onClick={() => setActiveTab('list')}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5 sm:flex-1"
              >
                Volver a Lista
              </Button>
            </div>
          </div>
        )
      }
    </Fragment >
  )
}

