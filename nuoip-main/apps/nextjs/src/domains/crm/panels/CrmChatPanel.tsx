"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  Heart,
  Lightbulb,
  MessageSquare,
  Package,
  Phone,
  Mail,
  FileText,
  Edit3,
  Ticket,
  UserCheck,
  X,
  Sparkles,
  Search,
  Clock,
  User,
  UserPlus,
} from 'lucide-react'
import { CloseSessionForm } from '@/components/chatbot/fullscreen/dialogs/CloseSessionForm'
import type { CloseSessionFormData, InteractionType } from '@/components/chatbot/fullscreen/dialogs/CloseSessionForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PanelPlugin } from '@/plugins/panel-plugin'
import type {
  CrmCustomerSummary,
  TicketRealtimeEvent,
  TicketRealtimeListener,
} from '../contracts'
import { TicketPanel } from './TicketPanel'
import type { TicketPanelCommand } from './TicketPanel'
import { CatalogPanel } from './CatalogPanel'

// ============================================================================
// TYPES
// ============================================================================

export type CrmPanelTab =
  | 'summary'
  | 'ai-crm'
  | 'catalog'
  | 'appointments'
  | 'tickets'
  | 'create-tickets'
  | 'tasks'
  | 'activity'

interface CrmTask {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  dueTime?: string | null
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  reminder?: string | null
  type?: 'general' | 'followup' | 'call' | 'meeting'
  clientName?: string | null
  note?: string | null
}

interface CrmAppointment {
  id: string
  title: string
  clientName?: string | null
  date: string
  time: string
  duration: number
  type: 'consultation' | 'training' | 'class' | 'massage' | 'other'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string | null
}

interface CrmActivity {
  id: string
  type: 'message' | 'call' | 'email' | 'note' | 'ticket' | 'product' | 'appointment' | 'task'
  text: string
  detail?: string | null
  createdAt: string
}

// Interaction types and form data moved to CloseSessionForm.tsx

interface AiSummary {
  customerSummary: string
  sentiment: {
    score: number
    label: string
    trend: string
    details: string
  }
  keyInsights: Array<{
    type: string
    icon: string
    text: string
    source: string
  }>
  interestProfile: string[]
  suggestedProducts: Array<{
    id: string
    name: string
    reason: string
    image?: string
    price?: number
  }>
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string
  description: string
  stock: number
}

export interface CrmContactProfile {
  id: string | null
  name: string
  email: string | null
  phone: string | null
  type: 'flowbot' | 'tenant_user' | 'chat_contact'
  isRegistered: boolean
  canRegister: boolean
  canEdit: boolean
  tenantId: string | null
  metadata?: Record<string, unknown> | null
  lastInteraction?: string  // ISO date string of last interaction
}

export interface CrmSessionSummary {
  id: string
  date: string
  summary: string
  topics: string[]
  agentName?: string
  duration?: string
  interactionType?: string
}

