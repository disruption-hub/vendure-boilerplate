export interface CrmCustomerSummary {
  id: string
  tenantId: string
  name: string
  email?: string | null
  phone?: string | null
  type: 'lead' | 'contact'
  status?: string | null
}

export interface ListCustomersQuery {
  tenantId: string
  phone?: string | null
  email?: string | null
  search?: string
  limit?: number
}

export interface SelectCustomerCommand {
  sessionId: string
  tenantId: string
  customerId: string
  customerType: 'lead' | 'contact'
  initiatedBy: 'chat' | 'dashboard'
}

export interface RequestTicketCommand {
  tenantId: string
  contactId: string
  requestedBy: 'agent' | 'automation'
  metadata?: Record<string, unknown>
}

// Ticket types
export type TicketType = 'help_desk' | 'system_feature' | 'system_bug'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketSentiment = 'positive' | 'neutral' | 'negative'

// Ticket summary for list views
export interface TicketSummary {
  id: string
  ticketNumber: string
  tenantId: string
  type: TicketType
  title: string
  status: TicketStatus
  priority: TicketPriority
  customerName: string
  customerEmail?: string
  assignedToName?: string
  assignedTo?: string
  summary?: string
  sessionContext?: Record<string, unknown>
  tags: string[]
  unreadComments: number
  sentiment?: TicketSentiment
  sentimentSummary?: string
  createdAt: string
  updatedAt: string
  responseTargetAt?: string
  resolvedTargetAt?: string
  firstResponseAt?: string
  resolvedAt?: string
}

// Full ticket details
export interface TicketDetails {
  id: string
  ticketNumber: string
  tenantId: string
  type: TicketType
  title: string
  description: string
  summary?: string
  status: TicketStatus
  priority: TicketPriority
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  createdById: string
  createdByName: string
  assignedToId?: string
  assignedToName?: string
  messageId?: string
  threadId?: string
  sessionContext?: Record<string, unknown>
  tags: string[]
  responseTargetAt?: string
  resolvedTargetAt?: string
  firstResponseAt?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
  comments: TicketCommentDetails[]
  attachments: TicketAttachmentDetails[]
  sentiment?: TicketSentiment
  sentimentSummary?: string
}

export interface TicketCommentDetails {
  id: string
  ticketId: string
  ticketNumber?: string
  updateCode?: string
  authorId: string
  authorName: string
  content: string
  isInternal: boolean
  isAiGenerated: boolean
  createdAt: string
  updatedAt: string
  attachments: TicketCommentAttachmentDetails[]
}

export interface TicketAttachmentDetails {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedById: string
  uploadedByName: string
  createdAt: string
}

export interface TicketCommentAttachmentDetails {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

export type TicketRealtimeEvent =
  | {
      type: 'created'
      tenantId: string
      ticketId: string
      customerId?: string | null
      ticketType?: string | null
      priority?: string | null
      title?: string | null
      receivedAt: string
    }
  | {
      type: 'updated'
      tenantId: string
      ticketId: string
      status?: TicketStatus | null
      priority?: TicketPriority | null
      assignedToId?: string | null
      receivedAt: string
    }
  | {
      type: 'comment_added'
      tenantId: string
      ticketId: string
      commentId: string
      authorId: string
      authorName: string
      isInternal: boolean
      content?: string | null
      receivedAt: string
    }

export type TicketRealtimeListener = (event: TicketRealtimeEvent) => void

// Commands
export interface CreateTicketCommand {
  tenantId: string
  type: TicketType
  title: string
  description: string
  priority: TicketPriority
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  createdById: string
  assignedToId?: string
  messageId?: string
  threadId?: string
  sessionContext?: Record<string, unknown>
  tags?: string[]
  attachments?: Array<{
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
  }>
}

export interface CreateCustomerCommand {
  tenantId: string
  name: string
  email: string
  phone: string
  sessionId?: string | null
}

export interface UpdateTicketCommand {
  ticketId: string
  tenantId: string
  userId: string
  status?: TicketStatus
  priority?: TicketPriority
  assignedToId?: string
  tags?: string[]
}

export interface AddTicketCommentCommand {
  ticketId: string
  tenantId: string
  authorId: string
  content: string
  isInternal: boolean
  attachments?: Array<{
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
  }>
}

export interface ListTicketsQuery {
  tenantId: string
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  assignedToId?: string
  customerId?: string
  search?: string
  limit?: number
  offset?: number
}

export interface CrmFacade {
  listCustomers(query: ListCustomersQuery): Promise<CrmCustomerSummary[]>
  selectCustomer(command: SelectCustomerCommand): Promise<void>
  requestTicket(command: RequestTicketCommand): Promise<void>
  createCustomer(command: CreateCustomerCommand): Promise<CrmCustomerSummary>
  
  // Ticket methods
  createTicket(command: CreateTicketCommand): Promise<TicketDetails>
  listTickets(query: ListTicketsQuery): Promise<TicketSummary[]>
  getTicket(ticketId: string, tenantId: string): Promise<TicketDetails>
  updateTicket(command: UpdateTicketCommand): Promise<void>
  addTicketComment(command: AddTicketCommentCommand): Promise<void>
}
