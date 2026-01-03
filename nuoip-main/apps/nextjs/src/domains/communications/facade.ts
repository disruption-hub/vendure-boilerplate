import type {
  CommunicationsFacade,
  EnqueueNotificationCommand,
  EnqueueNotificationResult,
  StartCampaignCommand,
} from './contracts'
import { domainEvents } from '../events'
import type { DomainEventMap } from '../events'
import type { EventBus } from '@/core/messaging/event-bus'

export interface CommunicationsGatewayAdapter {
  startCampaign(command: StartCampaignCommand): Promise<void>
  enqueueNotification(command: EnqueueNotificationCommand): Promise<EnqueueNotificationResult>
}

export interface CommunicationsFacadeDependencies {
  gateway: CommunicationsGatewayAdapter
  events?: EventBus<DomainEventMap>
}

export const createCommunicationsFacade = ({ gateway, events = domainEvents }: CommunicationsFacadeDependencies): CommunicationsFacade => {
  return {
    async startCampaign(command) {
      await gateway.startCampaign(command)
      events.emit('communications:campaign.started', {
        campaignId: command.campaignId,
        tenantId: command.tenantId,
      })
    },

    async enqueueNotification(command) {
      const result = await gateway.enqueueNotification(command)
      events.emit('communications:notification.enqueued', {
        channel: command.channel,
        notificationId: `${command.channel}:${Date.now()}`,
      })
      return result
    },
  }
}

export type { EnqueueNotificationCommand, EnqueueNotificationResult, StartCampaignCommand }
