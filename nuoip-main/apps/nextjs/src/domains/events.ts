import { createEventBus } from '@/core/messaging/event-bus'
import type { CommunicationChannelType } from '@/lib/communication/enums'

export interface ChatDomainEvents {
  'chat:message.sent': {
    sessionId: string
    messageId: string
    contentPreview: string
  }
  'chat:memory.updated': {
    sessionId: string
    memory: Record<string, unknown>
  }
  'chat:telemetry.logged': {
    contextId: string
    tenantId: string | null
    action: string
    level: 'debug' | 'info' | 'warn' | 'error'
    timestamp: string
    payload: Record<string, unknown>
  }
}

export interface CrmDomainEvents {
  'crm:customer.selected': {
    tenantId: string
    customerId: string
    source: 'chat' | 'dashboard'
  }
  'crm:customer.created': {
    tenantId: string
    customerId: string
    source: 'chat' | 'dashboard'
  }
  'crm:ticket.requested': {
    tenantId: string
    contactId: string
    requestedBy: 'agent' | 'automation'
  }
}

export interface AdminDomainEvents {
  'admin:settings.updated': {
    tenantId: string
    paths: string[]
  }
}

export interface CommunicationsDomainEvents {
  'communications:campaign.started': {
    campaignId: string
    tenantId: string
  }
  'communications:notification.enqueued': {
    notificationId: string
    channel: CommunicationChannelType | 'push'
  }
}

export type DomainEventMap = (ChatDomainEvents & CrmDomainEvents & AdminDomainEvents & CommunicationsDomainEvents) & Record<string, unknown>

export const domainEvents = createEventBus<DomainEventMap>()
