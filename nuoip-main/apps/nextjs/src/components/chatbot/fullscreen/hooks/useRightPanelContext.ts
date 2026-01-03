import { useCallback, useMemo, useRef } from 'react'

import type { AdminPanelContext } from '@/domains/admin/panels/AdminOperationsPanel'
import type {
  CommunicationsPanelContext,
  CommunicationsBroadcastSummary,
} from '@/domains/communications/panels/CommunicationsPanel'
import type { CrmPanelContext, CrmPanelTab } from '@/domains/crm/panels/CrmChatPanel'
import type { CrmCustomerSummary, TicketRealtimeEvent, TicketRealtimeListener } from '@/domains/crm'
import type { TicketPanelCommand } from '@/domains/crm/panels/TicketPanel'

type NullableUser = {
  role?: string | null
  name?: string | null
  tenantId?: string | null
} | null | undefined

interface AdminContextInput {
  authUser: NullableUser
  dashboardUser: NullableUser
  contactCount: number
  crmCustomerCount: number
  paymentNotificationCount: number
  handlers: {
    openOverview: () => void
    openCrmHub: () => void
    goToCommunications: (view?: string) => void
    openSettings: () => void
  }
}

interface CommunicationsContextInput {
  unreadCount: number
  broadcasts: CommunicationsBroadcastSummary[]
  handlers: {
    openComposer: () => void
    openTemplates: () => void
    openStudio: () => void
    openSettings: () => void
  }
}

interface CrmContextInput {
  activeTab: CrmPanelTab
  setActiveTab: (tab: CrmPanelTab) => void
  hasCrmTools: boolean
  summary?: any
  activities?: any
  customers: CrmCustomerSummary[]
  loadingCustomers: boolean
  selectedCustomerId: string | null
  tenantId: string
  sessionToken: string | null
  currentUserId: string
  currentUserName: string
  assignees: CrmPanelContext['assignees']
  conversationMessages: CrmPanelContext['conversationMessages']
  contactProfile: CrmPanelContext['contactProfile']
  onRegisterContact: () => Promise<CrmCustomerSummary | null>
  onUpdateContact: (input: { name: string; email: string | null; phone: string | null; description?: string | null }) => Promise<boolean>
  sessionStartTime?: string
  ticketPanelCommand?: TicketPanelCommand | null
  onTicketPanelCommandHandled?: (commandId: string) => void
  handlers: Pick<
    CrmPanelContext,
    | 'onSelectCustomer'
    | 'onCreateCustomer'
    | 'onInsertTicketMessage'
  > & {
    onAssignTicket?: (ticketId: string, assigneeId: string) => void
    onScheduleFollowUp?: (customerId: string, date: Date) => void
    onConvertToCustomer?: (contactId: string) => void
    onLogNote?: (customerId: string, note: string) => void
    onRedirectTickets?: () => void
    onRequestNewCustomer?: () => void
    onCloseSession?: (data: { annotation: string; interactionType: string; needsFollowUp: boolean; followUpDate?: string }) => void
    onAssignSession?: (assigneeId: string) => void
  }
}

export interface RightPanelContext {
  crm: CrmPanelContext
  admin: AdminPanelContext
  communications: CommunicationsPanelContext
}

interface UseRightPanelContextParams {
  admin: AdminContextInput
  communications: CommunicationsContextInput
  crm: CrmContextInput
}

interface UseRightPanelContextResult extends RightPanelContext {
  admin: AdminPanelContext
  communications: CommunicationsPanelContext
  crm: CrmPanelContext
}

