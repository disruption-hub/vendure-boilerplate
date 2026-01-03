'use server'

import { updateConversationState } from '@/lib/chatbot/conversation-state'

import type { CrmGatewayAdapter } from '../facade'
import type {
  AddTicketCommentCommand,
  CreateCustomerCommand,
  CreateTicketCommand,
  ListCustomersQuery,
  ListTicketsQuery,
  RequestTicketCommand,
  SelectCustomerCommand,
  TicketDetails,
  TicketSummary,
  UpdateTicketCommand,
} from '../contracts'
import type { PaymentContext } from '@/lib/chatbot/types'

const DEFAULT_LIMIT = 10

export function createChatbotCrmGateway(): CrmGatewayAdapter {
  return {
    async listCustomers(query: ListCustomersQuery) {
      try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const params = new URLSearchParams({
          ...(query.phone ? { phone: query.phone } : {}),
          ...(query.email ? { email: query.email } : {}),
          ...(query.tenantId ? { tenantId: query.tenantId } : {}),
          limit: (query.limit ?? DEFAULT_LIMIT).toString(),
        })

        const response = await fetch(`${backendUrl}/api/v1/crm/customers/search?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('[CRM Gateway] Failed to fetch customers from backend', { status: response.status })
          return []
        }

        const customers = await response.json()

        return customers.map((customer: any) => ({
          id: customer.id,
          tenantId: query.tenantId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          type: customer.type,
          status: customer.status,
        }))
      } catch (error) {
        console.error('[CRM Gateway] Error fetching customers', error)
        return []
      }
    },

    async selectCustomer(command: SelectCustomerCommand) {
      await updateConversationState(command.sessionId, command.tenantId, {
        paymentContext: {
          selectedCustomerId: command.customerId,
          selectedCustomerType: command.customerType,
        } as Partial<PaymentContext> as PaymentContext,
      })
    },

    async createTicket(_command: RequestTicketCommand) {
      return Promise.resolve()
    },

    async createCustomer(_command: CreateCustomerCommand) {
      return Promise.reject(new Error('createCustomer is not supported in chatbot gateway'))
    },

    async createFullTicket(_command: CreateTicketCommand): Promise<TicketDetails> {
      return Promise.reject(new Error('createFullTicket is not supported in chatbot gateway'))
    },

    async listTickets(_query: ListTicketsQuery): Promise<TicketSummary[]> {
      return Promise.reject(new Error('listTickets is not supported in chatbot gateway'))
    },

    async getTicket(_ticketId: string, _tenantId: string): Promise<TicketDetails> {
      return Promise.reject(new Error('getTicket is not supported in chatbot gateway'))
    },

    async updateTicket(_command: UpdateTicketCommand) {
      return Promise.reject(new Error('updateTicket is not supported in chatbot gateway'))
    },

    async addTicketComment(_command: AddTicketCommentCommand) {
      return Promise.reject(new Error('addTicketComment is not supported in chatbot gateway'))
    },
  }
}
