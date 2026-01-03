export interface RealtimeConfigPayload {
  key: string
  host: string
  port: number
  useTLS: boolean
  cluster: string
}

export interface RealtimeAuthPayload {
  auth: string
  channel_data?: string
}

export interface TenantThreadEventPayload {
  tenantId: string
  threadKey: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}

export interface WhatsappEventPayload {
  sessionId: string
  tenantId: string
  eventName: string
  payload: Record<string, unknown>
  timestamp: number
}
