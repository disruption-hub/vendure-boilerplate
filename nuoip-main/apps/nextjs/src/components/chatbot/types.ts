import type { PaymentNotificationRecord } from '@/types/payment-notification'

export interface ChatQuickAction {
  label: string
  action: string
  id?: string
}

export interface ChatAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type: 'text' | 'search_result' | 'payment_notification'
  quickActions?: ChatQuickAction[]
  readAt?: Date | null
  deliveredAt?: Date | null
  deliveryStatus?: 'scheduled' | 'sending' | 'sent' | 'delivered' | 'read'
  status?: 'scheduled' | 'sending' | 'sent' | 'delivered' | 'read'
  editedAt?: Date | null
  isDeleted?: boolean
  deletedAt?: Date | null
  attachments?: ChatAttachment[]
  scheduledFor?: Date | null
  scheduledForRaw?: string | null
  paymentNotification?: PaymentNotificationRecord
  metadata?: Record<string, unknown> | null
}

// Shared sidebar/chat contact types
export interface SidebarEntry {
  id: string
  name: string
  subtitle?: string | null
  lastMessage: string
  lastActivity?: Date
  isFlowbot: boolean
  avatarUrl?: string | null
  isOnline?: boolean
  unreadCount?: number
  sessionStatus?: 'open' | 'closed'
  sessionStartTime?: string | Date
  avatar?: string | null
  type?: string
  assignee?: {
    id: string
    name: string
    color?: string
  } | null
}

export interface ChatContactLite {
  id?: string
  name?: string
  type?: string
  avatar?: string | null
  subtitle?: string | null
}
