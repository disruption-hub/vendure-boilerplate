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

export type ChatbotDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read'

export interface ChatbotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type: 'text' | 'search_result' | 'payment_notification'
  deliveryStatus?: ChatbotDeliveryStatus
  status?: ChatbotDeliveryStatus
  readAt?: Date | null
  deliveredAt?: Date | null
  metadata?: Record<string, any>
}

const STATUS_TO_DELIVERY: Record<WhatsAppMessageStatus, ChatbotDeliveryStatus> = {
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

export function mapWhatsAppDtoToMessage(dto: WhatsAppMessageDto): ChatbotMessage {
  const timestamp = coerceDate(dto.timestamp)
  const deliveryStatus = STATUS_TO_DELIVERY[dto.status] ?? 'sent'
  const role: ChatbotMessage['role'] = dto.fromMe ? 'user' : 'assistant'

  const message: ChatbotMessage = {
    id: dto.id,
    role,
    content: dto.content ?? '',
    timestamp,
    type: 'text',
    deliveryStatus,
    status: deliveryStatus,
    metadata: {
      messageId: dto.messageId,
      remoteJid: dto.remoteJid ?? null,
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
  message: ChatbotMessage,
  status: WhatsAppMessageStatus,
  deliveredAt?: Date | null,
  readAt?: Date | null,
): ChatbotMessage {
  const deliveryStatus = STATUS_TO_DELIVERY[status] ?? message.deliveryStatus ?? 'sent'

  return {
    ...message,
    deliveryStatus,
    status: deliveryStatus,
    deliveredAt: deliveredAt ?? message.deliveredAt ?? null,
    readAt: readAt ?? (status === 'READ' ? deliveredAt ?? new Date() : message.readAt ?? null),
  }
}


