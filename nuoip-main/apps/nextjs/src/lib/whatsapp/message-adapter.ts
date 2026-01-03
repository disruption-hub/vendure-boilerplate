import type { Message } from '@/components/chatbot/types'

export type WhatsAppMessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface WhatsAppMessageDto {
  id: string
  messageId: string
  fromMe: boolean
  content: string | null
  timestamp: string | Date
  status: WhatsAppMessageStatus
  remoteJid?: string | null
  metadata?: Record<string, unknown> | null
}

const STATUS_TO_DELIVERY: Record<WhatsAppMessageStatus, Message['deliveryStatus']> = {
  PENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'sent',
}

function coerceDate(input: string | Date): Date {
  if (input instanceof Date) {
    return input
  }

  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function mapWhatsAppDtoToMessage(dto: WhatsAppMessageDto): Message {
  const timestamp = coerceDate(dto.timestamp)
  const deliveryStatus = STATUS_TO_DELIVERY[dto.status] ?? 'sent'
  const role: Message['role'] = dto.fromMe ? 'user' : 'assistant'

  // Ensure content is never completely empty - provide fallback for better UX
  let content = dto.content ?? ''
  if (!content.trim()) {
    // If content is empty or whitespace, provide a fallback based on metadata
    if (dto.metadata?.messageType && dto.metadata.messageType !== 'TEXT') {
      content = `[${dto.metadata.messageType}]`
    } else {
      content = '[Message]'
    }
  }

  const message: Message = {
    id: dto.id,
    role,
    content,
    timestamp,
    type: 'text',
    deliveryStatus,
    status: deliveryStatus,
    metadata: {
      messageId: dto.messageId,
      remoteJid: dto.remoteJid ?? null,
      source: 'whatsapp',
      ...((dto.metadata as Record<string, unknown> | undefined) ?? {}),
    },
  }

  if (dto.status === 'READ') {
    message.readAt = timestamp
  } else if (dto.status === 'DELIVERED') {
    message.deliveredAt = timestamp
  }

  return message
}

export function updateMessageDeliveryState(
  message: Message,
  status: WhatsAppMessageStatus,
  deliveredAt?: Date | null,
  readAt?: Date | null,
): Message {
  const deliveryStatus = STATUS_TO_DELIVERY[status] ?? message.deliveryStatus ?? 'sent'

  return {
    ...message,
    deliveryStatus,
    status: deliveryStatus,
    deliveredAt: deliveredAt ?? message.deliveredAt ?? null,
    readAt: readAt ?? (status === 'READ' ? deliveredAt ?? new Date() : message.readAt ?? null),
  }
}
