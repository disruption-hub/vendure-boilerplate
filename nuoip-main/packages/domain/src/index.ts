export interface HealthPayload {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
}

export type {
  Tenant,
  User,
  WhatsAppSession,
  WhatsAppMessage,
  ScheduledMessage,
} from '@prisma/client'

export { ChatbotContactType, TenantApprovalStatus, UserRole, UserStatus } from '@prisma/client'

export * from './admin'
export * from './auth'
export * from './realtime'