export function useRightPanelContext({
  admin,
  communications,
  crm,
}: UseRightPanelContextParams): UseRightPanelContextResult {
  const ticketEventListenersRef = useRef<Set<TicketRealtimeListener>>(new Set())

  const registerTicketEventListener = useCallback(
    (listener: TicketRealtimeListener) => {
      if (!listener) {
        return () => { }
      }
      ticketEventListenersRef.current.add(listener)
      return () => {
        ticketEventListenersRef.current.delete(listener)
      }
    },
    [],
  )

  const notifyTicketEvent = useCallback(
    (event: TicketRealtimeEvent) => {
      if (!event) {
        return
      }
      ticketEventListenersRef.current.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('useRightPanelContext: ticket listener failed', error)
        }
      })
    },
    [],
  )

  const adminPanelContext = useMemo<AdminPanelContext>(() => {
    const role = admin.authUser?.role ?? admin.dashboardUser?.role ?? 'user'
    const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Operador'
    const hasAccess = role === 'admin' || role === 'super_admin'
    const displayName = admin.authUser?.name ?? admin.dashboardUser?.name ?? 'Equipo FlowBot'
    const tenantId = admin.authUser?.tenantId ?? admin.dashboardUser?.tenantId ?? null
    const tenantLabel = tenantId ? `Tenant ${tenantId}` : 'Sin tenant asignado'

    return {
      displayName,
      roleLabel,
      tenantLabel,
      lastLoginLabel: null,
      hasAccess,
      metrics: [
        { label: 'Contactos', value: String(admin.contactCount) },
        { label: 'Clientes CRM', value: String(admin.crmCustomerCount) },
        { label: 'Pagos recientes', value: String(admin.paymentNotificationCount) },
      ],
      onOpenOverview: admin.handlers.openOverview,
      onOpenCrm: admin.handlers.openCrmHub,
      onOpenCommunications: admin.handlers.goToCommunications,
      onOpenSettings: admin.handlers.openSettings,
    }
  }, [
    admin.authUser,
    admin.dashboardUser,
    admin.contactCount,
    admin.crmCustomerCount,
    admin.paymentNotificationCount,
    admin.handlers,
  ])

  const communicationsPanelContext = useMemo<CommunicationsPanelContext>(() => ({
    unreadCount: communications.unreadCount,
    recentBroadcasts: communications.broadcasts,
    onOpenComposer: communications.handlers.openComposer,
    onOpenTemplates: communications.handlers.openTemplates,
    onOpenStudio: communications.handlers.openStudio,
    onOpenSettings: communications.handlers.openSettings,
  }), [
    communications.unreadCount,
    communications.broadcasts,
    communications.handlers,
  ])

  const crmPanelContext = useMemo<CrmPanelContext>(() => ({
    activeTab: crm.activeTab,
    onChangeTab: crm.setActiveTab,
    hasCrmTools: crm.hasCrmTools,
    customers: crm.customers.map(customer => ({
      id: customer.id,
      tenantId: customer.tenantId ?? crm.tenantId ?? '',
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      type: customer.type,
      status: customer.status ?? null,
    })),
    loadingCustomers: crm.loadingCustomers,
    selectedCustomerId: crm.selectedCustomerId,
    tenantId: crm.tenantId,
    sessionToken: crm.sessionToken,
    currentUserId: crm.currentUserId,
    currentUserName: crm.currentUserName,
    assignees: crm.assignees,
    conversationMessages: crm.conversationMessages,
    contactProfile: crm.contactProfile,
    onRegisterContact: crm.onRegisterContact,
    onUpdateContact: crm.onUpdateContact,
    ticketPanelCommand: crm.ticketPanelCommand,
    onTicketPanelCommandHandled: crm.onTicketPanelCommandHandled,
    onSelectCustomer: crm.handlers.onSelectCustomer,
    onCreateCustomer: crm.handlers.onCreateCustomer,
    onInsertTicketMessage: crm.handlers.onInsertTicketMessage,
    registerTicketEventListener,
    notifyTicketEvent,
    onCloseSession: crm.handlers.onCloseSession,
    onAssignSession: crm.handlers.onAssignSession,
    sessionStartTime: crm.sessionStartTime,
  }), [
    crm.activeTab,
    crm.setActiveTab,
    crm.hasCrmTools,
    crm.customers,
    crm.loadingCustomers,
    crm.selectedCustomerId,
    crm.tenantId,
    crm.sessionToken,
    crm.currentUserId,
    crm.currentUserName,
    crm.assignees,
    crm.conversationMessages,
    crm.sessionStartTime,
    crm.contactProfile,
    crm.onRegisterContact,
    crm.onUpdateContact,
    crm.ticketPanelCommand,
    crm.onTicketPanelCommandHandled,
    crm.handlers,
    registerTicketEventListener,
    notifyTicketEvent,
  ])

  return useMemo<UseRightPanelContextResult>(() => ({
    admin: adminPanelContext,
    communications: communicationsPanelContext,
    crm: crmPanelContext,
  }), [adminPanelContext, communicationsPanelContext, crmPanelContext])
}
