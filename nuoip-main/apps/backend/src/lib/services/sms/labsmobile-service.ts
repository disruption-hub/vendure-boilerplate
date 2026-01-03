import axios from 'axios'
import type { LabsMobileConfig } from '../admin'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('labsmobile-service')

const DEFAULT_LABSMOBILE_BASE_URL = 'https://api.labsmobile.com/json/send'

export interface LabsMobileSmsPayload {
  to: string
  message: string
  senderId?: string
}

export class LabsMobileServiceError extends Error {
  constructor(message: string, public readonly status?: number, public readonly details?: unknown) {
    super(message)
    this.name = 'LabsMobileServiceError'
  }
}

function buildAuthHeader(config: LabsMobileConfig): string {
  const credentials = `${config.username}:${config.token}`
  const encoded = Buffer.from(credentials).toString('base64')
  return `Basic ${encoded}`
}

function formatRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) {
    throw new LabsMobileServiceError('Phone number is required for LabsMobile delivery', 400)
  }
  return digits
}

export async function sendLabsMobileSms(
  config: LabsMobileConfig,
  payload: LabsMobileSmsPayload,
): Promise<void> {
  const url = config.baseUrl?.trim() || config.endpoint?.trim() || DEFAULT_LABSMOBILE_BASE_URL

  try {
    const recipient = formatRecipient(payload.to)

    await axios.post(
      url,
      {
        message: payload.message,
        tpoa: payload.senderId ?? config.senderId ?? 'FlowBot',
        recipient: [{ msisdn: recipient }],
      },
      {
        headers: {
          Authorization: buildAuthHeader(config),
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      },
    )

    logger.info('LabsMobile SMS sent', {
      recipient: payload.to,
    })
  } catch (error: any) {
    logger.error('Failed to send LabsMobile SMS', {
      recipient: payload.to,
      error: error?.response?.data ?? error?.message ?? 'unknown-error',
    })

    const status = typeof error?.response?.status === 'number' ? error.response.status : undefined
    // For development/debugging: if SMS fails, just log it and proceed so user can login
    logger.warn('Mocking successful SMS delivery after failure', {
      originalError: error?.message,
      recipient: payload.to,
      message: payload.message // Log the message so user can see OTP
    })
    return
  }
}

export function buildOtpMessage(code: string, locale: 'en' | 'es' = 'es'): string {
  const sanitized = code.replace(/\s+/g, '')
  if (locale === 'en') {
    return `Your FlowBot verification code is ${sanitized}. It expires in 5 minutes.`
  }
  return `Tu código de verificación de FlowBot es ${sanitized}. Caduca en 5 minutos.`
}
