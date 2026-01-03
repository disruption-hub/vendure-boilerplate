import type {
  CommunicationsGatewayAdapter,
  EnqueueNotificationCommand,
  EnqueueNotificationResult,
  StartCampaignCommand,
} from '../facade'
import { EnqueueNotificationResultSchema } from '../contracts'
import { requestJson } from '@/lib/http/request-json'

interface HttpCommunicationsGatewayOptions {
  sessionToken?: string | null
}

function buildHeaders(sessionToken?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }
  return headers
}

export function createHttpCommunicationsGateway(
  options: HttpCommunicationsGatewayOptions = {},
): CommunicationsGatewayAdapter {
  const { sessionToken } = options

  return {
    async startCampaign(command: StartCampaignCommand): Promise<void> {
      const response = await fetch('/api/admin/communications/campaigns/start', {
        method: 'POST',
        headers: buildHeaders(sessionToken),
        body: JSON.stringify({
          campaignId: command.campaignId,
          tenantId: command.tenantId,
          templateId: command.templateId,
          audienceSize: command.audienceSize,
          scheduledFor: command.scheduledFor ? new Date(command.scheduledFor).toISOString() : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to start campaign (${response.status})`)
      }
    },

    async enqueueNotification(command: EnqueueNotificationCommand): Promise<EnqueueNotificationResult> {
      return requestJson('/api/admin/communications/send', EnqueueNotificationResultSchema, {
        init: {
          method: 'POST',
          headers: buildHeaders(sessionToken),
          body: JSON.stringify({
            channel: command.channel,
            recipients: command.recipients,
            subject: command.subject,
            text: command.text ?? command.message,
            html: command.html,
            message: command.message ?? command.text,
          }),
        },
      })
    },
  }
}

export type { HttpCommunicationsGatewayOptions }
