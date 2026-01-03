import type { AdminFacade, AdminSettingsSnapshot, UpdateSettingsCommand } from './contracts'
import { domainEvents } from '../events'
import type { DomainEventMap } from '../events'
import type { EventBus } from '@/core/messaging/event-bus'

export interface AdminGatewayAdapter {
  updateSettings(command: UpdateSettingsCommand): Promise<AdminSettingsSnapshot>
}

export interface AdminFacadeDependencies {
  gateway: AdminGatewayAdapter
  events?: EventBus<DomainEventMap>
}

export const createAdminFacade = ({ gateway, events = domainEvents }: AdminFacadeDependencies): AdminFacade => {
  return {
    async updateSettings(command) {
      const snapshot = await gateway.updateSettings(command)
      events.emit('admin:settings.updated', {
        tenantId: command.tenantId,
        paths: command.paths,
      })
      return snapshot
    },
  }
}
