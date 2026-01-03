import type { CrmGatewayAdapter, CrmCustomerSummary } from '../facade'

const withAuthHeaders = (sessionToken?: string): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (sessionToken) {
    return { ...headers, Authorization: `Bearer ${sessionToken}` }
  }
  return headers
}

const mapCustomer = (input: any): CrmCustomerSummary | null => {
  if (!input || typeof input !== 'object') {
    return null
  }

  if (typeof input.id !== 'string' || typeof input.tenantId !== 'string') {
    return null
  }

  return {
    id: input.id,
    tenantId: input.tenantId,
    name: typeof input.name === 'string' ? input.name : 'Sin nombre',
    email: typeof input.email === 'string' ? input.email : null,
    phone: typeof input.phone === 'string' ? input.phone : null,
    type: input.type === 'contact' ? 'contact' : 'lead',
    status: typeof input.status === 'string' ? input.status : null,
  }
}

export interface HttpCrmGatewayOptions {
  sessionToken?: string | null
}

export const createHttpCrmGateway = ({ sessionToken }: HttpCrmGatewayOptions = {}): CrmGatewayAdapter => {
  const authHeaders = withAuthHeaders(sessionToken ?? undefined)

  return {
    async listCustomers(query) {
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tenantId: query.tenantId,
          phone: query.phone ?? null,
          email: query.email ?? null,
          search: query.search ?? null,
          limit: query.limit ?? 25,
        }),
      })

      if (!response.ok) {
        throw new Error(`CRM listCustomers failed with status ${response.status}`)
      }

      const payload = await response.json().catch(() => ({}))
      if (!payload?.success || !Array.isArray(payload.customers)) {
        return []
      }

      return payload.customers
        .map(mapCustomer)
        .filter((customer): customer is CrmCustomerSummary => Boolean(customer))
    },

    async selectCustomer(command) {
      const response = await fetch('/api/crm/select-customer', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          sessionId: command.sessionId,
          tenantId: command.tenantId,
          customerId: command.customerId,
          customerType: command.customerType,
          initiatedBy: command.initiatedBy,
        }),
      })

      if (!response.ok) {
        throw new Error(`CRM selectCustomer failed with status ${response.status}`)
      }
    },

    async createTicket(command) {
      const response = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tenantId: command.tenantId,
          contactId: command.contactId,
          requestedBy: command.requestedBy,
          metadata: command.metadata ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(`CRM createTicket failed with status ${response.status}`)
      }
    },

    async createCustomer(command) {
      const response = await fetch('/api/crm/create-customer', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tenantId: command.tenantId,
          name: command.name,
          email: command.email,
          phone: command.phone,
          sessionId: command.sessionId ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(`CRM createCustomer failed with status ${response.status}`)
      }

      const payload = await response.json().catch(() => null)
      if (!payload?.success || !payload.customer) {
        throw new Error('CRM createCustomer returned invalid payload')
      }

      const mapped = mapCustomer(payload.customer)
      if (!mapped) {
        throw new Error('CRM createCustomer returned malformed customer data')
      }

      return mapped
    },

    async createFullTicket(command) {
      const response = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`CRM createFullTicket failed with status ${response.status}`)
      }

      const payload = await response.json()
      return payload.ticket
    },

    async listTickets(query) {
      const params = new URLSearchParams()
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/crm/tickets?${params}`, {
        method: 'GET',
        headers: authHeaders,
      })

      if (!response.ok) {
        throw new Error(`CRM listTickets failed with status ${response.status}`)
      }

      const payload = await response.json()
      return payload.tickets || []
    },

    async getTicket(ticketId, tenantId) {
      const response = await fetch(`/api/crm/tickets/${ticketId}?tenantId=${tenantId}`, {
        method: 'GET',
        headers: authHeaders,
      })

      if (!response.ok) {
        throw new Error(`CRM getTicket failed with status ${response.status}`)
      }

      const payload = await response.json()
      return payload.ticket
    },

    async updateTicket(command) {
      const response = await fetch(`/api/crm/tickets/${command.ticketId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`CRM updateTicket failed with status ${response.status}`)
      }
    },

    async addTicketComment(command) {
      const response = await fetch(`/api/crm/tickets/${command.ticketId}/comments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`CRM addTicketComment failed with status ${response.status}`)
      }
    },
  }
}
