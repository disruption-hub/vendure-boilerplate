import { z } from 'zod'

export type CommunicationChannelType = 'EMAIL' | 'SMS' | 'TELEGRAM' | 'WHATSAPP' | 'INSTAGRAM'

export interface StartCampaignCommand {
  campaignId: string
  tenantId: string
  templateId: string
  audienceSize: number
  scheduledFor?: Date | string
}

export interface EnqueueNotificationCommand {
  tenantId?: string | null
  channel: CommunicationChannelType
  recipients: string[]
  subject?: string
  text?: string
  html?: string
  message?: string
}

export interface EnqueueNotificationResult {
  success: boolean
  summary: {
    total: number
    success: number
    failed: number
  }
  results: Array<{ recipient: string; success: boolean; error?: string }>
}

export const EnqueueNotificationResultSchema = z
  .object({
    success: z.boolean(),
    summary: z.object({
      total: z.number().int().nonnegative(),
      success: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
    }),
    results: z.array(
      z.object({
        recipient: z.string(),
        success: z.boolean(),
        error: z.string().optional(),
      }).passthrough(),
    ),
  })
  .passthrough()

export interface CommunicationsFacade {
  startCampaign(command: StartCampaignCommand): Promise<void>
  enqueueNotification(command: EnqueueNotificationCommand): Promise<EnqueueNotificationResult>
}
