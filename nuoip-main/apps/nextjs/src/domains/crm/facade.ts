import type { 
  CrmFacade, 
  CrmCustomerSummary, 
  ListCustomersQuery, 
  RequestTicketCommand, 
  SelectCustomerCommand,
  CreateTicketCommand,
  UpdateTicketCommand,
  AddTicketCommentCommand,
  ListTicketsQuery,
  TicketSummary,
  TicketDetails,
  CreateCustomerCommand
} from './contracts'
import { domainEvents } from '../events'
import type { DomainEventMap } from '../events'
import type { EventBus } from '@/core/messaging/event-bus'

export interface CrmGatewayAdapter {
  listCustomers(query: ListCustomersQuery): Promise<CrmCustomerSummary[]>
  selectCustomer(command: SelectCustomerCommand): Promise<void>
  createTicket(command: RequestTicketCommand): Promise<void>
  createCustomer(command: CreateCustomerCommand): Promise<CrmCustomerSummary>
  
  // Full ticket methods
  createFullTicket(command: CreateTicketCommand): Promise<TicketDetails>
  listTickets(query: ListTicketsQuery): Promise<TicketSummary[]>
  getTicket(ticketId: string, tenantId: string): Promise<TicketDetails>
  updateTicket(command: UpdateTicketCommand): Promise<void>
  addTicketComment(command: AddTicketCommentCommand): Promise<void>
}

export interface CrmFacadeDependencies {
  gateway: CrmGatewayAdapter
  events?: EventBus<DomainEventMap>
}

export const createCrmFacade = ({ gateway, events = domainEvents }: CrmFacadeDependencies): CrmFacade => {
  return {
    async listCustomers(query) {
      return gateway.listCustomers(query)
    },

    async selectCustomer(command) {
      await gateway.selectCustomer(command)
      events.emit('crm:customer.selected', {
        tenantId: command.tenantId,
        customerId: command.customerId,
        source: command.initiatedBy,
      })
    },

    async createCustomer(command: CreateCustomerCommand) {
      const customer = await gateway.createCustomer(command)
      events.emit('crm:customer.created', {
        tenantId: command.tenantId,
        customerId: customer.id,
        source: 'chat',
      })
      return customer
    },

    async requestTicket(command) {
      await gateway.createTicket(command)
      events.emit('crm:ticket.requested', {
        tenantId: command.tenantId,
        contactId: command.contactId,
        requestedBy: command.requestedBy,
      })
    },
    
    async createTicket(command) {
      const ticket = await gateway.createFullTicket(command)
      events.emit('crm:ticket.created', {
        tenantId: command.tenantId,
        ticketId: ticket.id,
        customerId: command.customerId,
      })
      return ticket
    },
    
    async listTickets(query) {
      return gateway.listTickets(query)
    },
    
    async getTicket(ticketId, tenantId) {
      return gateway.getTicket(ticketId, tenantId)
    },
    
    async updateTicket(command) {
      await gateway.updateTicket(command)
      events.emit('crm:ticket.updated', {
        tenantId: command.tenantId,
        ticketId: command.ticketId,
      })
    },
    
    async addTicketComment(command) {
      await gateway.addTicketComment(command)
      events.emit('crm:ticket.comment_added', {
        tenantId: command.tenantId,
        ticketId: command.ticketId,
      })
    },
  }
}

export type {
  CrmCustomerSummary,
  ListCustomersQuery,
  RequestTicketCommand,
  SelectCustomerCommand,
  CreateTicketCommand,
  UpdateTicketCommand,
  AddTicketCommentCommand,
  ListTicketsQuery,
  TicketSummary,
  TicketDetails,
  CreateCustomerCommand,
}