export interface CrmPanelContext {
  activeTab: CrmPanelTab
  onChangeTab: (tab: CrmPanelTab) => void
  hasCrmTools: boolean
  contactProfile: CrmContactProfile
  onRegisterContact: () => Promise<CrmCustomerSummary | null>
  onUpdateContact: (input: { name: string; email: string | null; phone: string | null; description?: string | null }) => Promise<boolean>
  // Existing props for TicketPanel
  customers: CrmCustomerSummary[]
  loadingCustomers: boolean
  selectedCustomerId: string | null
  onSelectCustomer: (id: string) => void
  onCreateCustomer: (input: { name: string; email: string; phone: string }) => Promise<CrmCustomerSummary | null>
  onInsertTicketMessage: (message: string) => void
  assignees: Array<{ id: string; name: string; email?: string | null }>
  conversationMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>
  tenantId: string
  sessionToken: string | null
  currentUserId: string
  currentUserName: string
  ticketPanelCommand?: TicketPanelCommand | null
  onTicketPanelCommandHandled?: (commandId: string) => void
  registerTicketEventListener: (listener: TicketRealtimeListener) => () => void
  notifyTicketEvent: (event: TicketRealtimeEvent) => void
  // New enhanced CRM props
  onSendProduct?: (product: Product) => void
  onCloseSession?: (data: { annotation: string; interactionType: string; needsFollowUp: boolean; followUpDate?: string }) => void
  onAssignSession?: (userId: string) => void
  onScheduleAppointment?: (appointment: Omit<CrmAppointment, 'id'>) => void
  sessionStartTime?: string  // ISO string of when session started
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CRM_PRIMARY_TABS = [
  { id: 'ai-crm' as const, icon: Bot, label: 'AI CRM' },
  { id: 'catalog' as const, icon: Package, label: 'Catálogo' },
  { id: 'appointments' as const, icon: Calendar, label: 'Citas' },
]

const CRM_SECONDARY_TABS = [
  { id: 'tickets' as const, icon: Ticket, label: 'Tickets', count: 0 },
  { id: 'tasks' as const, icon: CheckCircle2, label: 'Tareas', count: 0 },
  { id: 'activity' as const, icon: ClipboardList, label: 'Actividad', count: null },
]



const MOCK_AI_SUMMARY: AiSummary = {
  customerSummary: "Cliente interesado en clases de fitness y membresías. Ha mostrado interés en yoga y pilates. Alta probabilidad de conversión.",
  sentiment: { score: 72, label: 'Positivo', trend: 'mejorando', details: 'El cliente muestra engagement alto tras las últimas interacciones.' },
  keyInsights: [
    { type: 'urgent', icon: '🔴', text: 'Ticket de pago pendiente', source: 'Tickets' },
    { type: 'task', icon: '📋', text: 'Seguimiento programado para hoy', source: 'Tasks' },
  ],
  interestProfile: ['Yoga', 'Pilates', 'Clases Matutinas', 'Membresía Premium'],
  suggestedProducts: [
    { id: '2', name: 'Monthly Membership', reason: 'Alto interés mostrado', image: '💳', price: 99.00 },
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSentimentColor(score: number): string {
  if (score >= 70) return 'var(--green-500, #22c55e)'
  if (score >= 40) return 'var(--yellow-500, #eab308)'
  return 'var(--red-500, #ef4444)'
}

function getAppointmentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    consultation: 'var(--blue-500, #3b82f6)',
    training: 'var(--purple-500, #8b5cf6)',
    class: 'var(--green-500, #22c55e)',
    massage: 'var(--pink-500, #ec4899)',
    other: 'var(--gray-500, #6b7280)',
  }
  return colors[type] || colors.other
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString()
}

function getActivityIcon(type: CrmActivity['type']) {
  const icons: Record<string, typeof MessageSquare> = {
    message: MessageSquare,
    call: Phone,
    email: Mail,
    note: FileText,
    ticket: Ticket,
    product: Package,
    appointment: Calendar,
    task: CheckCircle2,
  }
  return icons[type] || MessageSquare
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type CrmChatPanelProps = CrmPanelContext

export function CrmChatPanel({
  activeTab,
  onChangeTab,
  hasCrmTools,
  contactProfile,
  onRegisterContact,
  onUpdateContact,
  customers,
  loadingCustomers,
  selectedCustomerId,
  onSelectCustomer,
  onCreateCustomer,
  onInsertTicketMessage,
  assignees,
  conversationMessages,
  tenantId,
  sessionToken,
  currentUserId,
  currentUserName,
  ticketPanelCommand,
  onTicketPanelCommandHandled,
  registerTicketEventListener,
  onSendProduct,
  onCloseSession,
  onAssignSession,
  onScheduleAppointment,
  sessionStartTime,
}: CrmChatPanelProps) {
  // Local state
  const [tasks, setTasks] = useState<CrmTask[]>([
    { id: '1', title: 'Follow up on payment', dueDate: 'Today', priority: 'high', completed: false, type: 'followup' },
    { id: '2', title: 'Send class schedule', dueDate: 'Tomorrow', priority: 'medium', completed: false },
    { id: '3', title: 'Update contact info', dueDate: 'Mar 20', priority: 'low', completed: true },
  ])
  const [appointments, setAppointments] = useState<CrmAppointment[]>([
    { id: '1', title: 'Fitness Consultation', clientName: 'Lucia Meza', date: '2024-03-20', time: '10:00', duration: 30, type: 'consultation', status: 'confirmed' },
    { id: '2', title: 'Personal Training', clientName: 'Johan Cliente', date: '2024-03-20', time: '14:00', duration: 60, type: 'training', status: 'pending' },
  ])
  const [activities, setActivities] = useState<CrmActivity[]>([
    { id: '1', type: 'message', text: 'Sent payment link', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: '2', type: 'call', text: 'Outbound call - 5 min', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: '3', type: 'email', text: 'Email sent: Class confirmation', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ])
  const [sessionHistory, setSessionHistory] = useState<CrmSessionSummary[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CrmSessionSummary | null>(null)

  // Fetch sessions when Activity tab is active
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false)
  const [assignSearchQuery, setAssignSearchQuery] = useState('')
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [closeSessionLoading, setCloseSessionLoading] = useState(false)

  // Fetch sessions when Activity tab is active
  useEffect(() => {
    if (activeTab === 'activity' && contactProfile.id) {
      setLoadingSessions(true)
      fetch(`/api/whatsapp/contacts/${contactProfile.id}/sessions`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSessionHistory(data)
          }
        })
        .finally(() => setLoadingSessions(false))
    }
  }, [activeTab, contactProfile.id])

  const [activityFilter, setActivityFilter] = useState<'all' | 'messages' | 'calls' | 'emails'>('all')
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)

