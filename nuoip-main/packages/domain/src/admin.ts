import type { Tenant, User } from '@prisma/client'

export interface TenantSummary {
  id: Tenant['id']
  name: Tenant['name']
  domain?: Tenant['domain']
  isActive: Tenant['isActive']
  displayName?: Tenant['displayName']
  createdAt: string
  updatedAt: string
}

export interface TenantPreferencePayload {
  settings?: Record<string, unknown> | null
  chatbotConfig?: Record<string, unknown> | null
}

export interface AdminUserSummary {
  id: User['id']
  email: User['email']
  role: User['role']
  tenantId: User['tenantId']
  status: User['status']
  approvedAt?: string | null
}

export interface PaymentLinkPayload {
  id: string
  tenantId: string
  amount: number
  currency: string
  description?: string
  status: 'draft' | 'active' | 'paid' | 'cancelled'
  createdAt: string
}

export interface TicketSummary {
  id: string
  tenantId: string
  title: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
}
