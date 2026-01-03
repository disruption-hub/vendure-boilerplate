export function buildUserThreadKey(userA: string, userB: string): string {
  return [userA, userB]
    .map(value => value.trim())
    .sort((a, b) => a.localeCompare(b))
    .join('--') // Use double-dash instead of colon (colon is invalid for Soketi/Pusher channels)
}

export interface ChatAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

export interface TenantUserThreadEvent {
  id: string
  tenantId: string
  threadKey: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
  attachments?: ChatAttachment[]
}

export interface TenantUserThreadReadEvent {
  tenantId: string
  threadKey: string
  readerId: string
  messageIds: string[]
  readAt: string
}

export interface TenantUserThreadDeliveredEvent {
  tenantId: string
  threadKey: string
  recipientId: string
  messageIds: string[]
  deliveredAt: string
}

export function buildPresenceThreadChannel(tenantId: string, threadKey: string): string {
  return `presence-tenant.${tenantId}.thread.${threadKey}`
}

export function buildPresenceTenantChannel(tenantId: string): string {
  return `presence-tenant.${tenantId}.online`
}