  // Form states
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium', type: 'general', description: '' })
  const [newAppointment, setNewAppointment] = useState({ title: '', date: '', time: '', duration: '30', type: 'consultation', notes: '' })
  const [updateForm, setUpdateForm] = useState({
    name: contactProfile.name,
    email: contactProfile.email ?? '',
    phone: contactProfile.phone ?? '',
  })

  // Computed values
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  const filteredActivities = activityFilter === 'all'
    ? activities
    : activities.filter(a => {
      if (activityFilter === 'messages') return a.type === 'message'
      if (activityFilter === 'calls') return a.type === 'call'
      if (activityFilter === 'emails') return a.type === 'email'
      return true
    })

  const registrationStatusLabel = useMemo(() => {
    if (contactProfile.type === 'flowbot') return 'FlowBot'
    if (contactProfile.isRegistered) return 'Registrado en CRM'
    return 'Sin registrar'
  }, [contactProfile])

  // Filter assignees by search query
  const filteredAssignees = useMemo(() => {
    if (!assignSearchQuery.trim()) return assignees
    const query = assignSearchQuery.toLowerCase()
    return assignees.filter(a => a.name.toLowerCase().includes(query))
  }, [assignees, assignSearchQuery])

  // Handle assign selection
  const handleAssignSelect = useCallback((assigneeId: string) => {
    if (onAssignSession) {
      onAssignSession(assigneeId)
    }
    setIsAssignModalOpen(false)
    setAssignSearchQuery('')
  }, [onAssignSession])

  // Sync update form with contact profile
  useEffect(() => {
    setUpdateForm({
      name: contactProfile.name,
      email: contactProfile.email ?? '',
      phone: contactProfile.phone ?? '',
    })
  }, [contactProfile.name, contactProfile.email, contactProfile.phone])

  // Handlers
  const handleRegisterContactClick = useCallback(async () => {
    if (registerLoading) return null
    setRegisterLoading(true)
    try {
      return await onRegisterContact()
    } finally {
      setRegisterLoading(false)
    }
  }, [onRegisterContact, registerLoading])

  const handleOpenUpdateDialog = useCallback(() => {
    setShowUpdateDialog(true)
  }, [])

