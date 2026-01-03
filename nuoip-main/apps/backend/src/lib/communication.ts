interface ServiceOptions {
  tenantId?: string | null
}

interface WhatsAppPayload {
  to: string
  message: string
}

interface TelegramPayload {
  chatId: string
  message: string
}

interface InstagramPayload {
  to: string
  message: string
}

export class CommunicationService {
  constructor(private readonly options: ServiceOptions = {}) {}

  private ensureTarget(target: string | null | undefined, channel: string) {
    if (!target || !target.trim()) {
      throw new Error(`Missing recipient for ${channel}`)
    }
  }

  async sendWhatsAppMessage(payload: WhatsAppPayload): Promise<void> {
    this.ensureTarget(payload.to, 'whatsapp')
    if (!payload.message?.trim()) {
      throw new Error('Message is required for WhatsApp delivery')
    }
    console.debug('[CommunicationHub] WhatsApp dispatch', {
      tenantId: this.options.tenantId ?? 'system',
      to: payload.to,
    })
  }

  async sendTelegramMessage(payload: TelegramPayload): Promise<void> {
    this.ensureTarget(payload.chatId, 'telegram')
    if (!payload.message?.trim()) {
      throw new Error('Message is required for Telegram delivery')
    }
    console.debug('[CommunicationHub] Telegram dispatch', {
      tenantId: this.options.tenantId ?? 'system',
      chatId: payload.chatId,
    })
  }

  async sendInstagramMessage(payload: InstagramPayload): Promise<void> {
    this.ensureTarget(payload.to, 'instagram')
    if (!payload.message?.trim()) {
      throw new Error('Message is required for Instagram delivery')
    }
    console.debug('[CommunicationHub] Instagram dispatch', {
      tenantId: this.options.tenantId ?? 'system',
      to: payload.to,
    })
  }
}