  const handleSubmitUpdate = async () => {
    if (!contactProfile.canEdit) return
    setUpdateLoading(true)
    try {
      const success = await onUpdateContact({
        name: updateForm.name,
        email: updateForm.email.trim() || null,
        phone: updateForm.phone.trim() || null,
      })
      if (success) {
        setShowUpdateDialog(false)
      }
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return
    const task: CrmTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      dueDate: newTask.dueDate || null,
      priority: newTask.priority as 'low' | 'medium' | 'high',
      completed: false,
    }
    setTasks(prev => [task, ...prev])
    setNewTask({ title: '', dueDate: '', priority: 'medium', type: 'general', description: '' })
    setIsTaskModalOpen(false)
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t))
  }

  const handleCreateAppointment = () => {
    if (!newAppointment.title.trim() || !newAppointment.date || !newAppointment.time) return
    const apt: CrmAppointment = {
      id: `apt-${Date.now()}`,
      title: newAppointment.title,
      clientName: contactProfile.name,
      date: newAppointment.date,
      time: newAppointment.time,
      duration: parseInt(newAppointment.duration, 10),
      type: newAppointment.type as CrmAppointment['type'],
      status: 'pending',
      notes: newAppointment.notes || null,
    }
    setAppointments(prev => [apt, ...prev])
    setNewAppointment({ title: '', date: '', time: '', duration: '30', type: 'consultation', notes: '' })
    setIsAppointmentModalOpen(false)
    onScheduleAppointment?.(apt)
  }

  const handleUpdateAppointmentStatus = (id: string, status: CrmAppointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  // Removed local handleGenerateSummary and associated useEffect as they are now internal to CloseSessionForm
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderAiCrmTab = () => (
    <div className="flex-1 overflow-y-auto space-y-4 p-1">
      {/* AI Customer Summary */}
      <div
        className="rounded-2xl border p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(59, 130, 246, 0.1))',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
            AI Customer Summary
          </h4>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          {MOCK_AI_SUMMARY.customerSummary}
        </p>
      </div>

      {/* Interest Profile */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--chatbot-sidebar-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
            Interest Profile
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOCK_AI_SUMMARY.interestProfile.map((interest, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-transparent bg-pink-500/10 text-pink-300 text-xs"
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Suggested Products */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--chatbot-sidebar-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
            AI Suggested Products
          </h4>
        </div>
        <div className="space-y-2">
          {MOCK_AI_SUMMARY.suggestedProducts.map(s => {
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl p-3"
                style={{ background: 'rgba(251, 191, 36, 0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.image || '📦'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                      {s.name}
                    </p>
                    <p className="text-xs text-amber-400">{s.reason}</p>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--chatbot-sidebar-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-sm">😊</span>
          </div>
          <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
            Sentiment Analysis
          </h4>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <div
            className="text-3xl font-bold"
            style={{ color: getSentimentColor(MOCK_AI_SUMMARY.sentiment.score) }}
          >
            {MOCK_AI_SUMMARY.sentiment.score}%
          </div>
          <div>
            <div className="font-medium" style={{ color: 'var(--chatbot-sidebar-text)' }}>
              {MOCK_AI_SUMMARY.sentiment.label}
            </div>
            <div className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
              {MOCK_AI_SUMMARY.sentiment.trend}
            </div>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          {MOCK_AI_SUMMARY.sentiment.details}
        </p>
      </div>
    </div>
  )



  const renderAppointmentsTab = () => (
    <div className="flex-1 overflow-y-auto space-y-4 p-1">
      {/* Add appointment button */}
      <Button
        onClick={() => setIsAppointmentModalOpen(true)}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white"
      >
        <CalendarCheck className="w-4 h-4 mr-2" />
        Schedule Appointment
      </Button>

      {/* Today's appointments */}
      <div>
        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          Today
        </h4>
        <div className="space-y-3">
          {appointments.filter(a => a.date === '2024-03-20').map(apt => (
            <div
              key={apt.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--chatbot-sidebar-border)', background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: getAppointmentTypeColor(apt.type) }}
                >
                  {apt.time.split(':')[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                        {apt.title}
                      </h4>
                      <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                        {apt.clientName}
                      </p>
                    </div>
                    <Select
                      value={apt.status}
                      onValueChange={(value) => handleUpdateAppointmentStatus(apt.id, value as CrmAppointment['status'])}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs rounded-full bg-white/10 border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    {apt.time} ({apt.duration} min) • {apt.type}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          Upcoming
        </h4>
        <div className="space-y-3">
          {appointments.filter(a => a.date !== '2024-03-20').map(apt => (
            <div
              key={apt.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--chatbot-sidebar-border)', background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getAppointmentTypeColor(apt.type) }}
                >
                  {apt.date.split('-')[2]}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                    {apt.title}
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                    {apt.clientName} • {apt.date}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTasksTab = () => (
    <div className="flex-1 overflow-y-auto space-y-4 p-1">
      {/* Add task button */}
      <Button
        onClick={() => setIsTaskModalOpen(true)}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white"
      >
        <CirclePlus className="w-4 h-4 mr-2" />
        Add New Task
      </Button>

      {/* Pending tasks */}
      <div>
        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          Pending ({tasks.filter(t => !t.completed).length})
        </h4>
        <div className="space-y-2">
          {tasks.filter(t => !t.completed).map(task => (
            <div
              key={task.id}
              className={`rounded-xl p-4 ${task.type === 'followup' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-white/30 hover:border-emerald-400 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium" style={{ color: 'var(--chatbot-sidebar-text)' }}>
                      {task.title}
                    </h4>
                    {task.type === 'followup' && (
                      <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Follow-up</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                        📅 {task.dueDate}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${task.priority === 'high' ? 'border-red-400/30 text-red-300 bg-red-400/10' :
                        task.priority === 'medium' ? 'border-yellow-400/30 text-yellow-300 bg-yellow-400/10' :
                          'border-white/20 text-white/60 bg-white/5'
                        }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed tasks */}
      <div>
        <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
          Completed ({tasks.filter(t => t.completed).length})
        </h4>
        <div className="space-y-2">
          {tasks.filter(t => t.completed).map(task => (
            <div key={task.id} className="rounded-xl p-4 bg-white/5 opacity-60">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </button>
                <h4 className="font-medium line-through" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
                  {task.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderActivityTab = () => (
    <div className="flex-1 overflow-y-auto space-y-4 p-1">
      {loadingSessions ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-5 w-5 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
        </div>
      ) : sessionHistory.length === 0 ? (
        <div className="text-center text-slate-500 py-8 text-sm flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 opacity-20" />
          <p>No recorded sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessionHistory.map(session => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelectedSession(session)}
              className="group w-full rounded-xl border p-3 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: 'var(--chat-panel-text-dim)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200">
                    {new Date(session.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </h4>
                  {session.topics?.[0] && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 capitalize">
                      {session.topics[0]}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(session.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {session.summary || 'Sin resumen disponible.'}
              </p>

              <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>By <span className="text-slate-400 font-medium">{session.agentName || 'Unknown'}</span></span>
                </div>
                <div
                  className="h-6 flex items-center text-[10px] px-2 text-emerald-400 group-hover:text-emerald-300 group-hover:bg-emerald-500/10 rounded transition-colors"
                >
                  Ver Detalle
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="CrmChatPanel flex flex-col gap-4">
      {/* Contact Header */}
      <div
        className="rounded-2xl border p-4 shadow-sm"
        style={{
          background: 'var(--chatbot-sidebar-pill-bg)',
          borderColor: 'var(--chatbot-sidebar-border)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--chatbot-sidebar-text)' }}>
              {contactProfile.name || 'Contacto sin nombre'}
            </h3>
            <div className="mt-1 space-y-0.5 text-xs" style={{ color: 'var(--chatbot-sidebar-secondary)' }}>
              {contactProfile.email ? (
                <p>{contactProfile.email}</p>
              ) : (
                <p className="italic">Sin correo registrado</p>
              )}
              {contactProfile.phone ? (
                <p>{contactProfile.phone}</p>
              ) : (
                <p className="italic">Sin teléfono registrado</p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-transparent bg-white/10 text-[10px] uppercase tracking-wide"
            style={{ color: 'var(--chatbot-sidebar-text)' }}
          >
            {registrationStatusLabel}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {contactProfile.canRegister && (
            <Button
              onClick={handleRegisterContactClick}
              disabled={registerLoading}
              className="h-8 rounded-full bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-400"
            >
              {registerLoading ? 'Registrando…' : 'Registrar en CRM'}
            </Button>
          )}
          {contactProfile.canEdit && (
            <Button
              variant="outline"
              onClick={handleOpenUpdateDialog}
              disabled={updateLoading}
              className="h-8 rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Actualizar datos
            </Button>
          )}

          <div className="h-4 w-px bg-white/10 mx-1" />



          {/* Session Controls */}
          {onCloseSession && (
            <Button
              variant="outline"
              onClick={() => setIsCloseSessionModalOpen(true)}
              className="h-8 rounded-full border-red-500/50 bg-red-500/10 px-3 text-xs font-semibold text-red-500 hover:bg-red-500/20 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cerrar Sesión
            </Button>
          )}

          {onAssignSession && (
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(true)}
              className="h-8 rounded-full border-white/20 bg-transparent px-3 text-xs font-semibold text-white hover:bg-white/5"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Asignar a...
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b" style={{ borderColor: 'var(--chatbot-sidebar-border)' }}>
        {/* Primary Tabs */}
        <div className="flex px-1 pt-2">
          {CRM_PRIMARY_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                onMouseEnter={() => setHoveredTabId(tab.id)}
                onMouseLeave={() => setHoveredTabId(null)}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-t-lg transition-all group crm-tab-button ${isActive ? 'bg-white crm-tab-active' : 'hover:bg-white crm-tab-hover'
                  }`}
                data-active={isActive}
                data-tab-id={tab.id}
              >
                <Icon
                  className={`w-5 h-5 transition-colors crm-tab-icon ${isActive ? 'crm-icon-active' : 'crm-icon-inactive'}`}
                  style={(isActive || hoveredTabId === tab.id) ? {
                    color: '#000000',
                    fill: 'none'
                  } : undefined}
                  data-active={isActive}
                  data-tab-id={tab.id}
                  data-hovered={hoveredTabId === tab.id}
                />
                <span
                  className={`text-xs font-medium mt-0.5 transition-colors ${isActive ? 'text-black' : 'text-[var(--chatbot-sidebar-secondary)] group-hover:text-black'}`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Secondary Tabs */}
        <div
          className="flex px-2 py-1.5 gap-1.5 border-t"
          style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--chatbot-sidebar-border)' }}
        >
          {CRM_SECONDARY_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                onMouseEnter={() => setHoveredTabId(tab.id)}
                onMouseLeave={() => setHoveredTabId(null)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all group crm-tab-button ${isActive
                  ? 'bg-white shadow-sm crm-tab-active'
                  : 'bg-white/5 hover:bg-white crm-tab-hover'
                  }`}
                data-active={isActive}
                data-tab-id={tab.id}
              >
                <Icon
                  className={`w-4 h-4 transition-colors crm-tab-icon ${isActive ? 'crm-icon-active' : 'crm-icon-inactive'}`}
                  style={(isActive || hoveredTabId === tab.id) ? {
                    color: '#000000',
                    fill: 'none'
                  } : undefined}
                  data-active={isActive}
                  data-tab-id={tab.id}
                  data-hovered={hoveredTabId === tab.id}
                />
                <span className={`transition-colors ${isActive ? 'text-black' : 'text-[var(--chatbot-sidebar-secondary)] group-hover:text-black'}`}>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 text-xs rounded-full transition-colors"
                    style={{
                      background: isActive ? 'var(--chatbot-sidebar-accent, #5a9080)' : 'rgba(255, 255, 255, 0.2)',
                      color: isActive ? 'white' : 'var(--chatbot-sidebar-secondary)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'ai-crm' && hasCrmTools && renderAiCrmTab()}
      {activeTab === 'catalog' && (
        <CatalogPanel
          contactProfile={contactProfile}
          onUpdateContact={onUpdateContact}
          onInsertMessage={onInsertTicketMessage}
          tenantId={tenantId}
          sessionToken={sessionToken}
        />
      )}
      {activeTab === 'appointments' && renderAppointmentsTab()}
      {activeTab === 'tasks' && renderTasksTab()}
      {activeTab === 'activity' && renderActivityTab()}

      {(activeTab === 'tickets' || activeTab === 'create-tickets' || activeTab === 'summary') && (
        <TicketPanel
          key={selectedCustomerId || contactProfile.id || 'no-customer'}
          tenantId={tenantId}
          sessionToken={sessionToken}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          customerId={selectedCustomerId || contactProfile.id || undefined}
          customerName={selectedCustomer?.name || contactProfile.name}
          customerEmail={selectedCustomer?.email || contactProfile.email || undefined}
          customerPhone={selectedCustomer?.phone || contactProfile.phone || undefined}
          contactProfile={contactProfile}
          onRegisterContact={handleRegisterContactClick}
          registerContactLoading={registerLoading}
          onOpenContactUpdate={handleOpenUpdateDialog}
          updateContactLoading={updateLoading}
          hideContactCard={true}
          customers={customers}
          loadingCustomers={loadingCustomers}
          onSelectCustomer={onSelectCustomer}
          onCreateCustomer={onCreateCustomer}
          onInsertTicketMessage={onInsertTicketMessage}
          assignees={assignees}
          conversationMessages={conversationMessages}
          registerTicketEventListener={registerTicketEventListener}
          command={ticketPanelCommand}
          onCommandHandled={onTicketPanelCommandHandled}
        />
      )}

      {!hasCrmTools && (activeTab === 'ai-crm' || activeTab === 'tasks' || activeTab === 'activity') && (
        <div
          className="rounded-2xl border px-4 py-5 text-sm m-1"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderColor: 'var(--chatbot-sidebar-border)',
            color: 'var(--chatbot-sidebar-secondary)',
          }}
        >
          Selecciona un contacto humano para habilitar las funciones CRM.
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent
          className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]"
          overlayClassName="bg-black/80"
        >
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Nueva Tarea
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea una tarea para seguimiento de este contacto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium text-slate-200">Título</label>
              <Input
                id="task-title"
                name="title"
                placeholder="Ej: Llamar mañana..."
                value={newTask.title}
                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="task-priority" className="text-sm font-medium text-slate-200">Prioridad</label>
                <Select
                  value={newTask.priority}
                  onValueChange={value => setNewTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger id="task-priority" name="priority" className="bg-slate-800 border-slate-700 text-white h-11 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="low" className="focus:bg-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" /> Baja
                      </span>
                    </SelectItem>
                    <SelectItem value="medium" className="focus:bg-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Media
                      </span>
                    </SelectItem>
                    <SelectItem value="high" className="focus:bg-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Alta
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Tipo</label>
                <Select
                  value={newTask.type}
                  onValueChange={value => setNewTask(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="general" className="focus:bg-slate-800">General</SelectItem>
                    <SelectItem value="followup" className="focus:bg-slate-800">Seguimiento</SelectItem>
                    <SelectItem value="call" className="focus:bg-slate-800">Llamada</SelectItem>
                    <SelectItem value="meeting" className="focus:bg-slate-800">Reunión</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold !text-white uppercase tracking-wider">Notas</label>
              <Textarea
                placeholder="Detalles adicionales..."
                value={newTask.description || ''}
                onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 min-h-[100px] resize-none transition-all"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsTaskModalOpen(false)}
              className="text-white border-white bg-transparent hover:bg-white/10 transition-colors h-11 px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/40"
            >
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Modal */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent
          className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]"
          overlayClassName="bg-black/80"
        >
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarCheck className="w-5 h-5 text-blue-400" />
              Agendar Cita
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Agenda una cita o clase para este contacto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="apt-title" className="text-sm font-medium text-slate-200">Título</label>
              <Input
                id="apt-title"
                name="title"
                placeholder="Ej: Clase de Yoga..."
                value={newAppointment.title}
                onChange={e => setNewAppointment(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="apt-date" className="text-sm font-medium text-slate-200">Fecha</label>
                <Input
                  id="apt-date"
                  name="date"
                  type="date"
                  value={newAppointment.date}
                  onChange={e => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="apt-time" className="text-sm font-medium text-slate-200">Hora</label>
                <Input
                  id="apt-time"
                  name="time"
                  type="time"
                  value={newAppointment.time}
                  onChange={e => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="apt-type-trigger" className="text-sm font-medium text-slate-200">Tipo</label>
                <Select
                  value={newAppointment.type}
                  onValueChange={value => setNewAppointment(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="apt-type-trigger" name="appointmentType" className="bg-slate-800 border-slate-700 text-white h-11 focus:ring-blue-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="consultation" className="focus:bg-slate-800">Consulta</SelectItem>
                    <SelectItem value="training" className="focus:bg-slate-800">Entrenamiento</SelectItem>
                    <SelectItem value="class" className="focus:bg-slate-800">Clase</SelectItem>
                    <SelectItem value="massage" className="focus:bg-slate-800">Masaje</SelectItem>
                    <SelectItem value="other" className="focus:bg-slate-800">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="apt-duration-trigger" className="text-sm font-medium text-slate-200">Duración</label>
                <Select
                  value={newAppointment.duration}
                  onValueChange={value => setNewAppointment(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger id="apt-duration-trigger" name="duration" className="bg-slate-800 border-slate-700 text-white h-11 focus:ring-blue-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="30" className="focus:bg-slate-800">30 min</SelectItem>
                    <SelectItem value="45" className="focus:bg-slate-800">45 min</SelectItem>
                    <SelectItem value="60" className="focus:bg-slate-800">60 min</SelectItem>
                    <SelectItem value="90" className="focus:bg-slate-800">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="apt-notes" className="text-sm font-medium text-slate-200">Notas</label>
              <Textarea
                id="apt-notes"
                name="notes"
                placeholder="Instrucciones especiales..."
                value={newAppointment.notes}
                onChange={e => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 min-h-[80px] resize-none transition-all"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-6 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsAppointmentModalOpen(false)}
              className="text-white border-white bg-transparent hover:bg-white/10 transition-colors h-11 px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/40"
            >
              Agendar Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Contact Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent
          className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]"
          overlayClassName="bg-black/80"
        >
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Actualizar Contacto
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifica la información del contacto en el CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="update-name" className="text-sm font-medium text-slate-200">Nombre</label>
              <Input
                id="update-name"
                name="name"
                value={updateForm.name}
                onChange={event => setUpdateForm(form => ({ ...form, name: event.target.value }))}
                placeholder="Ingresa el nombre del contacto"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 h-11 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="update-email" className="text-sm font-medium text-slate-200">Correo</label>
              <Input
                id="update-email"
                name="email"
                type="email"
                value={updateForm.email}
                onChange={event => setUpdateForm(form => ({ ...form, email: event.target.value }))}
                placeholder="correo@ejemplo.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 h-11 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="update-phone" className="text-sm font-medium text-slate-200">Teléfono</label>
              <Input
                id="update-phone"
                name="phone"
                type="tel"
                value={updateForm.phone}
                onChange={event => setUpdateForm(form => ({ ...form, phone: event.target.value }))}
                placeholder="+51 999 999 999"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20 h-11 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-6 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
              className="text-white border-white bg-transparent hover:bg-white/10 transition-colors h-11 px-6"
              disabled={updateLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmitUpdate}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/40"
              disabled={updateLoading}
            >
              {updateLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Assign Session Modal */}
      < Dialog open={isAssignModalOpen} onOpenChange={(open) => {
        setIsAssignModalOpen(open)
        if (!open) setAssignSearchQuery('')
      }
      }>
        <DialogContent
          className="bg-slate-900 border-slate-800 text-white sm:max-w-[440px]"
          overlayClassName="bg-black/80"
        >
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Asignar Sesión
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecciona un usuario para transferir esta conversación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                id="assign-search"
                name="assignSearch"
                value={assignSearchQuery}
                onChange={e => setAssignSearchQuery(e.target.value)}
                placeholder="Buscar usuario..."
                aria-label="Buscar usuario para asignar"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pl-10 h-11 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* User List */}
            <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredAssignees.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <UserPlus className="w-8 h-8 opacity-20" />
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                filteredAssignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    type="button"
                    onClick={() => handleAssignSelect(assignee.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-all group text-left border border-transparent hover:border-slate-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                      <div className="font-semibold text-indigo-400 text-sm">
                        {assignee.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{assignee.name}</p>
                      {assignee.email && (
                        <p className="text-xs text-slate-500 truncate">{assignee.email}</p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px]">
                        Asignar
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignModalOpen(false)
                setAssignSearchQuery('')
              }}
              className="text-white border-white bg-transparent hover:bg-white/10 transition-colors w-full sm:w-auto h-11 px-6"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >

      {/* Close Session Modal */}
      < Dialog open={isCloseSessionModalOpen} onOpenChange={setIsCloseSessionModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]" overlayClassName="bg-black/80">
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Finalizar Sesión
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete los detalles de la sesión antes de cerrar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <CloseSessionForm
              contactId={contactProfile.id || ''}
              sessionStartTime={sessionStartTime}
              onCancel={() => setIsCloseSessionModalOpen(false)}
              isLoading={closeSessionLoading}
              onSubmit={(data) => {
                if (!onCloseSession) return
                setCloseSessionLoading(true)
                onCloseSession(data)
                setCloseSessionLoading(false)
                setIsCloseSessionModalOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Details Modal */}
      < Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent
          className="bg-slate-900 border-slate-800 text-white sm:max-w-lg"
          overlayClassName="bg-black/80"
        >
          <DialogHeader className="border-b border-slate-800 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                  Detalle de Sesión
                </DialogTitle>
                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {selectedSession?.date ? new Date(selectedSession.date).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'Fecha no disponible'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-500" />
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {selectedSession?.date ? new Date(selectedSession.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              </div>
              {selectedSession?.interactionType && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 capitalize text-xs px-2.5 py-0.5 shadow-sm shadow-emerald-900/20">
                  {selectedSession.interactionType}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Resumen de IA
                </div>
                <div className="bg-[#09090b] p-4 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed max-h-[300px] overflow-y-auto shadow-inner">
                  {selectedSession.summary || (
                    <span className="text-slate-500 italic flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      No hay resumen disponible para esta sesión.
                    </span>
                  )}
                </div>
              </div>

              {/* Topics & Metadata */}
              {selectedSession.topics?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Temas Tratados</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1">
                        <MessageSquare className="w-3 h-3 mr-1.5 opacity-50" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Info */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Atendido por</p>
                    <p className="text-sm font-medium text-slate-200">{selectedSession.agentName || 'Sistema'}</p>
                  </div>
                </div>
                {selectedSession.duration && (
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Duración</p>
                    <p className="text-sm font-medium text-slate-200">{selectedSession.duration}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="pt-6 border-t border-slate-800">
            <Button
              onClick={() => setSelectedSession(null)}
              variant="outline"
              className="text-white border-white bg-transparent hover:bg-white/10 transition-colors h-11 px-6"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

    </div>
  )
}

export const crmPanelPlugin: PanelPlugin<{ crm: CrmPanelContext }> = {
  id: 'crm',
  label: 'CRM',
  title: 'Herramientas CRM',
  badge: 'Desktop',
  render: ({ crm }) => <CrmChatPanel {...crm} />,
}
